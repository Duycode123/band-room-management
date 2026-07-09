package backend.staff.application.port.in;

import backend.staff.application.model.StaffAccountResult;
import backend.staff.application.port.in.command.UpdateStaffAccountCommand;

public interface UpdateStaffAccountUseCase {
    StaffAccountResult updateStaffAccount(UpdateStaffAccountCommand command);
}

