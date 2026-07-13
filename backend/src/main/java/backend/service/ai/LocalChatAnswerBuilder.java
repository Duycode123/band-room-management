package backend.service.ai;

import backend.dto.response.AiSuggestedRoomResponse;
import backend.entity.DiscountCode;
import backend.entity.RoomStatus;
import backend.repository.DiscountCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LocalChatAnswerBuilder {

    private final DiscountCodeRepository discountCodeRepository;

    public String build(
            ChatIntent intent,
            List<AiSuggestedRoomResponse> matchedRooms,
            List<AiSuggestedRoomResponse> allRooms
    ) {
        String normalizedMessage = intent.normalizedMessage();
        Integer people = intent.people();
        BigDecimal maxPrice = intent.maxPricePerHour();
        ChatTimeRange timeRange = intent.timeRange();

        Optional<String> directAnswer = buildDirectIntentAnswer(intent);
        if (directAnswer.isPresent()) {
            return directAnswer.get();
        }

        if (allRooms.isEmpty()) {
            return "Hiện hệ thống chưa có dữ liệu phòng. Bạn thử quay lại sau hoặc liên hệ nhân viên để được hỗ trợ nhé.";
        }

        if (intent.hasRequestedRoomName()) {
            return buildRequestedRoomAnswer(intent, matchedRooms, allRooms);
        }

        if (isAskingOtherRooms(normalizedMessage)) {
            return buildOtherRoomsAnswer(matchedRooms.isEmpty() ? allRooms : matchedRooms);
        }

        if (isAskingCheapestRoom(normalizedMessage)) {
            return buildCheapestRoomAnswer(matchedRooms.isEmpty() ? allRooms : matchedRooms);
        }

        if (isAskingRoomKnowledge(normalizedMessage) || intent.hasEquipmentFilter()) {
            return buildRoomKnowledgeAnswer(
                    matchedRooms.isEmpty() && intent.hasEquipmentFilter() ? allRooms : (matchedRooms.isEmpty() ? allRooms : matchedRooms),
                    normalizedMessage,
                    intent.equipmentKeywords()
            );
        }

        if (isAskingAllRooms(normalizedMessage)) {
            return buildAllRoomsAnswer(allRooms);
        }

        if (matchedRooms.isEmpty()) {
            return buildNoRoomAnswer(allRooms, people, maxPrice, timeRange, intent.equipmentKeywords());
        }

        if (people != null) {
            return buildPeopleMatchAnswer(matchedRooms, people, maxPrice, timeRange);
        }

        if (maxPrice != null) {
            return buildBudgetMatchAnswer(matchedRooms, maxPrice, timeRange);
        }

        if (timeRange != null) {
            return buildAvailabilityMatchAnswer(matchedRooms, timeRange);
        }

        return "Mình tìm thấy "
                + matchedRooms.size()
                + " phòng phù hợp. Bạn có thể tham khảo: "
                + formatRoomList(matchedRooms.stream().limit(3).toList())
                + ". Nếu cho mình thêm số người, ngân sách hoặc khung giờ, mình sẽ lọc sát hơn.";
    }

    private String buildRequestedRoomAnswer(
            ChatIntent intent,
            List<AiSuggestedRoomResponse> matchedRooms,
            List<AiSuggestedRoomResponse> allRooms
    ) {
        String requestedName = intent.requestedRoomName().trim();
        if (matchedRooms.isEmpty()) {
            if (allRooms.isEmpty()) {
                return "Mình không tìm thấy phòng tên \""
                        + requestedName
                        + "\" trong hệ thống. Bạn hỏi \"Cho tôi xem tất cả phòng đang có\" để xem danh sách nhé.";
            }
            return "Mình không tìm thấy phòng tên \""
                    + requestedName
                    + "\" trong hệ thống. Các phòng đang có thể tham khảo: "
                    + formatRoomList(allRooms.stream().limit(3).toList())
                    + ". Bạn gõ đúng tên phòng nếu muốn mình tư vấn chi tiết.";
        }

        List<AiSuggestedRoomResponse> rooms = matchedRooms;
        if (intent.people() != null) {
            List<AiSuggestedRoomResponse> fitPeople = rooms.stream()
                    .filter(room -> room.getCapacity() != null && room.getCapacity() >= intent.people())
                    .toList();
            if (fitPeople.isEmpty()) {
                AiSuggestedRoomResponse room = rooms.getFirst();
                return "Có phòng \""
                        + room.getRoomName()
                        + "\" trong hệ thống, nhưng sức chứa tối đa "
                        + (room.getCapacity() == null ? "không rõ" : room.getCapacity())
                        + " người nên chưa phù hợp cho "
                        + intent.people()
                        + " người. Bạn muốn mình gợi ý phòng khác đủ chỗ không?";
            }
            rooms = fitPeople;
        }

        if (intent.maxPricePerHour() != null) {
            List<AiSuggestedRoomResponse> fitBudget = rooms.stream()
                    .filter(room -> room.getPricePerHour() != null
                            && room.getPricePerHour().compareTo(intent.maxPricePerHour()) <= 0)
                    .toList();
            if (fitBudget.isEmpty()) {
                AiSuggestedRoomResponse room = rooms.getFirst();
                return "Có phòng \""
                        + room.getRoomName()
                        + "\", giá "
                        + AiChatText.formatMoney(room.getPricePerHour())
                        + "/giờ, cao hơn ngân sách "
                        + AiChatText.formatMoney(intent.maxPricePerHour())
                        + "/giờ của bạn. Bạn muốn mình tìm phòng trong ngân sách đó không?";
            }
            rooms = fitBudget;
        }

        return "Thông tin phòng bạn hỏi: "
                + rooms.stream().limit(3).map(this::formatDetailedRoom)
                .reduce((first, second) -> first + " | " + second)
                .orElse("không có dữ liệu")
                + ". Bạn muốn kiểm tra lịch trống theo khung giờ cụ thể không?";
    }

    private String buildOtherRoomsAnswer(List<AiSuggestedRoomResponse> rooms) {
        if (rooms.isEmpty()) {
            return "Mình đã gợi ý hết các phòng phù hợp hiện có. Bạn thử đổi số người, ngân sách hoặc khung giờ để mình lọc lại nhé.";
        }
        List<AiSuggestedRoomResponse> top = rooms.stream().limit(5).toList();
        return "Mình gợi ý thêm các phòng khác: "
                + formatRoomList(top)
                + ". Bạn muốn lọc theo số người, ngân sách, hay khung giờ cụ thể không?";
    }

    private String buildBudgetMatchAnswer(
            List<AiSuggestedRoomResponse> matchedRooms,
            BigDecimal maxPrice,
            ChatTimeRange timeRange
    ) {
        List<AiSuggestedRoomResponse> top = matchedRooms.stream().limit(3).toList();
        StringBuilder answer = new StringBuilder("Trong ngân sách ")
                .append(AiChatText.formatMoney(maxPrice))
                .append("/giờ, hiện có ")
                .append(matchedRooms.size())
                .append(" phòng phù hợp. Gợi ý: ")
                .append(formatRoomList(top))
                .append(".");
        if (timeRange == null) {
            answer.append(" Bạn muốn mình kiểm tra thêm lịch trống theo khung giờ không?");
        }
        return answer.toString();
    }

    private String buildAvailabilityMatchAnswer(
            List<AiSuggestedRoomResponse> matchedRooms,
            ChatTimeRange timeRange
    ) {
        List<AiSuggestedRoomResponse> top = matchedRooms.stream().limit(3).toList();
        return "Trong khung "
                + AiChatText.formatTime(timeRange.startTime())
                + " – "
                + AiChatText.formatTime(timeRange.endTime())
                + ", có "
                + matchedRooms.size()
                + " phòng còn trống. Bạn có thể chọn: "
                + formatRoomList(top)
                + ".";
    }

    private Optional<String> buildDirectIntentAnswer(ChatIntent intent) {
        String normalizedMessage = intent.normalizedMessage();
        String category = intent.category() == null ? "" : intent.category();

        if ("GREETING".equals(category) || isGreeting(normalizedMessage)) {
            return Optional.of("Chào bạn! Mình là BandBot của BandHub Studio. Bạn muốn tìm phòng theo số người, ngân sách, khung giờ, hay cần hướng dẫn đặt phòng?");
        }
        if ("OPENING_HOURS".equals(category) || isAskingOpeningHours(normalizedMessage)) {
            return Optional.of("Studio mở cửa từ 08:00 đến 24:00 mỗi ngày. Bạn có thể đặt online theo lịch trống của từng phòng. Ví dụ hỏi: \"Tối nay 18h-20h còn phòng nào cho 4 người?\"");
        }
        if ("CONTACT".equals(category) || isAskingContact(normalizedMessage)) {
            return Optional.of("Bạn có thể vào mục Trợ giúp trên website, hoặc liên hệ nhân viên qua hotline/email hỗ trợ để được xử lý nhanh hơn.");
        }
        if ("BOOKING_GUIDE".equals(category) || isAskingBookingGuide(normalizedMessage)) {
            return Optional.of("Để đặt phòng: 1) Chọn phòng phù hợp, 2) Chọn ngày & khung giờ trống, 3) Kiểm tra tổng tiền/mã giảm giá, 4) Xác nhận rồi thanh toán online. Cho mình số người và giờ tập nếu bạn muốn được gợi ý phòng trước.");
        }
        if ("PAYMENT".equals(category) || isAskingPayment(normalizedMessage)) {
            return Optional.of("Hệ thống hỗ trợ thanh toán online (VietQR/SePay). Ở checkout bạn có thể đặt cọc 50.000đ hoặc thanh toán toàn bộ. Booking chờ thanh toán có thể hết hạn nếu không hoàn tất kịp.");
        }
        if ("CANCELLATION".equals(category) || isAskingCancellation(normalizedMessage)) {
            return Optional.of("Bạn có thể hủy lịch trước giờ tập tối thiểu 24 tiếng theo chính sách hiện tại. Số tiền đã thanh toán sẽ được tính hoàn theo quy trình vận hành.");
        }
        if ("COUPON".equals(category) || isAskingCoupon(normalizedMessage)) {
            return Optional.of("Mã giảm giá nhập ở bước checkout. Hệ thống sẽ kiểm tra mã còn hạn và điều kiện đơn tối thiểu trước khi trừ tiền. "
                    + toCustomerCouponHint());
        }
        return Optional.empty();
    }

    private String toCustomerCouponHint() {
        String context = buildCouponContext();
        if (context.startsWith("Active coupons:")) {
            return "Hiện có mã đang hoạt động trong hệ thống; bạn nhập trực tiếp ở checkout để kiểm tra mức giảm cụ thể.";
        }
        return "Nếu bạn đã có mã, cứ nhập ở checkout để hệ thống xác nhận.";
    }

    private String buildPeopleMatchAnswer(
            List<AiSuggestedRoomResponse> matchedRooms,
            int people,
            BigDecimal maxPrice,
            ChatTimeRange timeRange
    ) {
        List<AiSuggestedRoomResponse> topRooms = matchedRooms.stream().limit(3).toList();
        AiSuggestedRoomResponse best = topRooms.get(0);

        StringBuilder answer = new StringBuilder();
        answer.append("Cho nhóm ")
                .append(people)
                .append(" người, hiện có ")
                .append(matchedRooms.size())
                .append(" phòng đủ sức chứa");
        if (maxPrice != null) {
            answer.append(" và trong ngân sách ").append(AiChatText.formatMoney(maxPrice)).append("/giờ");
        }
        answer.append(". ");

        answer.append("Ưu tiên: ")
                .append(best.getRoomName())
                .append(" (")
                .append(best.getRoomTypeName())
                .append(", ")
                .append(AiChatText.formatMoney(best.getPricePerHour()))
                .append("/giờ, tối đa ")
                .append(best.getCapacity())
                .append(" người)");

        if (topRooms.size() > 1) {
            answer.append(". Các lựa chọn khác: ")
                    .append(formatRoomList(topRooms.subList(1, topRooms.size())));
        }
        answer.append(".");

        if (timeRange == null) {
            answer.append(" Bạn muốn mình lọc theo khung giờ cụ thể không?");
        } else {
            answer.append(" Các phòng này còn trống từ ")
                    .append(AiChatText.formatTime(timeRange.startTime()))
                    .append(" đến ")
                    .append(AiChatText.formatTime(timeRange.endTime()))
                    .append(".");
        }

        return answer.toString();
    }

    public String buildCouponContext() {
        List<DiscountCode> activeCoupons;
        try {
            LocalDate today = LocalDate.now();
            activeCoupons = discountCodeRepository.findAll().stream()
                    .filter(coupon -> coupon.getExpiresAt() == null || !coupon.getExpiresAt().isBefore(today))
                    .sorted(Comparator.comparing(DiscountCode::getCode, String.CASE_INSENSITIVE_ORDER))
                    .toList();
        } catch (RuntimeException ignored) {
            return "Coupon data is temporarily unavailable.";
        }

        if (activeCoupons.isEmpty()) {
            return "No active coupon data is available right now.";
        }

        return "Active coupons: " + activeCoupons.stream()
                .map(this::formatCoupon)
                .collect(Collectors.joining("; "));
    }

    private String buildRoomKnowledgeAnswer(
            List<AiSuggestedRoomResponse> rooms,
            String normalizedMessage,
            List<String> equipmentKeywords
    ) {
        if (rooms.isEmpty()) {
            return "Hiện hệ thống chưa có dữ liệu phòng.";
        }

        List<String> keywords = equipmentKeywords == null || equipmentKeywords.isEmpty()
                ? findEquipmentKeywords(normalizedMessage)
                : equipmentKeywords;
        List<AiSuggestedRoomResponse> targetRooms = findMentionedRooms(rooms, normalizedMessage);
        if (targetRooms.isEmpty() && looksLikeSpecificRoomQuery(normalizedMessage)) {
            return "Mình không tìm thấy phòng trùng với tên bạn vừa hỏi trong hệ thống. "
                    + "Bạn kiểm tra lại tên phòng, hoặc hỏi \"Cho tôi xem tất cả phòng đang có\" nhé.";
        }
        if (targetRooms.isEmpty()) {
            targetRooms = rooms;
        }

        if (!keywords.isEmpty()) {
            targetRooms = targetRooms.stream()
                    .filter(room -> {
                        String equipmentSummary = AiChatText.normalize(
                                AiChatText.blankToUnknown(room.getEquipmentSummary())
                                        + " "
                                        + String.join(" ", room.getEquipmentItems() == null ? List.of() : room.getEquipmentItems())
                        );
                        return keywords.stream().allMatch(equipmentSummary::contains);
                    })
                    .toList();
            if (targetRooms.isEmpty()) {
                return "Mình chưa thấy phòng nào có thiết bị phù hợp với yêu cầu này trong dữ liệu hiện tại.";
            }
        }

        if (isAskingRating(normalizedMessage)) {
            targetRooms = targetRooms.stream()
                    .sorted(Comparator.comparing(
                            (AiSuggestedRoomResponse room) -> room.getAverageRating() == null ? -1D : room.getAverageRating()
                    ).reversed().thenComparing(AiSuggestedRoomResponse::getRoomName))
                    .toList();
        }

        return "Mình có thông tin phòng như sau: "
                + targetRooms.stream()
                .limit(5)
                .map(this::formatDetailedRoom)
                .reduce((first, second) -> first + " | " + second)
                .orElse("chưa có phòng phù hợp")
                + ".";
    }

    private List<AiSuggestedRoomResponse> findMentionedRooms(
            List<AiSuggestedRoomResponse> rooms,
            String normalizedMessage
    ) {
        return rooms.stream()
                .filter(room -> {
                    String normalizedName = AiChatText.normalize(room.getRoomName());
                    if (normalizedMessage.contains(normalizedName)) {
                        return true;
                    }
                    for (String part : normalizedName.split("\\s*-\\s*")) {
                        String trimmed = part.trim();
                        if (trimmed.length() >= 4 && normalizedMessage.contains(trimmed)) {
                            return true;
                        }
                    }
                    return false;
                })
                .toList();
    }

    private boolean looksLikeSpecificRoomQuery(String normalizedMessage) {
        return normalizedMessage.matches(".*\\b(?:phong|room)\\s+[a-z0-9_\\-]{2,40}\\b.*");
    }

    private List<String> findEquipmentKeywords(String normalizedMessage) {
        List<String> keywords = new ArrayList<>();
        if (normalizedMessage.contains("micro") || normalizedMessage.contains("mic")) {
            keywords.add("mic");
        }
        if (normalizedMessage.contains("drum")
                || normalizedMessage.contains("bo trong")
                || normalizedMessage.contains("dan trong")) {
            keywords.add("drum");
        }
        if (normalizedMessage.contains("amp") || normalizedMessage.contains("ampli")) {
            keywords.add("amp");
        }
        if (normalizedMessage.contains("mixer")) {
            keywords.add("mixer");
        }
        if (normalizedMessage.contains("guitar")) {
            keywords.add("guitar");
        }
        if (normalizedMessage.contains("keyboard") || normalizedMessage.contains("piano")) {
            keywords.add("keyboard");
        }
        return keywords;
    }

    private String formatDetailedRoom(AiSuggestedRoomResponse room) {
        StringBuilder detail = new StringBuilder()
                .append(room.getRoomName())
                .append(" - ")
                .append(room.getRoomTypeName())
                .append(", giá ")
                .append(AiChatText.formatMoney(room.getPricePerHour()))
                .append("/giờ")
                .append(AiChatText.capacityText(room))
                .append(AiChatText.statusText(room));

        if (room.getRoomTypeDescription() != null && !room.getRoomTypeDescription().isBlank()) {
            detail.append(", mô tả: ").append(room.getRoomTypeDescription());
        }
        detail.append(", đánh giá: ").append(AiChatText.formatRating(room));
        if (room.getEquipmentSummary() != null && !room.getEquipmentSummary().isBlank()) {
            detail.append(", thiết bị sẵn sàng: ").append(room.getEquipmentSummary());
        }
        if (room.getUnavailableEquipmentSummary() != null && !room.getUnavailableEquipmentSummary().isBlank()) {
            detail.append(", thiết bị chưa sẵn sàng: ").append(room.getUnavailableEquipmentSummary());
        }
        return detail.toString();
    }

    private String buildAllRoomsAnswer(List<AiSuggestedRoomResponse> rooms) {
        return "Hiện hệ thống có các phòng sau: "
                + rooms.stream()
                .limit(8)
                .map(this::formatDetailedRoom)
                .reduce((first, second) -> first + " | " + second)
                .orElse("chưa có dữ liệu phòng")
                + ".";
    }

    private String buildCheapestRoomAnswer(List<AiSuggestedRoomResponse> rooms) {
        List<AiSuggestedRoomResponse> activeRooms = rooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.MAINTENANCE)
                .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour))
                .toList();

        if (activeRooms.isEmpty()) {
            return "Hiện chưa có phòng nào sẵn sàng để tư vấn. Bạn thử lại sau nhé.";
        }

        AiSuggestedRoomResponse cheapestRoom = activeRooms.get(0);
        return "Phòng rẻ nhất hiện tại là " + cheapestRoom.getRoomName()
                + ", giá " + AiChatText.formatMoney(cheapestRoom.getPricePerHour()) + "/giờ"
                + AiChatText.capacityText(cheapestRoom)
                + ".";
    }

    private String buildNoRoomAnswer(
            List<AiSuggestedRoomResponse> allRooms,
            Integer people,
            BigDecimal maxPrice,
            ChatTimeRange timeRange,
            List<String> equipmentKeywords
    ) {
        StringBuilder answer = new StringBuilder("Mình chưa tìm thấy phòng phù hợp với yêu cầu này.");

        if (people != null) {
            boolean hasCapacityData = allRooms.stream().anyMatch(room -> room.getCapacity() != null);
            if (!hasCapacityData) {
                answer.append(" Hiện chưa có dữ liệu sức chứa phòng, nên mình không thể tư vấn chính xác theo số lượng ")
                        .append(people)
                        .append(" người.");
            } else {
                answer.append(" Không có phòng nào đủ sức chứa cho ")
                        .append(people)
                        .append(" người");
                if (equipmentKeywords != null && !equipmentKeywords.isEmpty()) {
                    answer.append(" kèm thiết bị đã chọn");
                }
                answer.append(".");
            }
        }

        if (maxPrice != null) {
            answer.append(" Ngân sách đang giới hạn ")
                    .append(AiChatText.formatMoney(maxPrice))
                    .append("/giờ.");
        }

        if (timeRange != null) {
            answer.append(" Khung giờ bạn hỏi là ")
                    .append(AiChatText.formatTime(timeRange.startTime()))
                    .append(" đến ")
                    .append(AiChatText.formatTime(timeRange.endTime()))
                    .append(".");
        } else if (people == null && maxPrice == null) {
            answer.append(" Bạn có thể cho mình thêm ngày giờ muốn đặt để mình kiểm tra lịch trống chính xác hơn nhé.");
        }

        String alternatives = buildAlternativeSuggestions(allRooms, people, maxPrice, timeRange);
        if (!alternatives.isBlank()) {
            answer.append(" ").append(alternatives);
        }

        return answer.toString();
    }

    private String buildAlternativeSuggestions(
            List<AiSuggestedRoomResponse> allRooms,
            Integer people,
            BigDecimal maxPrice,
            ChatTimeRange timeRange
    ) {
        List<AiSuggestedRoomResponse> activeRooms = allRooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.MAINTENANCE)
                .toList();

        if (activeRooms.isEmpty()) {
            return "";
        }

        if (timeRange != null && people != null) {
            List<AiSuggestedRoomResponse> enoughCapacityButBusy = activeRooms.stream()
                    .filter(room -> room.getCapacity() != null && room.getCapacity() >= people)
                    .filter(room -> Boolean.FALSE.equals(room.getAvailableInRequestedTime()))
                    .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour))
                    .limit(3)
                    .toList();
            if (!enoughCapacityButBusy.isEmpty()) {
                return "Có phòng đủ sức chứa nhưng đang bận khung giờ này: "
                        + formatRoomList(enoughCapacityButBusy)
                        + ". Bạn thử đổi giờ hoặc chọn ngày khác nhé.";
            }
        }

        if (people != null) {
            List<AiSuggestedRoomResponse> closestCapacity = activeRooms.stream()
                    .filter(room -> room.getCapacity() != null)
                    .sorted(Comparator.comparing(AiSuggestedRoomResponse::getCapacity).reversed()
                            .thenComparing(AiSuggestedRoomResponse::getPricePerHour))
                    .limit(3)
                    .toList();
            if (!closestCapacity.isEmpty()) {
                return "Phương án gần nhất theo sức chứa là: " + formatRoomList(closestCapacity) + ".";
            }
        }

        if (maxPrice != null) {
            List<AiSuggestedRoomResponse> closestPrice = activeRooms.stream()
                    .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour))
                    .limit(3)
                    .toList();
            if (!closestPrice.isEmpty()) {
                return "Các phòng rẻ nhất hiện có là: " + formatRoomList(closestPrice) + ".";
            }
        }

        return "";
    }

    private String formatRoomList(List<AiSuggestedRoomResponse> rooms) {
        return rooms.stream()
                .map(room -> room.getRoomName()
                        + " - " + room.getRoomTypeName()
                        + ", " + AiChatText.formatMoney(room.getPricePerHour()) + "/giờ"
                        + AiChatText.capacityText(room)
                        + AiChatText.statusText(room))
                .reduce((first, second) -> first + "; " + second)
                .orElse("chưa có phòng phù hợp");
    }

    private String formatCoupon(DiscountCode coupon) {
        StringBuilder text = new StringBuilder()
                .append(coupon.getCode())
                .append(" - ")
                .append(formatDiscountValue(coupon));

        if (coupon.getMinOrderValue() != null && coupon.getMinOrderValue().compareTo(BigDecimal.ZERO) > 0) {
            text.append(", min order ").append(AiChatText.formatMoney(coupon.getMinOrderValue()));
        }
        if (coupon.getExpiresAt() != null) {
            text.append(", expires ").append(coupon.getExpiresAt());
        }
        return text.toString();
    }

    private String formatDiscountValue(DiscountCode coupon) {
        if (coupon.getType() == null || coupon.getValue() == null) {
            return "discount value unknown";
        }
        if ("PERCENTAGE".equals(coupon.getType().name())) {
            return coupon.getValue().stripTrailingZeros().toPlainString() + "% off";
        }
        return AiChatText.formatMoney(coupon.getValue()) + " off";
    }

    private boolean isGreeting(String normalizedMessage) {
        return normalizedMessage.equals("hi")
                || normalizedMessage.equals("hello")
                || normalizedMessage.equals("hey")
                || normalizedMessage.equals("chao")
                || normalizedMessage.equals("xin chao")
                || normalizedMessage.startsWith("xin chao")
                || normalizedMessage.startsWith("chao ban");
    }

    private boolean isAskingOpeningHours(String normalizedMessage) {
        return normalizedMessage.contains("gio mo")
                || normalizedMessage.contains("mo cua")
                || normalizedMessage.contains("dong cua")
                || normalizedMessage.contains("gio hoat dong")
                || normalizedMessage.contains("hoat dong luc nao")
                || (normalizedMessage.contains("may gio") && !normalizedMessage.contains("nguoi"));
    }

    private boolean isAskingContact(String normalizedMessage) {
        return normalizedMessage.contains("lien he")
                || normalizedMessage.contains("hotline")
                || normalizedMessage.contains("nhan vien")
                || normalizedMessage.contains("support")
                || normalizedMessage.contains("tro giup");
    }

    private boolean isAskingRoomKnowledge(String normalizedMessage) {
        return normalizedMessage.contains("thiet bi")
                || normalizedMessage.contains("nhac cu")
                || normalizedMessage.contains("micro")
                || normalizedMessage.contains("mic")
                || normalizedMessage.contains("drum")
                || normalizedMessage.contains("bo trong")
                || normalizedMessage.contains("dan trong")
                || normalizedMessage.contains("amp")
                || normalizedMessage.contains("ampli")
                || normalizedMessage.contains("mixer")
                || normalizedMessage.contains("guitar")
                || normalizedMessage.contains("keyboard")
                || normalizedMessage.contains("piano")
                || normalizedMessage.contains("chi tiet phong")
                || normalizedMessage.contains("thong tin phong")
                || normalizedMessage.contains("danh gia")
                || normalizedMessage.contains("duoc danh gia cao")
                || normalizedMessage.contains("tot nhat")
                || normalizedMessage.contains("review")
                || normalizedMessage.contains("rating")
                || normalizedMessage.contains("phong co gi")
                || normalizedMessage.contains("xem phong")
                || normalizedMessage.contains("tat ca phong")
                || normalizedMessage.contains("danh sach phong")
                || normalizedMessage.contains("co nhung phong nao");
    }

    private boolean isAskingRating(String normalizedMessage) {
        return normalizedMessage.contains("danh gia")
                || normalizedMessage.contains("duoc danh gia cao")
                || normalizedMessage.contains("tot nhat")
                || normalizedMessage.contains("review")
                || normalizedMessage.contains("rating");
    }

    private boolean isAskingAllRooms(String normalizedMessage) {
        return normalizedMessage.contains("tat ca phong")
                || normalizedMessage.contains("danh sach phong")
                || normalizedMessage.contains("co nhung phong nao")
                || normalizedMessage.contains("xem phong");
    }

    private boolean isAskingOtherRooms(String normalizedMessage) {
        return RoomNameIntentGuard.isAskingOtherRooms(normalizedMessage);
    }

    private boolean isAskingCheapestRoom(String normalizedMessage) {
        return normalizedMessage.contains("re nhat")
                || normalizedMessage.contains("gia thap nhat")
                || normalizedMessage.contains("phong re");
    }

    private boolean isAskingBookingGuide(String normalizedMessage) {
        return normalizedMessage.contains("huong dan dat")
                || normalizedMessage.contains("cach dat")
                || normalizedMessage.contains("lam sao dat")
                || normalizedMessage.contains("dat phong nhu the nao")
                || normalizedMessage.contains("quy trinh dat");
    }

    private boolean isAskingPayment(String normalizedMessage) {
        return normalizedMessage.contains("thanh toan")
                || normalizedMessage.contains("chuyen khoan")
                || normalizedMessage.contains("sepay")
                || normalizedMessage.contains("dat coc")
                || normalizedMessage.contains("coc bao nhieu")
                || normalizedMessage.contains("tra tien");
    }

    private boolean isAskingCancellation(String normalizedMessage) {
        return normalizedMessage.contains("huy lich")
                || normalizedMessage.contains("huy phong")
                || normalizedMessage.contains("huy booking")
                || normalizedMessage.contains("hoan tien")
                || normalizedMessage.contains("refund")
                || normalizedMessage.contains("doi lich");
    }

    private boolean isAskingCoupon(String normalizedMessage) {
        return normalizedMessage.contains("coupon")
                || normalizedMessage.contains("ma giam gia")
                || normalizedMessage.contains("giam gia")
                || normalizedMessage.contains("voucher");
    }
}
