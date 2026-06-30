# Database Documentation

This folder contains the repository-owned database documentation and migrations.

## Current Source of Truth

Use the following order when reasoning about schema:

1. SQL migrations in `database/migrations/`
2. this document
3. JPA entity mappings in `backend/src/main/java/backend/entity/`
4. use case docs under `docs/use-cases/`
5. external SRS or backlog documents

## Current Schema Areas Visible In Source

The current backend source clearly models these areas:

- user and role data
- customer and staff identities
- room and room type data
- booking data
- payment transaction data
- revoked token data

Core entity classes currently present:

- `User`
- `Customer`
- `Staff`
- `Room`
- `RoomType`
- `Booking`
- `PaymentTransaction`
- `RevokedToken`

## Existing Files

- `database/BandLab_Database.sql`
- `database/migrations/20260624_create_payment_transactions.sql`
- `database/migrations/20260628_rename_vn_schema_to_en.sql`
- `database/schema-target-en.dbml`

## Target Naming Direction

The long-term naming direction for this project is:

- English names
- `snake_case` for tables and columns
- English enum type names
- English enum values

The backend JPA mappings now target the English schema. Existing PostgreSQL databases that still use Vietnamese names must be migrated with `database/migrations/20260628_rename_vn_schema_to_en.sql` before running a backend build that includes the English mappings.

Do not mix new Vietnamese names into new schema work unless a task is strictly limited to keeping a legacy area stable.

## Current To Target Mapping

This is the intended conceptual mapping for the core schema:

| Current name | Target name |
| --- | --- |
| `tai_khoan` | `account` |
| `khach_hang` | `customer` |
| `nhan_vien` | `staff` |
| `hang_phong` | `room_tier` |
| `phong` | `room` |
| `thiet_bi` | `equipment` |
| `ma_giam_gia` | `discount_code` |
| `dat_phong` | `booking` |
| `giao_dich_thanh_toan` | `payment_transaction` or future payment table family |
| `lich_su_trang_thai_dat_phong` | `booking_status_history` |
| `danh_gia` | `review` |
| `ca_lam` | `shift` |

Important enum mappings:

| Current enum type | Target enum type |
| --- | --- |
| `vai_tro` | `role` |
| `trang_thai_phong` | `room_status` |
| `trang_thai_dat_phong` | `booking_status` |
| `phuong_thuc_thanh_toan` | `payment_method` |
| `loai_giam_gia` | `discount_type` |
| `trang_thai_ca` | `shift_status` |
| `loai_thiet_bi` | `equipment_type` |
| `trang_thai_thiet_bi` | `equipment_status` |

## Documentation Rule For Schema Changes

When schema changes:

1. add or update a migration
2. update this document if the change affects business meaning or constraints
3. update related use case docs if behavior changes
4. keep entity mappings and migration intent aligned

If the change is part of the Vietnamese-to-English rename:

5. update `database/schema-target-en.dbml` if the target model changes
6. document whether the task changes only documentation, only SQL, or both SQL and JPA mappings

## What To Document For Each Important Table

- table purpose
- main relationships
- important enums and statuses
- unique constraints
- concurrency-sensitive fields
- timestamps and lifecycle fields
- business notes that affect use cases

## Current Notes

- Booking is already a lifecycle-heavy aggregate and should be documented carefully whenever status semantics change.
- Payment and booking timeout behavior should stay aligned with booking-expiry logic in the backend.
- Enum-backed statuses deserve explicit documentation because they affect filters, transitions, and reporting.

## Migration Guidance For The Rename

The English rename is now implemented in JPA and must be rolled out to legacy PostgreSQL instances with a deliberate migration, not with scattered manual edits.

Recommended order:

1. freeze the target English schema in `database/schema-target-en.dbml`
2. decide whether to migrate in place or create compatibility views / phased aliases
3. write SQL migrations for enum types, tables, columns, indexes, constraints, and foreign keys
4. update JPA `@Table`, `@Column`, `@JoinColumn`, and enum `columnDefinition` mappings
5. run repository and integration tests against the migrated schema
6. update documentation and deployment instructions together

Current repository status:

- JPA mappings: English
- target DBML: English
- legacy production-like SQL base: still contains Vietnamese names until the rename migration is applied

If a task is only about documentation, do not pretend the runtime schema has already been renamed.

## Known Gaps Versus Product Scope

The source SRS and backlog mention additional domains that are not yet represented consistently across the current backend source tree, including:

- instrument rental details
- customer review flows
- coupons and discount usage
- maintenance workflow
- notifications
- staff attendance and shift planning
- refund workflow for customer self-cancellation

When these areas are implemented, add migrations and document them here instead of relying only on backlog text.
