# Grabr

Grabr is a simple web app that lets you paste a video URL and download it as `MP4` or `MP3`.

Built with:
- Frontend: Next.js + Tailwind
- Backend: FastAPI + `yt-dlp`
- Deploy: Vercel (frontend) + Railway (backend)

## Why I Built This

I made Grabr for my little brother. He had a video he needed, and every "free downloader" site we found was full of popups, fake buttons, spam redirects, and sketchy ads that felt unsafe.

So I built a cleaner alternative: paste the link, pick a format, and download. No ad maze and no weird click traps.

## The Problem Grabr Solves

- Too many download sites are overloaded with aggressive ads.
- Some pages use misleading buttons and redirect spam.
- A lot of people (especially younger users) cannot easily tell what is safe to click.
- Grabr is designed to be direct and minimal so the experience is simple.

> Note: Grabr improves the user experience by removing the clutter and risky ad patterns from typical downloader sites. Always use responsibly and respect platform terms and copyright laws.

## How It Works

1. Paste a supported link (YouTube, TikTok, Instagram, Twitter/X, and more).
2. Click **Fetch** to load video info.
3. Choose format (`MP4` or `MP3`).
4. Click **Download**.

## Run Locally

## 1) Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## 2) Frontend (Next.js)

In `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Env

### Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=https://<your-backend-domain>.up.railway.app
```

### Backend (Railway)

```env
ALLOWED_ORIGINS=https://<your-frontend>.vercel.app,http://localhost:3000
ALLOWED_ORIGIN_REGEX=^https://.*\.vercel\.app$
```

## Find Me

- Website: [https://itwela.dev](https://itwela.dev)
- Message me from the contact options on the site (including Mail).

---

by itwela - caveman creative - itwela.dev
