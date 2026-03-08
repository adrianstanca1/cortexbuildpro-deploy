# Vercel Deployment

This project is configured for deployment on Vercel.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adrianstanca1/cortexbuildpro-deploy)

## Step-by-Step Setup

### 1. Update GitHub App Callback URL

⚠️ **Required before OAuth will work**

1. Go to: https://github.com/settings/apps/cortexbuildpro-com
2. Under **General** → **Identifying & authorizing users**:
   - **Callback URL**: `https://[your-vercel-app].vercel.app/auth/callback`
   - **Setup URL**: (leave empty or set to your homepage)
3. Under **Webhook**:
   - Uncheck **Active** (not needed for OAuth)
4. Click **Update application**

### 2. Get Client Secret

1. On the same page, find **Client secrets**
2. Click **Generate a new client secret**
3. Copy the secret (you won't see it again!)
4. Add it to Vercel environment variables as `GITHUB_CLIENT_SECRET`

### 3. Deploy to Vercel

**Option A: GitHub Integration (Recommended)**
```bash
# Connect repo to Vercel
# 1. Go to https://vercel.com/new
# 2. Import adrianstanca1/cortexbuildpro-deploy
# 3. Configure environment variables
# 4. Deploy
```

**Option B: CLI**
```bash
vercel login
vercel --prod
```

### 4. Set Environment Variables in Vercel

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `GITHUB_CLIENT_ID` | `Iv23lihOkwvRyu8n7WdY` |
| `GITHUB_CLIENT_SECRET` | *(from step 2)* |
| `SESSION_SECRET` | *(generate 32+ char random string)* |
| `GEMINI_API_KEY` | *(optional, for AI features)* |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | Yes |
| `SESSION_SECRET` | Session encryption secret | Yes |
| `GEMINI_API_KEY` | Google Gemini API Key | Optional |

## CI/CD with GitHub Actions

The repository includes GitHub Actions workflows:
- **ci.yml** - Runs on every push to main/develop
- **deploy.yml** - Manual deployment with environment selection

For automatic deployments, connect Vercel to your GitHub repository.