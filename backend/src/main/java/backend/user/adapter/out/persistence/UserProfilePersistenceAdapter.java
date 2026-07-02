package backend.user.adapter.out.persistence;

import backend.entity.Customer;
import backend.entity.User;
import backend.repository.CustomerRepository;
import backend.repository.UserRepository;
import backend.user.application.port.out.UserProfileAccountPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserProfilePersistenceAdapter implements UserProfileAccountPort {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    @Override
    public Optional<User> loadUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public boolean existsUserByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<Customer> loadCustomerByAccountEmail(String email) {
        return customerRepository.findByAccount_Email(email);
    }

    @Override
    public Customer saveCustomer(Customer customer) {
        return customerRepository.save(customer);
    }
}
