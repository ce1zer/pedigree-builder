# PedigreeBuilder - Vercel Deployment Guide

## 🚀 Stap-voor-stap Deployment naar Vercel

### Stap 1: GitHub Repository Aanmaken

1. **Ga naar [github.com](https://github.com) en log in**
2. **Klik op "New repository"**
3. **Vul de details in:**
   - **Repository name**: `pedigree-builder`
   - **Description**: `Een webtool voor het bouwen en beheren van hondenstambomen`
   - **Visibility**: Public of Private (naar keuze)
   - **Initialize**: Laat leeg (we hebben al bestanden)

4. **Klik op "Create repository"**

### Stap 2: Project naar GitHub Pushen

```bash
# In je project directory
cd /Users/jordylissenburg/pedigree

# Voeg alle bestanden toe
git add .

# Maak eerste commit
git commit -m "Initial commit: PedigreeBuilder application"

# Voeg GitHub remote toe (vervang USERNAME met je GitHub username)
git remote add origin https://github.com/USERNAME/pedigree-builder.git

# Push naar GitHub
git push -u origin main
```

### Stap 3: Vercel Project Aanmaken

1. **Ga naar [vercel.com](https://vercel.com) en log in met GitHub**
2. **Klik op "New Project"**
3. **Selecteer je `pedigree-builder` repository**
4. **Configureer het project:**

#### Project Settings:
- **Framework Preset**: `Other`
- **Root Directory**: `/` (laat leeg)
- **Build Command**: `cd client && npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm run install:all`

#### Environment Variables:
Voeg deze environment variables toe in Vercel:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
```

### Stap 4: Vercel Configuratie

Het project gebruikt een `vercel.json` configuratie die:
- Frontend serveert vanuit `client/dist`
- API routes doorstuurt naar `server/index.js`
- Monorepo structuur ondersteunt

### Stap 5: Supabase Productie Setup

1. **Ga naar je Supabase Dashboard**
2. **Zorg dat je database schema is uitgevoerd**
3. **Controleer Storage bucket `dog-photos`**
4. **Update Row Level Security policies indien nodig**

### Stap 6: Deployment

1. **Klik op "Deploy" in Vercel**
2. **Wacht tot deployment voltooid is**
3. **Je krijgt een URL zoals: `https://pedigree-builder.vercel.app`**

### Stap 7: Custom Domain (Optioneel)

1. **Ga naar Project Settings → Domains**
2. **Voeg je eigen domein toe**
3. **Configureer DNS records**

## 🔧 Troubleshooting

### Build Errors
- Controleer of alle dependencies correct zijn geïnstalleerd
- Zorg dat environment variables zijn ingesteld
- Check de build logs in Vercel dashboard

### API Errors
- Controleer Supabase credentials
- Zorg dat database schema is uitgevoerd
- Check CORS settings

### Storage Issues
- Controleer Supabase Storage bucket policies
- Zorg dat bucket `dog-photos` bestaat en public is

## 📁 Project Structuur op Vercel

```
/
├── client/          # React frontend (gebouwd naar dist/)
├── server/          # Express API (serverless functions)
├── vercel.json      # Vercel configuratie
└── package.json     # Root package.json
```

## 🌐 URLs na Deployment

- **Frontend**: `https://your-project.vercel.app`
- **API**: `https://your-project.vercel.app/api`
- **Supabase**: Je eigen Supabase project

## 🔄 Continuous Deployment

Na de eerste deployment:
- Elke push naar `main` branch triggert automatisch een nieuwe deployment
- Preview deployments voor pull requests
- Rollback mogelijkheden via Vercel dashboard

## 📊 Monitoring

- **Vercel Analytics**: Automatisch ingeschakeld
- **Function Logs**: Beschikbaar in Vercel dashboard
- **Performance**: Real User Monitoring (RUM)

## 🚀 Next Steps

Na succesvolle deployment:
1. Test alle functionaliteiten
2. Configureer custom domain
3. Setup monitoring en alerts
4. Implementeer CI/CD workflows
5. Add performance optimizations
