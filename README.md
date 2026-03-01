# 🧠 FinSmart Backend API

Backend API for **FinSmart** — an intelligent personal finance coach powered by AI.

Built with [NestJS](https://nestjs.com/) + [Supabase](https://supabase.com/) + [Gemini AI](https://ai.google.dev/).

## ✨ Features

- **🔐 Authentication** — Supabase Auth with JWT guards
- **💰 Transactions** — CRUD with multi-currency support (NIO/USD)
- **📊 Categories** — Custom spending categories
- **🎯 Goals** — Financial goal tracking with deadlines
- **🤖 AI Coach** — Conversational financial advisor (Gemini 3 Flash)
- **📈 Insights** — AI-generated spending trends, alerts & recommendations
- **💱 Currency** — Real-time NIO/USD exchange rates (BCN)
- **📁 Upload** — PDF/Excel file processing with BullMQ queues

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini 3 Flash Preview |
| Queue | BullMQ + Redis |
| Auth | Supabase Auth + JWT |
| Language | TypeScript 5 |

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Redis server running locally
- Supabase project
- Google AI API key

### Setup

```bash
# Install dependencies
npm install

# Copy env example and fill in your values
cp .env.dev .env

# Run database migrations on your Supabase project
# (see /supabase/migrations/)

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Environment Variables

See [`.env.dev`](.env.dev) for required variables:

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `GEMINI_API_KEY` | Google AI API key |
| `REDIS_HOST` | Redis host (default: localhost) |
| `REDIS_PORT` | Redis port (default: 6379) |

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| GET | `/transactions` | List transactions |
| POST | `/transactions` | Create transaction |
| GET | `/transactions/summary` | Spending summary |
| GET | `/categories` | List categories |
| POST | `/categories` | Create category |
| GET | `/insights` | Get AI insights |
| GET | `/insights/dashboard` | AI dashboard data |
| POST | `/insights/chat` | Chat with AI coach |
| GET | `/currency/rate` | Get NIO/USD rate |
| POST | `/currency/convert` | Convert currency |

## 📂 Project Structure

```
src/
├── auth/            # Authentication module
├── categories/      # Spending categories
├── classification/  # AI transaction classifier
├── common/          # Guards, decorators, interceptors
├── config/          # Environment configuration
├── currency/        # Exchange rate service (BCN)
├── gemini/          # Google Gemini AI service
├── insights/        # AI insights & chat coach
├── supabase/        # Supabase client service
├── transactions/    # Transaction CRUD
├── upload/          # File processing (PDF/Excel)
└── main.ts          # App entry point
```

## 👤 Author

**Matthew Reyes** — [@Bymatt10](https://github.com/Bymatt10)

## 📄 License

UNLICENSED — Private project.
