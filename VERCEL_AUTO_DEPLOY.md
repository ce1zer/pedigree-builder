# Automatic Vercel Deployment Setup

## Current Status
✅ Vercel project is linked: `pedigree-builder`
✅ GitHub repository: `https://github.com/ce1zer/pedigree-builder.git`

## To Enable Automatic Deployments

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **pedigree-builder**
3. Go to **Settings** → **Git**
4. Click **Connect Git Repository**
5. Select **GitHub** and authorize Vercel
6. Choose repository: `ce1zer/pedigree-builder`
7. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
8. Click **Deploy**

### Option 2: Via Vercel CLI (Alternative)

If you prefer CLI, you can use:
```bash
vercel git connect
```

## How It Works

Once connected:
- ✅ Every push to `main` branch → Automatic production deployment
- ✅ Every pull request → Automatic preview deployment
- ✅ Deployments are triggered automatically, no manual steps needed

## Verify Setup

After connecting, test by:
1. Making a small change
2. Committing and pushing to `main`
3. Check Vercel dashboard - you should see a new deployment automatically start

## Current Configuration

- **Project**: pedigree-builder
- **Root Directory**: client (configured in vercel.json)
- **Framework**: Next.js
- **Node Version**: 22.x
