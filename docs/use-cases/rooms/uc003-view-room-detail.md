# UC003 - View Room Detail

## Metadata

- Source: Product Backlog `UC003`
- Primary actor: Customer
- Current status in repo: Partially implemented

## Goal

Allow a customer to inspect a single room in enough detail to decide whether to start the booking flow.

## Related Endpoints

- `GET /api/rooms/{id}`

## Preconditions

- The requested room ID exists.

## Main Flow

1. Customer selects a room from the listing.
2. Frontend calls the room detail endpoint with room ID.
3. Backend loads room detail and returns it.
4. Customer reviews the room information and may continue to booking.

## Alternate and Error Flows

- Room ID does not exist: backend returns not found.
- Room exists but is not bookable: frontend may still show detail, depending on product rule.

## Business Rules

- The room detail must be identified by backend-owned room ID.
- Not-found behavior must be explicit and stable.
- Detail payload should expose booking-relevant fields only through response DTOs.

## Data Touched

- `Room`
- `RoomType`

## Current Implementation Notes

- Backend detail endpoint exists and returns `RoomResponse`.
- The backlog mentions gallery and richer detail presentation, which are mostly frontend concerns.
- The current source does not yet document image asset handling in the backend use case.

## Known Gaps / Follow-up

- Define the canonical detail payload for equipment, images, and richer metadata.
- Clarify whether hidden/inactive rooms should return `404` or a visible status.

## Hexagonal Refactor Notes

Suggested inbound port:

- `GetRoomDetailUseCase`

Suggested outbound port:

- `LoadRoomDetailPort`
