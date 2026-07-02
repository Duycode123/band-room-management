# UC010 - Customer cancel booking with refund notification

## Business goal

Allow a customer to cancel a paid booking before the 24-hour policy deadline and receive a 100% refund confirmation by email and in-app notification.

## Actors

- Customer
- Booking system
- Email service
- In-app notification store

## Preconditions

- Customer is authenticated.
- Booking belongs to the authenticated customer.
- Booking has not been cancelled or completed.
- Booking start time is at least 24 hours after the cancellation request.

## Main flow

1. Customer requests cancellation for a booking.
2. Backend verifies ownership, status, and the 24-hour cancellation policy.
3. Backend sets booking status to `CANCELLED`.
4. Backend calculates refund amount as 100% of the booking total.
5. Backend creates an in-app notification with customer name, booking code, refund amount, refund method, and expected refund date.
6. Backend sends an email with the same template variables.
7. Backend returns the cancelled booking and refund summary.

## Alternate and error flows

- Booking not found or belongs to another customer: backend rejects the request.
- Booking already cancelled or completed: backend rejects the request.
- Cancellation is within 24 hours of the start time: backend rejects the request.
- Email delivery failure: backend returns an error and cancellation is not committed.

## Business rules

- Refund percentage is 100%.
- Expected refund date defaults to current time plus `app.refund.expected-days` days.
- Online payments are described as refunded to the original online payment method.
- Cash payments are described as refunded at the counter.

## Related endpoints

- `PUT /api/bookings/{id}/cancel`

## Data touched

- Updates `booking.status`.
- Inserts `app_notification`.

## Current implementation notes

- Implemented incrementally inside the booking use-case service.
- Notification content is template-based in `BookingCancellationNotificationService`.
