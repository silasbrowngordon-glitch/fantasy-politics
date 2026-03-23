# Fantasy Politics

Fantasy sports for political junkies. Draft real politicians, earn points based on daily scores entered by the game administrator, and climb your league's standings.

---




## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT stored in httpOnly cookies

---

## Project Structure

```
fantasy-politics/
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/       # Route pages
│       ├── components/  # Shared UI components
│       └── lib/         # API client, auth context
├── server/          # Express backend
│   └── src/
│       ├── routes/      # API route handlers
│       ├── middleware/  # Auth middleware
│       └── lib/         # Prisma client singleton
└── prisma/          # Schema + migrations + seed
```

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd fantasy-politics
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fantasy_politics
JWT_SECRET=your-super-secret-jwt-key-change-this
ADMIN_EMAIL=admin@fantasypolitics.com
ADMIN_PASSWORD=changeme123
PORT=3001
CLIENT_URL=http://localhost:5173
```

The server also reads `.env` from the project root — you can symlink or copy it:

```bash
cp .env server/.env
```

### 3. Set up the database

Create the PostgreSQL database:

```bash
createdb fantasy_politics
```

Run Prisma migrations:

```bash
npx prisma migrate dev --schema=prisma/schema.prisma --name init
```

Generate the Prisma client:

```bash
npx prisma generate --schema=prisma/schema.prisma
```

### 4. Seed the database

This creates the admin user, ~50 politicians, and a sample "Beta League":

```bash
cd server
npx ts-node ../prisma/seed.ts
```

Or from the root (if ts-node is global):

```bash
ts-node prisma/seed.ts
```

### 5. Start the development servers

From the project root, run both servers concurrently:

```bash
npm run dev
```

Or start them individually:

```bash
# Terminal 1 — API server (port 3001)
cd server && npm run dev

# Terminal 2 — React dev server (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Admin Access

After seeding, log in with the admin credentials from your `.env`:

- **Email**: `ADMIN_EMAIL` value (default: `admin@fantasypolitics.com`)
- **Password**: `ADMIN_PASSWORD` value (default: `changeme123`)

The admin panel is available at `/admin`.

**Most important admin page**: `/admin/scores` — Enter daily point values for politicians here. Use Enter/arrow keys to navigate quickly between rows.

---

## How to Play

1. **Register** an account at `/register`
2. **Create or join** a league at `/leagues`
   - To create: choose a league name and your team name
   - To join: enter the 6-character invite code from the commissioner
3. **Wait for the draft** — the commissioner starts the draft when all members are ready
4. **Draft politicians** in a live snake draft (90-second pick timer, polls every 3 seconds)
5. **Set your lineup** — 8 starters from your 10-player roster
6. **Check standings** daily as the admin enters scores

---

## API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |

### Leagues
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leagues` | My leagues |
| POST | `/api/leagues` | Create league |
| POST | `/api/leagues/join` | Join by invite code |
| GET | `/api/leagues/:id` | League detail + standings |
| GET | `/api/leagues/:id/draft` | Draft state |
| POST | `/api/leagues/:id/draft/start` | Start draft (commissioner) |
| POST | `/api/leagues/:id/draft/pick` | Make a pick |
| GET | `/api/leagues/:id/roster` | My roster |
| PUT | `/api/leagues/:id/lineup` | Set starting lineup |
| POST | `/api/leagues/:id/waiver` | Drop + pickup |
| GET | `/api/leagues/:id/roster/:memberId` | View another team |

### Politicians & Scores
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/politicians` | All politicians (filterable) |
| GET | `/api/politicians/:id` | Politician profile |
| GET | `/api/scores?date=YYYY-MM-DD` | Scores for a date |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/politicians` | Manage politicians |
| PUT | `/api/admin/politicians/:id` | Update politician |
| POST | `/api/admin/politicians/bulk-import` | CSV upload |
| GET | `/api/admin/scores?date=` | Score entry data |
| POST | `/api/admin/scores` | Save daily scores (batch upsert) |
| GET | `/api/admin/leagues` | All leagues |
| POST | `/api/admin/leagues/:id/reset` | Reset league to PREDRAFT |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/role` | Promote/demote admin |

---

## Scoring Rules

- Points are entered once daily by the admin for each politician
- Only your **8 starting lineup** politicians contribute to your score (not bench players)
- Your **daily team score** = sum of points for starting politicians that day
- Your **season total** = sum of all daily team scores
- The admin can add a note explaining each point entry
- Score entry is idempotent — re-submitting the same date overwrites existing scores

---

## CSV Bulk Import Format

When importing politicians via CSV, use these column headers:

```csv
name,title,party,state
Bernie Sanders,Senator,IND,VT
Alexandria Ocasio-Cortez,Representative,DEM,NY
```

Valid party values: `DEM`, `REP`, `IND`, `OTHER`

---

## Database Commands

```bash
# Run migrations
npx prisma migrate dev --schema=prisma/schema.prisma

# Open Prisma Studio (GUI)
npx prisma studio --schema=prisma/schema.prisma

# Reset database (WARNING: deletes all data)
npx prisma migrate reset --schema=prisma/schema.prisma

# Generate Prisma client after schema changes
npx prisma generate --schema=prisma/schema.prisma
```
