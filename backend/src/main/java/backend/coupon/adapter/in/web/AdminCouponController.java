package backend.coupon.adapter.in.web;

import backend.common.ApiResponse;
import backend.coupon.adapter.in.web.dto.CouponResponse;
import backend.coupon.adapter.in.web.dto.CreateCouponRequest;
import backend.coupon.adapter.in.web.dto.UpdateCouponRequest;
import backend.coupon.application.port.in.CreateCouponUseCase;
import backend.coupon.application.port.in.DeleteCouponUseCase;
import backend.coupon.application.port.in.GetCouponDetailUseCase;
import backend.coupon.application.port.in.ListCouponsUseCase;
import backend.coupon.application.port.in.UpdateCouponUseCase;
import backend.coupon.application.port.in.command.CreateCouponCommand;
import backend.coupon.application.port.in.command.DeleteCouponCommand;
import backend.coupon.application.port.in.command.UpdateCouponCommand;
import backend.coupon.application.port.in.query.GetCouponDetailQuery;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

    private final ListCouponsUseCase listCouponsUseCase;
    private final GetCouponDetailUseCase getCouponDetailUseCase;
    private final CreateCouponUseCase createCouponUseCase;
    private final UpdateCouponUseCase updateCouponUseCase;
    private final DeleteCouponUseCase deleteCouponUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getCoupons() {
        List<CouponResponse> data = listCouponsUseCase.getCoupons().stream()
                .map(CouponResponse::from)
                .toList();

        return ResponseEntity.ok(success("Lay danh sach coupon thanh cong", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> getCouponDetail(@PathVariable Integer id) {
        CouponResponse data = CouponResponse.from(
                getCouponDetailUseCase.getCouponDetail(new GetCouponDetailQuery(id))
        );

        return ResponseEntity.ok(success("Lay chi tiet coupon thanh cong", data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(
            @Valid @RequestBody CreateCouponRequest request
    ) {
        CouponResponse data = CouponResponse.from(createCouponUseCase.createCoupon(
                new CreateCouponCommand(
                        request.code(),
                        request.type(),
                        request.value(),
                        request.minOrderValue(),
                        request.expiresAt()
                )
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(success("Tao coupon thanh cong", data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateCouponRequest request
    ) {
        CouponResponse data = CouponResponse.from(updateCouponUseCase.updateCoupon(
                new UpdateCouponCommand(
                        id,
                        request.code(),
                        request.type(),
                        request.value(),
                        request.minOrderValue(),
                        request.expiresAt()
                )
        ));

        return ResponseEntity.ok(success("Cap nhat coupon thanh cong", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable Integer id) {
        deleteCouponUseCase.deleteCoupon(new DeleteCouponCommand(id));

        return ResponseEntity.ok(success("Xoa coupon thanh cong", null));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
