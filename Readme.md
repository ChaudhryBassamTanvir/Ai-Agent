# DS Technologies AI Client Agent

An AI-powered client management system that automates communication across WhatsApp, Slack, and a web portal. The agent intelligently gathers client requirements, creates tasks in Trello, notifies the team on Slack, and sends professional email notifications — all automatically.

---

## Features

- **Multi-channel AI Agent** — Communicates with clients via WhatsApp, Slack, and Web
- **Intelligent Requirement Gathering** — Asks structured questions and builds full project briefs
- **Trello Integration** — Auto-creates cards with client details and requirements
- **Email Notifications** — Sends professional HTML emails on task creation and status updates
- **Slack Team Notifications** — Notifies the internal team when a new task is created
- **Two-way Trello Sync** — Status changes from dashboard sync to Trello and vice versa
- **Client Status Emails** — Clients receive automated emails when their task status changes
- **Admin Dashboard** — Full CRUD for tasks and clients with real-time stats
- **PostgreSQL Database** — Persistent storage for clients, tasks, and messages
- **Permanent Public URL** — Using ngrok static domain for stable webhook access

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.12 |
| AI Agent | LangChain v1, Gemini 1.5 Flash |
| Database | PostgreSQL + SQLAlchemy ORM |
| Frontend | Next.js 14 (TypeScript) + Tailwind CSS |
| WhatsApp | Meta WhatsApp Cloud API (official) |
| Slack | Slack Bolt SDK (Socket Mode) |
| Task Management | Trello REST API |
| Email | Resend API |
| Tunnel | ngrok static domain |
| Auth | JWT (python-jose) + bcrypt |

---

## Project Structure

```
ai-client-updated/
├── backend/
│   ├── main.py                    # FastAPI app + all endpoints
│   ├── run_slack.py               # Slack bot entry point
│   ├── register_trello_webhook.py # Register Trello webhook (run once)
│   ├── .env                       # Environment variables
│   ├── api/
│   │   └── routes/
│   │       └── auth.py            # Auth router
│   ├── db/
│   │   ├── database.py            # SQLAlchemy models + DB functions
│   │   └── seed.py                # Seed admin + dummy data
│   └── services/
│       ├── langchain_agent.py     # Main AI agent (DS Technologies)
│       ├── slack_bot.py           # Slack event handler
│       ├── whatsapp_bot.py        # WhatsApp message sender
│       ├── trello_service.py      # Trello card mover
│       ├── email_service.py       # Status update email sender
│       └── auth.py                # JWT auth helpers
└── frontend/
    ├── app/
    │   ├── page.tsx               # Home/landing
    │   ├── login/page.tsx         # Admin login
    │   ├── dashboard/page.tsx     # Admin dashboard
    │   └── clients/page.tsx       # Client management
    └── components/
        └── Sidebar.tsx            # Navigation sidebar
```

---

## Prerequisites

- Python 3.12
- Node.js 18+
- PostgreSQL installed and running
- ngrok account (free) with static domain
- Meta Developer account (WhatsApp Cloud API)
- Slack workspace with bot created
- Trello account with API key
- Resend account (free tier)
- Google AI Studio account (Gemini API key)

---

## Environment Setup

Create a `.env` file inside the `backend/` folder:

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_client

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Trello
TRELLO_API_KEY=your_trello_api_key
TRELLO_TOKEN=your_trello_token
TRELLO_BOARD_ID=your_board_short_id

# Slack
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_APP_TOKEN=xapp-your-slack-app-token
SLACK_TEAM_CHANNEL=#your-team-channel

# WhatsApp (Meta Cloud API)
WHATSAPP_TOKEN=your_whatsapp_permanent_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=mysecretverify123

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
NOTIFY_EMAIL=your@email.com

# Auth
JWT_SECRET=your-super-secret-jwt-key
ADMIN_SECRET=admin-dstech-2024
```

---

## Installation

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn langchain langchain-google-genai langchain-community
pip install slack-bolt slack-sdk psycopg2-binary sqlalchemy
pip install python-dotenv resend requests python-jose[cryptography] passlib[bcrypt]
pip install chromadb tiktoken
```

### Frontend

```bash
cd frontend
npm install
npm install lucide-react
```

---

## Database Setup

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE ai_client;
```

Then seed the database with admin account and dummy data:

```bash
cd backend/db
python seed.py
```

Default admin credentials:
- **Email:** `admin@dstech.io`
- **Password:** `dstech@2024`

---

## One-Time Setup (Do these once)

### 1. Register Trello Webhook

Make sure the backend and ngrok tunnel are running first, then:

```bash
cd backend
python register_trello_webhook.py
```

### 2. Setup WhatsApp Webhook on Meta

1. Go to https://developers.facebook.com/apps → Your App → WhatsApp → Configuration
2. Set Callback URL: `https://your-ngrok-domain.ngrok-free.app/whatsapp/webhook`
3. Set Verify Token: `mysecretverify123`
4. Click Verify and Save
5. Subscribe to the **messages** field

### 3. Create Admin Account (if not seeded)

```bash
curl -X POST http://localhost:8000/auth/admin/create \
  -H "Content-Type: application/json" \
  -d '{"secret":"admin-dstech-2024","name":"Admin","email":"admin@dstech.io","password":"dstech@2024"}'
```

---

## Running the Project

Every time you start the project, open **4 terminals**:

### Terminal 1 — ngrok Tunnel (Permanent URL)

```bash
ngrok http 8000 --url your-static-domain.ngrok-free.app
```

> Get your free static domain at https://dashboard.ngrok.com/domains

### Terminal 2 — FastAPI Backend

```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

uvicorn main:app --reload
```

Backend runs at: http://127.0.0.1:8000

### Terminal 3 — Slack Bot

```bash
cd backend
venv\Scripts\activate

python run_slack.py
```

### Terminal 4 — Next.js Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: http://localhost:3000

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Admin login → returns JWT token |
| POST | `/auth/admin/create` | Create admin account (needs secret) |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | Get all tasks |
| PATCH | `/tasks/{id}` | Update task status + sync Trello + email client |
| DELETE | `/tasks/{id}` | Delete task |

### Clients
| Method | Endpoint | Description |
|---|---|---|
| GET | `/clients` | Get all clients |
| POST | `/clients` | Add client manually |
| DELETE | `/clients/{id}` | Delete client and all related data |

### Stats
| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Dashboard statistics |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| POST | `/chat` | Web chat with AI agent |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/whatsapp/webhook` | WhatsApp webhook verification |
| POST | `/whatsapp/webhook` | Incoming WhatsApp messages |
| HEAD/GET/POST | `/trello/webhook` | Trello card update sync |

---

## How It Works

### Client Flow
1. Client messages the bot on **WhatsApp**, **Slack**, or **Web**
2. Bot greets and asks for name, email, phone, and project type in first message
3. Agent gathers detailed requirements one question at a time
4. Client confirms requirements
5. Agent automatically:
   - Creates a **Trello card** with full requirements
   - Sends **email notification** to admin with client info and project details
   - Posts **Slack notification** to team channel
   - Saves client and task to **PostgreSQL database**

### Admin Flow
1. Admin logs in at `/login` with email and password
2. Dashboard shows live stats, all tasks and clients
3. Admin can update task status → client receives automated email + Trello syncs
4. Admin can delete tasks and clients
5. When card is moved on Trello → status updates in dashboard automatically

### Status Email Flow
- **Pending** → "Project Received" email to client
- **In Progress** → "Project In Progress" email to client
- **Done** → "Project Completed" email to client

---

## Trello Board Structure

The system expects your Trello board to have exactly these 3 lists:

| List Name | Maps To |
|---|---|
| To Do | `pending` |
| Doing | `in_progress` |
| Done | `done` |

---

## Useful Commands

```bash
# Check registered Trello webhooks
python -c "
import requests, os
from dotenv import load_dotenv
load_dotenv()
r = requests.get('https://api.trello.com/1/tokens/' + os.getenv('TRELLO_TOKEN') + '/webhooks',
    params={'key': os.getenv('TRELLO_API_KEY'), 'token': os.getenv('TRELLO_TOKEN')})
print(r.json())
"

# Test WhatsApp message
python test_whatsapp.py

# Test Trello connection
python test_trello.py

# Re-seed database (WARNING: deletes all data)
cd db && python seed.py
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `404 /auth/login` | Make sure `app.include_router(auth_router)` is in `main.py` |
| `WhatsApp webhook failed` | Make sure FastAPI is running before verifying webhook |
| `Trello webhook 400` | Use full board ID (24 chars), not short ID |
| `Slack duplicate messages` | Already handled with `processed_events` set in `slack_bot.py` |
| `DB connection error` | Check `DATABASE_URL` in `.env` and PostgreSQL is running |
| `Gemini model not found` | Use `gemini-1.5-flash` — do not use `gemini-3-flash-preview` |
| `Embedding model 404` | Use `models/text-embedding-004` in `rag_engine.py` |
| `ngrok URL changed` | Use static domain: `ngrok http 8000 --url your-domain.ngrok-free.app` |

---

## Notes

- The ngrok static domain is **permanent** — set it once in Meta and Trello webhooks and never change it
- Never share your `.env` file or API keys publicly
- The Gemini free tier supports up to 15 requests per minute
- Trello webhook must be re-registered if you change the Cloudflare/ngrok URL

---

## License

This project was developed as part of an internship at CMIT. All rights reserved.
