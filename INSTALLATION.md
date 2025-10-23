# PedigreeBuilder - Installatie Instructies

## Vereisten

- Node.js 18+ 
- npm of yarn
- Supabase account (gratis)

## Stap 1: Supabase Setup

1. Ga naar [supabase.com](https://supabase.com) en maak een account aan
2. Maak een nieuw project aan
3. Ga naar Settings > API en kopieer:
   - Project URL
   - Anon public key
4. Ga naar Storage en maak een bucket aan genaamd `dog-photos` (public)

## Stap 2: Database Schema

1. Ga naar de SQL Editor in je Supabase dashboard
2. Kopieer en voer het schema uit uit `database/schema.sql`
3. Dit maakt de benodigde tabellen en policies aan

## Stap 3: Environment Variables

1. Kopieer `env.example` naar `.env` in de root directory
2. Vul je Supabase credentials in:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3001
```

## Stap 4: Installatie

```bash
# Installeer alle dependencies
npm run install:all

# Of handmatig:
npm install
cd server && npm install
cd ../client && npm install
```

## Stap 5: Development Server Starten

```bash
# Start beide servers tegelijk
npm run dev

# Of handmatig:
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
cd client && npm run dev
```

## Stap 6: Applicatie Openen

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Production Build

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## Troubleshooting

### Supabase Connection Issues
- Controleer je environment variables
- Zorg dat je Supabase project actief is
- Check je API keys in Supabase dashboard

### Photo Upload Issues
- Zorg dat de `dog-photos` bucket bestaat in Supabase Storage
- Controleer de bucket policies
- Max file size is 5MB

### Database Errors
- Voer het schema opnieuw uit als er errors zijn
- Check de Row Level Security policies
- Zorg dat alle constraints correct zijn

## Features

✅ Hondenprofielen aanmaken en bewerken  
✅ Foto uploads naar Supabase Storage  
✅ Ouderkoppeling met validatie  
✅ Stamboom generatie (tot 5 generaties)  
✅ PNG export van stambomen  
✅ Zoeken en filteren  
✅ Responsive design  
✅ TypeScript voor type safety  

## Volgende Stappen

- [ ] Stamboom visualisatie met D3.js
- [ ] Bulk import functionaliteit
- [ ] Export naar verschillende formaten
- [ ] Gebruikersauthenticatie
- [ ] Multi-tenant support
- [ ] Mobile app
