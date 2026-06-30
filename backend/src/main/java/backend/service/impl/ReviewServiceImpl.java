package backend.service.impl;

import backend.dto.request.CreateReviewRequest;
import backend.dto.request.UpdateReviewApprovalRequest;
import backend.dto.response.PagedResponse;
import backend.dto.response.ReviewEligibilityResponse;
import backend.dto.response.ReviewResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.Review;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.repository.BookingRepository;
import backend.repository.CustomerRepository;
import backend.repository.ReviewRepository;
import backend.service.ReviewService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request, String customerEmail) {
        Customer customer = findCustomer(customerEmail);
        Booking booking = findBooking(request.getBookingId());

        validateBookingBelongsToCustomer(booking, customer);
        validateBookingCanBeReviewed(booking);

        if (reviewRepository.existsByBooking_Id(booking.getId())) {
            throw new IllegalStateException("Đơn đặt phòng này đã được đánh giá");
        }

        Review review = Review.builder()
                .booking(booking)
                .rating(request.getRating())
                .content(request.getContent().trim())
                .approved(false)
                .build();

        try {
            return ReviewResponse.from(reviewRepository.saveAndFlush(review));
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Đơn đặt phòng này đã được đánh giá");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> getMyReviews(String customerEmail, int page, int size) {
        Customer customer = findCustomer(customerEmail);

        Specification<Review> specification = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("booking").get("customer").get("id"), customer.getId());

        Page<ReviewResponse> reviewPage = reviewRepository.findAll(
                        specification,
                        PageRequest.of(validatePage(page), validateSize(size), Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(ReviewResponse::from);

        return PagedResponse.from(reviewPage);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewEligibilityResponse checkReviewEligibility(Integer bookingId, String customerEmail) {
        Customer customer = findCustomer(customerEmail);
        Booking booking = findBooking(bookingId);

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            return new ReviewEligibilityResponse(bookingId, false, false, "Bạn chỉ được đánh giá đơn đặt phòng của mình");
        }

        boolean alreadyReviewed = reviewRepository.existsByBooking_Id(bookingId);
        if (alreadyReviewed) {
            return new ReviewEligibilityResponse(bookingId, false, true, "Đơn đặt phòng này đã được đánh giá");
        }

        if (booking.getStatus() != BookingStatus.HOAN_TAT) {
            return new ReviewEligibilityResponse(bookingId, false, false, "Chỉ có thể đánh giá sau khi đơn đặt phòng đã hoàn tất");
        }

        return new ReviewEligibilityResponse(bookingId, true, false, "Có thể đánh giá đơn đặt phòng này");
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> getPublicReviews(Integer roomId, Integer rating, int page, int size) {
        Specification<Review> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isTrue(root.get("approved")));

            if (roomId != null) {
                predicates.add(criteriaBuilder.equal(root.get("booking").get("room").get("id"), roomId));
            }
            if (rating != null) {
                validateRating(rating);
                predicates.add(criteriaBuilder.equal(root.get("rating"), rating));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<ReviewResponse> reviewPage = reviewRepository.findAll(
                        specification,
                        PageRequest.of(validatePage(page), validateSize(size), Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(ReviewResponse::from);

        return PagedResponse.from(reviewPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> getReviewsForAdmin(
            Integer roomId,
            Boolean approved,
            Integer rating,
            String keyword,
            int page,
            int size
    ) {
        Specification<Review> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (roomId != null) {
                predicates.add(criteriaBuilder.equal(root.get("booking").get("room").get("id"), roomId));
            }
            if (approved != null) {
                predicates.add(criteriaBuilder.equal(root.get("approved"), approved));
            }
            if (rating != null) {
                validateRating(rating);
                predicates.add(criteriaBuilder.equal(root.get("rating"), rating));
            }
            if (keyword != null && !keyword.isBlank()) {
                String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("content")), normalizedKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("booking").get("customer").get("fullName")), normalizedKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("booking").get("room").get("roomName")), normalizedKeyword)
                ));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<ReviewResponse> reviewPage = reviewRepository.findAll(
                        specification,
                        PageRequest.of(validatePage(page), validateSize(size), Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(ReviewResponse::from);

        return PagedResponse.from(reviewPage);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewDetailForAdmin(Integer reviewId) {
        return ReviewResponse.from(findReview(reviewId));
    }

    @Override
    @Transactional
    public ReviewResponse updateReviewApproval(Integer reviewId, UpdateReviewApprovalRequest request) {
        Review review = findReview(reviewId);
        review.setApproved(request.getApproved());

        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(Integer reviewId) {
        Review review = findReview(reviewId);
        reviewRepository.delete(review);
    }

    private Customer findCustomer(String email) {
        return customerRepository.findByAccount_Email(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng"));
    }

    private Booking findBooking(Integer bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng"));
    }

    private Review findReview(Integer reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));
    }

    private void validateBookingBelongsToCustomer(Booking booking, Customer customer) {
        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new ForbiddenException("Bạn chỉ được đánh giá đơn đặt phòng của mình");
        }
    }

    private void validateBookingCanBeReviewed(Booking booking) {
        if (booking.getStatus() != BookingStatus.HOAN_TAT) {
            throw new IllegalStateException("Chỉ có thể đánh giá sau khi đơn đặt phòng đã hoàn tất");
        }
    }

    private int validatePage(int page) {
        if (page < 0) {
            throw new IllegalArgumentException("Trang không được nhỏ hơn 0");
        }
        return page;
    }

    private int validateSize(int size) {
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Kích thước trang phải từ 1 đến 100");
        }
        return size;
    }

    private void validateRating(Integer rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Điểm đánh giá phải từ 1 đến 5");
        }
    }
}
