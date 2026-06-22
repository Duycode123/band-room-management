package backend.dto.response;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class BookingResponse {

    private Long bookingId;
    private String bookingCode;

    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private Long roomId;
    private String roomName;
    private String typeName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private BigDecimal totalHours;
    private BigDecimal pricePerHour;
    private BigDecimal totalAmount;

    private BookingStatus status;
    private LocalDateTime paymentExpiredAt;

    public BookingResponse(Booking booking) {
        this.bookingId = booking.getId();
        this.bookingCode = booking.getBookingCode();

        if (booking.getCustomer() != null) {
            this.customerId = booking.getCustomer().getId();
            this.customerName = booking.getCustomer().getFullName();
            this.customerEmail = booking.getCustomer().getEmail();
            this.customerPhone = booking.getCustomer().getPhone();
        }

        if (booking.getRoom() != null) {
            this.roomId = booking.getRoom().getId();
            this.roomName = booking.getRoom().getRoomName();

            if (booking.getRoom().getRoomType() != null) {
                this.typeName = booking.getRoom().getRoomType().getTypeName();
            }
        }

        this.startTime = booking.getStartTime();
        this.endTime = booking.getEndTime();
        this.totalHours = booking.getTotalHours();
        this.pricePerHour = booking.getPricePerHour();
        this.totalAmount = booking.getTotalAmount();
        this.status = booking.getStatus();
        this.paymentExpiredAt = booking.getPaymentExpiredAt();
    }
}