package backend.dto.response;

import backend.entity.Review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Integer id,
        Integer bookingId,
        Integer customerId,
        String customerName,
        Integer roomId,
        String roomName,
        Integer rating,
        String content,
        Boolean approved,
        LocalDateTime createdAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getBooking().getId(),
                review.getBooking().getCustomer().getId(),
                review.getBooking().getCustomer().getFullName(),
                review.getBooking().getRoom().getId(),
                review.getBooking().getRoom().getRoomName(),
                review.getRating(),
                review.getContent(),
                review.getApproved(),
                review.getCreatedAt()
        );
    }
}
