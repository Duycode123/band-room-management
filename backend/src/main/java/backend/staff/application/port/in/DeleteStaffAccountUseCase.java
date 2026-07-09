package backend.staff.application.port.in;

import backend.staff.application.port.in.command.DeleteStaffAccountCommand;

public interface DeleteStaffAccountUseCase {
    void deleteStaffAccount(DeleteStaffAccountCommand command);
}

