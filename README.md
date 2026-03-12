# Angloville Tasks

Marketing task management system for Angloville team.

## Features

- ✅ Task management (create, assign, track)
- 📋 **Subtasks** - break down tasks into smaller pieces with individual assignees
- 🇬🇧 English external request form (`/request`)
- 🌐 Auto-translation for English tasks
- 📧 Email notifications via Resend
- 👥 Team member management
- 🏷️ Market filtering (PL, NS, IT, Exchange)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR-USERNAME/angloville-tasks.git
cd angloville-tasks
npm install
```

### 2. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `supabase-schema.sql`
3. Copy Project URL and anon key from Settings → API

### 3. Resend

1. Create account at [resend.com](https://resend.com)
2. Get API key from Dashboard → API Keys
3. (Optional) Verify domain for production emails

### 4. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
RESEND_API_KEY=re_xxx...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

## Subtasks

Each task can have multiple subtasks:
- Click "+ Dodaj" in task details to add subtask
- Assign individual team members to subtasks
- Check/uncheck to mark as done
- Progress bar shows completion (e.g. "3/5")

## Project Structure

```
├── app/
│   ├── page.jsx              # Main task app
│   ├── request/page.jsx      # English request form
│   ├── api/notify/route.js   # Email API
│   ├── globals.css
│   └── layout.jsx
├── lib/
│   └── supabase.js           # Database client
├── supabase-schema.sql       # Database schema
└── package.json
```

## Team Members

| Name | Role |
|------|------|
| Edyta Kędzior | Manager |
| Aleksandra Witkowska | Analytics |
| Damian Ładak | Tech |
| Damian Wójcicki | Content |
| Wojciech Pisarski | Ads |
| Klaudia Gołembiowska | Content/Influencers |

## License

Private - Angloville
