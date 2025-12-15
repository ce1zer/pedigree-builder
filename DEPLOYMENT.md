# Deployment Guide

## Automatic Deployment

The project is configured for automatic deployment to Vercel via GitHub Actions.

### Setup

1. **Add GitHub Secrets** (Settings → Secrets and variables → Actions):
   - `VERCEL_TOKEN` - Get from https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` - From your Vercel project settings
   - `VERCEL_PROJECT_ID` - From your Vercel project settings
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key

2. **Push to main/master** - Deployment happens automatically

### Alternative: Vercel GitHub Integration

Connect your GitHub repo directly in Vercel dashboard for simpler auto-deployment (no secrets needed).

## Manual Deployment

```bash
npm i -g vercel
cd client
vercel --prod
```
