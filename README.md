# PostSpark

LinkedIn Post Generator for Solopreneurs & Coaches

## Features

- **Personalized Onboarding** - 5-step flow: user type, niche, target audience, email, LinkedIn URL
- **AI-Powered Ideas** - 10 personalized post ideas based on your profile
- **3 Post Versions** - Professional, Casual, Storytelling tones for each idea
- **Save & History** - Save favorite posts, view generation history
- **Email System** - Welcome email + weekly ideas every Monday
- **Dashboard** - Personal dashboard with saved posts and stats

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- PostgreSQL (Neon)
- Z.ai API (AI generation)
- Apify (LinkedIn scraping)
- SMTP2GO (emails)
- PM2 (process manager)

## Environment Variables

```env
APIFY_API_TOKEN=
ZAI_API_KEY=
DATABASE_URL=
SMTP2GO_API_KEY=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```

## Setup

```bash
pnpm install
node scripts/init-db.mjs  # Initialize database tables
pnpm build
pnpm start
```

## API Routes

- `POST /api/analyze` - Generate post ideas
- `POST /api/write` - Write full posts (3 versions)
- `POST /api/posts/save` - Save a post
- `GET /api/dashboard?email=` - Get user dashboard data
- `GET /api/cron/weekly?secret=` - Trigger weekly email job

## Live

https://postspark.pro
