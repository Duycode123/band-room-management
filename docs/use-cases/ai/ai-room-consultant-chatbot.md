# AI room consultant chatbot

## Business goal

Help a customer ask natural-language questions about room options, pricing, capacity, availability, equipment, and review quality before booking.

## Actors

- Customer or anonymous visitor
- Backend AI consultant endpoint
- Gemini API provider when configured

## Preconditions

- Room, room type, equipment, and review data exists in the database.
- Booking data exists when availability for a requested time window must be checked.
- `gemini.ai.api-key` is configured when Gemini-generated answers are desired.

## Main flow

1. Client calls `POST /api/ai/chat` with the latest message, optional recent `history` turns, and optional `excludeRoomIds` (rooms already suggested in this chat).
2. Backend resolves intent:
   - Prefer Gemini JSON extraction with conversation history for people / budget / time / equipment / category / follow-ups
   - Fill gaps with deterministic regex parsing
   - Short follow-ups such as "phòng khác" inherit prior filters from history when possible
   - Explicit request fields always win
3. Backend loads room facts from the database and filters by the resolved intent.
4. For "phòng khác" / alternative requests, backend excludes previously suggested room IDs when provided.
5. Backend builds a deterministic local answer from filtered rooms.
6. If Gemini is configured, backend asks Gemini to rewrite a natural answer using matched room context plus conversation continuity.
7. Backend returns answer, suggested rooms, interpreted filters, and follow-up questions.

## Alternate and error flows

- Gemini API key is missing: regex intent + local DB answer.
- Gemini extraction fails: fall back to regex intent.
- Gemini answer rewrite fails/incomplete: keep local DB answer.
- No matching room: explain missing condition and suggest closest alternatives.

## Business rules

- Room, price, capacity, status, and availability facts must come from the database context.
- Equipment names, equipment status, equipment notes, image URLs, and approved review ratings must come from database context.
- Rooms in `MAINTENANCE` must not be suggested as bookable.
- Broken or maintenance equipment must be visible as unavailable equipment, not promised as ready.
- When a time range is known, rooms with blocking bookings are not bookable for that range.
- Gemini must not invent coupons, prices, room names, or availability.
- SePay payment details can be mentioned only as general checkout policy.
- The chatbot must not reveal customer names, emails, phone numbers, booking notes, payment references, provider secrets, or another customer's booking detail.
- Booking data exposed to the chatbot is limited to availability checks and aggregate room schedule hints.
- Natural language time ranges such as `13h-15h`, `13:30-15:00`, explicit dates such as `07/07`, and start-plus-duration phrasing such as `luc 13h trong 2 tieng` are interpreted before availability lookup.

## Related endpoints

- `POST /api/ai/chat`
- `GET /api/ai/suggested-questions`

## Data touched

- Reads `room`.
- Reads `room_type`.
- Reads `equipment`.
- Reads approved `review` aggregates through completed booking relationships.
- Reads `booking` for overlap checks.
- Reads active `discount_code` rules for public coupon guidance.

## Current implementation notes

- Orchestrated by `AiConsultantServiceImpl`.
- Collaborators live under `backend.service.ai`:
  - `ChatIntentResolver` (AI extract → merge regex → request overrides)
  - `AiChatIntentExtractor`
  - `ChatIntentParser` (regex fallback)
  - `RoomRecommendationService`
  - `LocalChatAnswerBuilder`
  - `GeminiChatAdvisor`
  - `SuggestedQuestionsProvider`
- Pipeline: understand (AI/regex) → filter DB → answer (local + optional Gemini rewrite).
- Gemini integration is implemented by `GeminiAiClient`.
- Configuration lives under `gemini.ai.*`.
- Natural-language parsing covers people slang (`8ng`), budget (`duoi 300k`), hour ranges, soft periods (`toi nay`), and equipment keywords.

## Known gaps

- Chat history is client-owned (sent per request); not persisted server-side across devices/sessions.
- Retrieval is currently based on structured rooms and blocking bookings, not embeddings.
- The chatbot does not create bookings directly.
