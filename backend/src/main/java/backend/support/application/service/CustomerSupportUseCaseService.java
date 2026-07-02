package backend.support.application.service;

import backend.entity.Booking;
import backend.entity.Customer;
import backend.entity.CustomerIssueReport;
import backend.entity.CustomerIssueReportStatus;
import backend.entity.CustomerIssueType;
import backend.exception.ResourceNotFoundException;
import backend.repository.BookingRepository;
import backend.repository.CustomerIssueReportRepository;
import backend.repository.CustomerRepository;
import backend.support.application.model.CustomerIssueReportResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerSupportUseCaseService {

    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;
    private final CustomerIssueReportRepository customerIssueReportRepository;

    @Transactional
    public CustomerIssueReportResult createIssueReport(
            String customerEmail,
            String rawIssueType,
            String rawBookingCode,
            String rawDescription
    ) {
        Customer customer = customerRepository.findByAccount_Email(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));

        CustomerIssueType issueType = normalizeIssueType(rawIssueType);
        String description = normalizeDescription(rawDescription);
        Booking booking = resolveBooking(customerEmail, rawBookingCode);

        CustomerIssueReport savedReport = customerIssueReportRepository.save(
                CustomerIssueReport.builder()
                        .customer(customer)
                        .booking(booking)
                        .issueType(issueType)
                        .description(description)
                        .status(CustomerIssueReportStatus.OPEN)
                        .build()
        );

        return new CustomerIssueReportResult(
                savedReport.getId(),
                savedReport.getIssueType().name(),
                savedReport.getStatus().name(),
                booking == null ? null : booking.getId(),
                booking == null ? null : booking.getBookingCode(),
                savedReport.getCreatedAt()
        );
    }

    private CustomerIssueType normalizeIssueType(String rawIssueType) {
        if (rawIssueType == null || rawIssueType.trim().isBlank()) {
            throw new IllegalArgumentException("Loai su co khong duoc de trong");
        }

        try {
            return CustomerIssueType.valueOf(rawIssueType.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Loai su co khong hop le");
        }
    }

    private String normalizeDescription(String rawDescription) {
        if (rawDescription == null || rawDescription.trim().isBlank()) {
            throw new IllegalArgumentException("Noi dung mo ta khong duoc de trong");
        }

        String description = rawDescription.trim();
        if (description.length() > 1000) {
            throw new IllegalArgumentException("Noi dung mo ta khong duoc vuot qua 1000 ky tu");
        }

        return description;
    }

    private Booking resolveBooking(String customerEmail, String rawBookingCode) {
        if (rawBookingCode == null || rawBookingCode.trim().isBlank()) {
            return null;
        }

        Integer bookingId = parseBookingId(rawBookingCode);
        return bookingRepository.findByIdAndCustomer_Account_Email(bookingId, customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong cua ban voi ma nay"));
    }

    private Integer parseBookingId(String rawBookingCode) {
        String normalized = rawBookingCode.trim().toUpperCase();
        String numericPart = normalized.startsWith("BR") ? normalized.substring(2) : normalized;

        if (!numericPart.matches("\\d+")) {
            throw new IllegalArgumentException("Ma dat phong khong hop le");
        }

        try {
            return Integer.valueOf(numericPart);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Ma dat phong khong hop le");
        }
    }
}
