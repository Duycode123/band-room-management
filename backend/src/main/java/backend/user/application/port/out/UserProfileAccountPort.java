package backend.user.application.port.out;

import backend.entity.Customer;
import backend.entity.User;

import java.util.Optional;

public interface UserProfileAccountPort {
    Optional<User> loadUserByEmail(String email);

    boolean existsUserByEmail(String email);

    User saveUser(User user);

    Optional<Customer> loadCustomerByAccountEmail(String email);

    Customer saveCustomer(Customer customer);
}
