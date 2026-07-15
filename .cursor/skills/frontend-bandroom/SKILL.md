---
name: frontend-bandroom
description: Builds the Next.js frontend for band-room-management. Use when creating pages, components, API calls, auth flows, dashboards, routing, or any work under frontend/.
---

# Frontend — Band Room Management

## Stack

- Next.js App Router (`frontend/app/`)
- TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"`, `@theme` in `globals.css`)
- Axios via `frontend/lib/api.ts`
- Auth via `frontend/contexts/AuthContext.tsx` and `frontend/components/AuthGuard.tsx`

## Project structure

```
frontend/app/
  (auth)/          # login, register, forgot-password, reset-password
  (dashboard)/     # admin/, staff/, customer/ dashboards
  page.tsx         # landing
frontend/components/
frontend/lib/api.ts
frontend/contexts/AuthContext.tsx
```

## Conventions

### API calls

Use the shared axios instance — it attaches JWT automatically:

```typescript
import api from '@/lib/api'

const res = await api.post('/api/auth/login', { identifier, password })
```

Base URL: `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:8080`)

### Auth & routing

- Roles: `ADMIN` | `STAFF` | `CUSTOMER`
- Dashboard routes: `/admin/dashboard`, `/staff/dashboard`, `/customer/dashboard`
- Protect pages with `<AuthGuard allowedRoles={['ROLE']}>` 
- Use `useAuth()` from `@/contexts/AuthContext` for login/logout

### Page files

- Add `'use client'` when using hooks, router, or browser APIs
- Prefer Tailwind over inline styles
- Follow design system: invoke `/design-md` skill or read `DESIGN.md`

### New page checklist

1. Create `page.tsx` under correct route group
2. Wrap with `AuthGuard` if protected
3. Use `api` for backend calls
4. Match existing dashboard layout patterns in sibling role pages

## Backend APIs available

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- User endpoints under `/api/users` (admin)

Room/Booking APIs may not exist yet — confirm with backend before implementing.
