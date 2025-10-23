# PedigreeBuilder

Een moderne webtool voor het bouwen en beheren van hondenstambomen.

## Features

- 🐕 **Hondenprofielen**: Maak uitgebreide profielen aan met naam, geslacht, foto, geboortedatum en ras
- 👨‍👩‍👧‍👦 **Ouderkoppeling**: Koppel vader en moeder op basis van bestaande honden
- 🌳 **Stamboomvisualisatie**: Genereer visuele stamboomstructuren tot 5 generaties
- 📸 **Export**: Exporteer stambomen als PNG-bestanden
- 🔍 **Zoeken**: Zoek naar bestaande honden om duplicaten te voorkomen
- ✅ **Validatie**: Automatische controle op cirkelverwijzingen en ontbrekende ouders

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Visualisatie**: D3.js voor stamboomdiagrammen

## Installatie

```bash
# Installeer alle dependencies
npm run install:all

# Start development servers
npm run dev
```

## Project Structuur

```
pedigree/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Gedeelde types en utilities
└── docs/           # Documentatie
```

## Database Schema

### Dogs Table
- `id`: UUID primary key
- `name`: Hondennaam (uniek)
- `gender`: 'male' | 'female'
- `birth_date`: Geboortedatum
- `breed`: Ras
- `photo_url`: URL naar foto
- `created_at`: Timestamp
- `updated_at`: Timestamp

### DogRelations Table
- `id`: UUID primary key
- `dog_id`: Referentie naar hond
- `father_id`: Referentie naar vader (nullable)
- `mother_id`: Referentie naar moeder (nullable)
- `created_at`: Timestamp

## API Endpoints

- `GET /api/dogs` - Alle honden ophalen
- `GET /api/dogs/:id` - Specifieke hond ophalen
- `POST /api/dogs` - Nieuwe hond aanmaken
- `PUT /api/dogs/:id` - Hondenprofiel bijwerken
- `POST /api/dogs/:id/parents` - Ouders koppelen
- `GET /api/dogs/search` - Zoeken op naam
- `POST /api/pedigree/generate` - Stamboom genereren
- `POST /api/pedigree/export` - Stamboom exporteren als PNG

## Development

De applicatie draait op:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Supabase Dashboard: Configureer je eigen project
