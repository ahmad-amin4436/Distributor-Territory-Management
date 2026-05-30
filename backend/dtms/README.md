# DTMS Backend API

ASP.NET Core 8 Web API for the Distributor Territory Management frontend
(`distributor-territory-management/`). Data is persisted in **SQL Server**
using the **ADO.NET** approach via the **Enterprise Library Data Access Block**
(`Microsoft.Practices.EnterpriseLibrary.Data`) and `System.Data.Common`.
All database access goes through stored procedures.

## Layout

```
backend/dtms/
├── database/
│   ├── 01_Schema.sql            Tables: Distributors, Territories, TerritoryCoordinates
│   ├── 02_StoredProcedures.sql  All usp_* procs + dbo.CoordinateList TVP
│   ├── 03_Seed.sql              Seeds the frontend mock data (idempotent)
│   └── 04_Auth.sql              Users table + auth procedures
└── dtms/
    ├── Data/                    DatabaseFactory + DataRow read helpers
    ├── Models/                  DTOs mirroring the frontend TS interfaces
    ├── Repositories/            ADO.NET data access (Enterprise Library)
    ├── Controllers/             Distributors + Territories REST controllers
    └── Program.cs               DI, CORS, camelCase JSON
```

## Database setup

Run once against your SQL Server instance (the `-I` flag enables
`QUOTED_IDENTIFIER`, required by the filtered index):

```powershell
cd backend/dtms/database
sqlcmd -S "DESKTOP-36875F2\SQLEXPRESS" -U sa -P "abcd@1234" -C -I -i 01_Schema.sql
sqlcmd -S "DESKTOP-36875F2\SQLEXPRESS" -U sa -P "abcd@1234" -C -I -i 02_StoredProcedures.sql
sqlcmd -S "DESKTOP-36875F2\SQLEXPRESS" -U sa -P "abcd@1234" -C -I -i 03_Seed.sql
sqlcmd -S "DESKTOP-36875F2\SQLEXPRESS" -U sa -P "abcd@1234" -C -I -i 04_Auth.sql
```

The connection string lives in `dtms/appsettings.json` under
`ConnectionStrings:DtmsDb`.

## Run the API

```powershell
cd backend/dtms/dtms
dotnet run
```

Swagger UI: `http://localhost:5168/swagger`. CORS is open to the Next.js dev
server at `http://localhost:3000`.

## Endpoints

### Auth  `/api/auth`
| Method | Route        | Auth | Purpose |
|--------|--------------|------|---------|
| POST   | `/register`  | —    | Create a user; returns `{ user, token, expiresAt }` |
| POST   | `/login`     | —    | Authenticate; returns `{ user, token, expiresAt }` |
| GET    | `/me`        | JWT  | Current session user from the bearer token |

Passwords are hashed with PBKDF2 (SHA-256, 100k iterations) + a per-user salt;
plaintext is never stored. The `user` payload matches the frontend's
`SessionUser { email, name, role }`. The JWT signing key and lifetime are
configured in `appsettings.json` under `Jwt`.

**All endpoints require a bearer token** (`Authorization: Bearer <token>`)
except `POST /api/auth/register` and `POST /api/auth/login`, which are
anonymous. A request without a valid token returns `401 Unauthorized`. This is
enforced globally via an authorization fallback policy in `Program.cs`; the two
auth endpoints opt out with `[AllowAnonymous]`.

### Distributors  `/api/distributors`
| Method | Route        | Purpose |
|--------|--------------|---------|
| GET    | `/`          | List all (with derived `assignedTerritoryId`) |
| GET    | `/{id}`      | Get one |
| POST   | `/`          | Create (server fills id/code/joinedAt/avatarColor) |
| PUT    | `/{id}`      | Update |
| DELETE | `/{id}`      | Delete (clears any territory assignment) |

### Territories  `/api/territories`
| Method | Route                | Purpose |
|--------|----------------------|---------|
| GET    | `/`                  | List all (with polygon coordinates) |
| GET    | `/{id}`              | Get one |
| POST   | `/`                  | Create (server fills sales/performance/outlets/color) |
| PUT    | `/{id}`              | Update (omit `coordinates` to keep the polygon) |
| PUT    | `/{id}/coordinates`  | Replace polygon vertices |
| PUT    | `/{id}/assign`       | Assign/clear distributor (`{ "distributorId": "d-007" }` or `null`) |
| DELETE | `/{id}`              | Delete (coordinates cascade) |

## Notes

- `Territories.DistributorId` is the single source of truth for assignment;
  the distributor's `assignedTerritoryId` is derived from it, and a distributor
  can be assigned to at most one territory (enforced by a unique filtered index
  and by the assign/insert/update procedures).
- Polygon coordinates are passed to SQL Server as a table-valued parameter
  (`dbo.CoordinateList`), so create/update of a territory and its geometry is
  atomic.
- JSON is camelCase and `coordinates` are `[lat, lng]` arrays to match the
  frontend's `LatLng` / `Territory` / `Distributor` TypeScript types exactly.
```
