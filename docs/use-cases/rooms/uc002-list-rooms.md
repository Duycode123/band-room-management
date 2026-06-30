# UC002 - List Rooms

## Metadata

- Source: Product Backlog `UC002`
- Primary actor: Customer
- Current status in repo: Partially implemented

## Goal

Allow a customer to browse available rooms and narrow the list to rooms that match their needs.

## Related Endpoints

- `GET /api/rooms`

## Preconditions

- Room data exists in the system.
- Public room listing is allowed without authentication.

## Main Flow

1. Customer opens the room listing page.
2. Frontend calls the room list endpoint.
3. Backend returns room summaries.
4. Customer optionally applies filters.
5. Frontend refreshes the list with the selected filters.

## Alternate and Error Flows

- No matching rooms: frontend should show an empty state.
- Invalid filter value: backend rejects invalid enum or malformed query values.

## Business Rules

- Only rooms that belong to the active dataset should be shown.
- Listing logic should not expose internal persistence details.
- Filtering rules should stay consistent with room status semantics.

## Data Touched

- `Room`
- `RoomType`

## Current Implementation Notes

- Current backend supports `roomTypeId` and `status` query parameters.
- Response is returned as `ApiResponse<List<RoomResponse>>`.
- There is no backend pagination yet.
- There is no backend search by room name or address yet.

## Known Gaps / Follow-up

- Add pagination if room count becomes large.
- Add search and richer filters if still required by product scope.
- Clarify whether rooms in maintenance should be excluded completely or shown with status.

## Hexagonal Refactor Notes

Suggested inbound port:

- `ListRoomsUseCase`

Suggested outbound ports:

- `LoadRoomsPort`
- `LoadRoomTypesPort`
