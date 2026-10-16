# AutoFlow API — Milestone 1

Base URL: `http://localhost:4000/api` (browser clients use Vite's `/api` proxy).

Every mutation requires `Content-Type: application/json` and `X-AutoFlow-Client: web`. Browser Origin must equal configured CLIENT_ORIGIN. Send an empty JSON object for logout. Authentication is through the `autoflow_session` cookie; Axios sends credentials. Response errors are `{ "error": { "message": "...", "requestId": "...", "details": [{ "field": "...", "message": "..." }] } }`; `details` is present on validation failures. Rate-limit responses may omit requestId in the body; the response header still includes it.

| Method / path | Authorization | Body/query | Result |
| --- | --- | --- | --- |
| GET /health | Public | — | 200 `{status:"ok"}` or 503 |
| POST /auth/register | Public, rate limited | name, email, password, workshopSlug, optional phone | 201 `{user,workshop}`, session cookie; customer only |
| POST /auth/login | Public, rate limited | email, password, workshopSlug | 200 `{user,workshop}`, session cookie |
| GET /auth/me | Signed in | — | `{user,workshop}` |
| POST /auth/logout | Signed in | `{}` | 204; revoke all sessions, expire cookie |
| PATCH /auth/profile | Signed in | name, phone | `{user}`; own profile only |
| POST /auth/password | Signed in, rate limited | currentPassword, newPassword | `{message}`, renewed session; old sessions revoked |
| GET /dashboard | Signed in | — | `{workshop,summary,recentAccounts,account}`; summary/recentAccounts restricted to admin |
| GET /users | Admin | page=1, limit=10 (max 50), search, role, active=true/false, sort=newest/name | `{users,pagination:{page,limit,total,pages}}` |
| POST /users | Admin, rate limited | name, email, password, optional phone | 201 `{user}`; technician role and tenant assigned by server |
| PATCH /users/:id/active | Admin | active boolean | `{user}`; tenant customers/technicians only |

User: `{id,name,email,phone,role,active,workshopId,createdAt,lastLoginAt}`. Password hashes and session versions are never serialized. Dates use ISO 8601; lastLoginAt may be absent before first login. Workshop code is required at login because email uniqueness is scoped to a workshop.

Status codes: 400 invalid input, 401 missing/invalid session or credentials, 403 role/CSRF violation, 404 unavailable resource, 409 duplicate account or concurrent session change, 415 wrong mutation content type, 429 rate limit, 500 unexpected failure. Foreign-tenant account mutation returns 404 to avoid confirming record existence.

Example login using a cookie jar (replace credentials):

```sh
curl -c cookies.txt -H "Content-Type: application/json" -H "X-AutoFlow-Client: web" \
  -d '{"workshopSlug":"autoflow-demo","email":"owner@autoflow.demo","password":"YOUR_SEED_PASSWORD"}' \
  http://localhost:4000/api/auth/login
curl -b cookies.txt http://localhost:4000/api/dashboard
```

Do not commit the cookie jar. No Stripe, operational repair, or payment endpoints are shipped in Milestone 1.
