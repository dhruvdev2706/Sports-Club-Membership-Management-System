# API Endpoints Documentation

## Authentication (`/api/auth`)
- `POST /setup-admin`: Securely provisions the first administrator. Requires `x-admin-setup-secret` header.

## Members (`/api/members`)
- `POST /memberships`: Create a new membership application.
- `PATCH /memberships/:id/status`: Update membership status (Approve, Reject, Cancel).

## Bookings (`/api/bookings`)
- `POST /`: Create a new facility booking. Validates overlap in Postgres.
- `PATCH /:id/status`: Admin override for booking status.

## Payments (`/api/payments`)
- `POST /manual`: Record a manual/demo payment (Admin only).
- `GET /:id/receipt`: Generate PDF receipt for a payment (Simulated).

## Equipment (`/api/equipment`)
- `POST /issue`: Check out equipment securely via PostgreSQL RPC.
- `POST /return`: Mark equipment as returned securely via PostgreSQL RPC.
