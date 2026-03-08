# CortexBuildPro Deployment Guide

## Prerequisites

- GitHub account (adrianstanca1)
- Vercel account (free tier works)
- GitHub App: https://github.com/apps/cortexbuildpro-com

## Step 1: Deploy to Vercel

### Option A: One-Click Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adrianstanca1/cortexbuildpro-deploy&env=GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,SESSION_SECRET)

Click the button above and follow the prompts.

### Option B: Manual Deploy

1. Go to https://vercel.com/new
2. Import `adrianstanca1/cortexbuildpro-deploy`
3. Configure:
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Option C: CLI Deploy

```bash
vercel login
vercel --prod
```

## Step 2: Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Where to get |
|----------|-------|--------------|
| `GITHUB_CLIENT_ID` | `Iv23lihOkwvRyu8n7WdY` | GitHub App settings |
| `GITHUB_CLIENT_SECRET` | (your secret) | GitHub App settings |
| `SESSION_SECRET` | (random 32+ chars) | Generate with: `openssl rand -base64 32` |
| `GEMINI_API_KEY` | (optional) | Google AI Studio |

## Step 3: Update GitHub App Callback URL

1. Go to https://github.com/settings/apps/cortexbuildpro-com
2. Update **Callback URL** to: `https://your-app.vercel.app/auth/callback`
3. Update **Homepage URL** to: `https://your-app.vercel.app`
4. Save changes

## Step 4: Configure Custom Domain (Optional)

1. In Vercel Dashboard → Project → Settings → Domains
2. Add: `cortexbuildpro.com` and `www.cortexbuildpro.com`
3. Update DNS records as shown in Vercel

## Step 5: Database Setup (Optional)

For production data persistence:

### Supabase (Recommended)
```bash
# Install Supabase client
npm install @supabase/supabase-js

# Add to .env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### PlanetScale
```bash
npm install @planetscale/database
DATABASE_URL=mysql://...
```

## CI/CD Pipeline

The repository includes GitHub Actions workflows:

- **ci.yml** - Runs on every push: build, lint, test
- **deploy.yml** - Manual deployment with environment selection

### Automatic Deployments

When Vercel is connected to GitHub:
- Push to `main` → deploys to production
- Push to `develop` → deploys to staging

## Troubleshooting

### Build Fails
```bash
# Test build locally
npm ci
npm run build
```

### OAuth Not Working
- Verify callback URL matches exactly
- Check environment variables are set
- Ensure GitHub App is installed on your account

### API Errors
- Check server logs in Vercel Dashboard
- Verify GEMINI_API_KEY is set if using AI features

## Support

- GitHub Issues: https://github.com/adrianstanca1/cortexbuildpro-deploy/issues
- Vercel Docs: https://vercel.com/docs