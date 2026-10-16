# AutoFlow architecture

## Delivery boundary

Milestone 1 implements workshop identity, customer accounts, technician provisioning, account administration, authentication, profiles, and role-specific layouts. It deliberately exposes no navigation or stub endpoints for unfinished service workflows. Milestones 2–5 remain future implementation, not shipped functionality.

## System structure

React/Vite → Axios `/api` → Express routes → validation/authentication/authorization → controllers/services → Mongoose → MongoDB. Vite proxies `/api` locally. In production deploy the compiled client and proxy `/api` to Express on the same HTTPS origin; history fallback belongs to the frontend host. The API never serves the frontend bundle.

JavaScript ES modules throughout. Configuration is validated before listening. User responses use explicit serializers to avoid leaking hashes or session versions. MongoDB is required; there is no mock or in-memory application fallback. Tests use a disposable real MongoDB process.

## Model plan

All records have timestamps. Every tenant-owned collection includes required, immutable `workshop`. References are always validated with both ID and authenticated tenant before writing. Customer requests also filter by the authenticated customer, and technician repair requests by assigned technician. MongoDB references alone do not enforce these rules.

| Entity | Relationships and principal fields | Indexes / constraints | Delivery |
| --- | --- | --- | --- |
| Workshop | name, slug, timezone, capacity, registrationEnabled | unique slug | M1 |
| User | workshop, name, email, phone, role, active, passwordHash, tokenVersion | unique (workshop,email); (workshop,role,active,createdAt) | M1 |
| CustomerProfile | workshop, user, address, email preferences | unique (workshop,user) | M1 |
| Vehicle | workshop, customer User, make/model/year, VIN, plate, mileage, status | unique partial (workshop,VIN); (workshop,customer) | M2 |
| Appointment | workshop, customer, vehicle, serviceType, start/end UTC, status, capacity allocation | (workshop,start,status); (workshop,customer,start) | M2 |
| RepairOrder | workshop, customer, vehicle, optional appointment, assigned technician, issue, status, estimated completion, version | (workshop,technician,status); (workshop,customer,createdAt) | M2–3 |
| DiagnosticReport | workshop, repair, author, findings, recommendations | (workshop,repair,createdAt) | M3 |
| RepairEstimate | workshop, repair, customer, version, immutable line/pricing snapshot, approval decision/time | unique (workshop,repair,version) | M3 |
| Invoice | workshop, repair, customer, estimate, number, currency, amounts in minor units, dueAt, status | unique (workshop,number); (workshop,customer,status) | M4 |
| Payment | workshop, invoice, customer, provider event/payment IDs, verified amount/currency, status | unique provider event/payment IDs | M4 |
| InventoryPart | workshop, name, SKU, category, quantity, reorder level, supplier, unit cost/sell price | unique (workshop,SKU); (workshop,quantity) | M4 |
| Notification | workshop, recipient User, type, resource reference, readAt | (workshop,recipient,readAt,createdAt) | M4 |

Customer identity is created atomically in User. The optional CRM extension is lazily upserted on authenticated profile reads and explicitly created by the seed. This avoids partial identity transactions and supports standalone MongoDB in M1. Workshop creation and administrator provisioning are trusted operations; public registration can never create owners or choose a role.

## Security model

- Eight-hour signed HS256 JWT in HttpOnly, SameSite=Lax cookie; Secure in production. JWT includes subject, tenant, session version, issuer, audience and expiry. Browser storage never holds tokens.
- Every authenticated request reloads active User and checks session version. Logout revokes all sessions. Password changes revoke older sessions and issue a new cookie. Deactivation/reactivation increments session version. No refresh-token endpoint in M1; sign in again after expiry.
- Mutations require JSON and `X-AutoFlow-Client: web`; browser cross-origin requests require a successful CORS preflight. Any supplied Origin must exactly match CLIENT_ORIGIN. Deployment must keep client and API on the same site. CORS alone is not authentication.
- bcrypt cost 12; passwords 12–72 UTF-8 bytes. Strict Zod allowlists prevent role/tenant mass assignment and Mongo query-operator injection. Search is escaped; pagination is bounded.
- Auth mutations limited to 20/IP/15 minutes and API requests to 180/IP/minute. Current limiter is process-local: multi-instance deployment requires a shared rate-limit store.
- Admin can list tenant accounts, create technicians, and enable/disable customers/technicians. Owner accounts cannot be disabled through this API. Non-admins cannot inspect other accounts.
- Password reset/email verification, owner invitations, MFA and audit logging are not included in M1. Add these before broad public rollout. Public signup requires a workshop code but is not an invitation or proof of customer identity.

## Future consistency requirements

Appointment capacity will use slot allocation documents with unique `(workshop,slot,bay)` indexes, not an unsafe count-then-insert. Reservation and appointment changes will use transactions on a MongoDB replica set. Cancellations release slots transactionally. UTC timestamps are rendered in Workshop.timezone and checked against opening hours.

Repair workflow: checked_in → awaiting_diagnosis → diagnosis_completed → awaiting_approval → in_progress → quality_inspection → ready_for_pickup → completed. Server-owned transition rules and optimistic version checks prevent skipping approval or losing concurrent updates. Pickup completion records the actor and timestamp.

Estimates and invoices use server-calculated integer minor-unit totals and immutable pricing snapshots. Customer approval records the exact estimate version. Parts allocation uses an inventory movement ledger with unique `(workshop,repair,lineId)` and atomic stock guards; editing a repair cannot deduct stock twice. Payment webhooks use verified raw-body Stripe signatures, unique event IDs, and reconciliation with stored invoice/checkout IDs and amounts. Browser payment success redirects never mark invoices paid. Money/inventory operations require MongoDB transactions and replica-set deployment.

## Page and API roadmap

| Milestone | Pages | API namespaces |
| --- | --- | --- |
| 1 | Sign in, customer registration, overview, people/access (admin), account settings | auth, users, dashboard, health |
| 2 | Customer profiles, vehicles/history, appointment day/week/month calendar, repair list/details | customers, vehicles, appointments, repairs |
| 3 | Diagnostics, estimates/approval, progress timeline, assignments, pickup | diagnostics, estimates, repair transitions |
| 4 | Invoices, checkout, inventory, notification center | invoices, payments/checkout, Stripe webhook, parts, notifications |
| 5 | Date-filtered reporting, Recharts analytics, responsive refinement | reports |

Recharts is installed for later operational reporting. No invented revenue or activity series are displayed in the foundation dashboard.
