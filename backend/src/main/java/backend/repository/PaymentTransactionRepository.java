package backend.repository;

import backend.entity.PaymentTransaction;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionReference(String transactionReference);

    Optional<PaymentTransaction> findByProviderTransactionId(String providerTransactionId);

    Optional<PaymentTransaction> findTopByBooking_IdAndProviderAndStatusOrderByCreatedAtDesc(
            Integer bookingId,
            PaymentProvider provider,
            PaymentTransactionStatus status
    );
}
