# UC001 - Admin Manage Rooms

## Metadata

- Source: Admin operations flow normalized from current repo behavior
- Primary actor: Administrator
- Current status in repo: Implemented with scoped backend fields

## Goal

Allow an administrator to create, update, change status, and delete practice rooms used by the booking system.

## Related Endpoints

- `POST /api/rooms`
- `PUT /api/rooms/{id}`
- `PATCH /api/rooms/{id}/status?status={ROOM_STATUS}`
- `DELETE /api/rooms/{id}`
- `POST /api/admin/room-images`

## Preconditions

- The caller is authenticated.
- The caller has role `ADMIN`.
- A valid room type already exists before create or update.

## Main Flow

1. Admin opens the room management screen.
2. Frontend loads room list and room type list from backend.
3. Admin may upload a room image from the form.
4. Backend uploads the image to Cloudinary and returns a secure URL.
5. Admin creates or edits a room by sending room name, room type, maximum capacity, image URL, and room status.
6. Backend validates permissions, room existence, room type existence, duplicate room names, capacity range, and image URL shape.
7. Backend persists the change and returns the updated room DTO.
8. Admin may update room status directly from the list.
9. Admin may delete a room only when the room has no linked bookings and no linked equipment.

## Alternate and Error Flows

- Non-admin caller: backend returns forbidden.
- Missing room or room type: backend returns not found.
- Duplicate room name: backend rejects the mutation.
- Invalid capacity: backend rejects the mutation.
- Invalid image upload: backend rejects the upload before calling Cloudinary.
- Missing Cloudinary configuration: backend rejects the upload and leaves room data unchanged.
- Delete requested for a room that already has bookings: backend rejects the delete.
- Delete requested for a room that still has equipment: backend rejects the delete.

## Business Rules

- Only administrators can mutate room data.
- Room names must remain unique.
- Room maximum capacity is stored per room and must be between 1 and 100.
- Room image URLs are stored as HTTP(S) URLs after Cloudinary upload.
- Cloudinary credentials stay server-side; the frontend uploads through the backend admin endpoint.
- Room status is backend-owned and uses the `room_status` enum.
- A room cannot be deleted once operational data already depends on it.

## Data Touched

- `room`
- `room_tier`
- `booking`
- `equipment`

## Current Implementation Notes

- Current backend persistence for room management is intentionally narrow.
- The mutation flow persists `room.name`, `room.room_tier_id`, `room.max_people`, `room.image_url`, and `room.status`.
- Frontend fields such as generated room code, derived price, description, and equipment summary are still display-oriented.
- Application logic lives in `RoomUseCaseService` and is exposed through `RoomController`.
- Cloudinary upload orchestration lives in `RoomImageUploadUseCaseService` and is exposed through `AdminRoomImageController`.

## Known Gaps / Follow-up

- If product scope requires editable description or richer room metadata, add schema fields and explicit commands instead of relying on frontend-only state.
- Consider adding dedicated audit history for room status changes if operations need traceability.
