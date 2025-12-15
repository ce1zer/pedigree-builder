# Deployment Guide

## ✅ Deployment Status

**Production URL:** https://client-e129atiq4-ceizers-projects.vercel.app  
**Project:** ceizers-projects/client  
**Status:** ● Ready  
**Last Deployed:** Just now

## 🔧 Required Environment Variables

The application requires the following environment variables to be set in Vercel:

### Critical Variables (Required)

1. **SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://your-project-id.supabase.co`
   - Get from: Supabase Dashboard → Settings → API → Project URL

2. **SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Get from: Supabase Dashboard → Settings → API → anon public key

3. **SUPABASE_SERVICE_ROLE_KEY** (Optional but recommended)
   - Your Supabase service role key
   - Get from: Supabase Dashboard → Settings → API → service_role key
   - ⚠️ Keep this secret - never expose in client-side code

### Optional Variables

- **NODE_ENV**: `production` (automatically set by Vercel)
- **PORT**: Not needed (Vercel handles this)
- **DATABASE_URL**: Only if using direct database connections
- **SUPABASE_STORAGE_BUCKET**: `dog-photos` (default)

## 📝 How to Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **ceizers-projects/client**
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: `SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**
5. Repeat for `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`

## 🔄 Redeploy After Setting Variables

After adding environment variables, you need to redeploy:

```bash
cd client
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Select **Redeploy**

## 🚀 Deployment Commands

### Deploy to Production
```bash
cd client
vercel --prod
```

### Deploy Preview
```bash
cd client
vercel
```

### View Deployments
```bash
cd client
vercel ls
```

### View Deployment Logs
```bash
cd client
vercel logs [deployment-url]
```

## 📋 Pre-Deployment Checklist

- [x] ✅ Build succeeds locally
- [x] ✅ Dependencies installed
- [x] ✅ TypeScript compiles without errors
- [ ] ⚠️ Environment variables configured in Vercel
- [ ] ⚠️ Supabase database schema executed
- [ ] ⚠️ Supabase storage bucket `dog-photos` created
- [ ] ⚠️ Test deployment after environment variables are set

## 🔍 Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json`
- Verify TypeScript configuration is correct
- Ensure Next.js version is compatible

### Runtime Errors
- Verify environment variables are set correctly
- Check Supabase project is active
- Verify database schema is applied
- Check storage bucket exists and has correct policies

### API Route Errors
- Ensure Supabase environment variables are set
- Check API routes are in `src/app/api/` directory
- Verify route handlers export correct functions

## 📚 Related Documentation

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Environment Variables Example](./env.example)

---

**Last Updated:** January 2025  
**Deployment Method:** Vercel CLI  
**Framework:** Next.js 16

