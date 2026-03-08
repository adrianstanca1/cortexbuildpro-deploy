# Vercel Deployment

This project is configured for deployment on Vercel.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adrianstanca1/cortexbuildpro-deploy)

## Manual Setup

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link Project**
   ```bash
   vercel link
   ```

3. **Set Environment Variables**
   In Vercel Dashboard, add:
   - `GITHUB_CLIENT_ID` - Your GitHub OAuth App Client ID
   - `GITHUB_CLIENT_SECRET` - Your GitHub OAuth App Client Secret
   - `GEMINI_API_KEY` - Google Gemini API key for AI features

4. **Deploy**
   ```bash
   vercel --prod
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | Yes |
| `GEMINI_API_KEY` | Google Gemini API Key | Optional |
| `SESSION_SECRET` | Session encryption secret | Yes |

## GitHub Integration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import project from GitHub: `adrianstanca1/cortexbuildpro-deploy`
3. Configure environment variables
4. Deploy

## CI/CD with GitHub Actions

The repository includes GitHub Actions workflows:
- **ci.yml** - Runs on every push to main/develop
- **deploy.yml** - Manual deployment with environment selection

For automatic deployments, connect Vercel to your GitHub repository.