# 🗄️ Supabase Database Setup Guide

## Prerequisites
- Supabase account (sign up at [supabase.com](https://supabase.com))
- Your project created in Supabase dashboard

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `pedigree-builder`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to be ready (2-3 minutes)

## Step 2: Execute Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `database/schema.sql`
3. Paste into the SQL Editor
4. Click **Run** to execute the schema
5. Verify tables are created:
   - `dogs` table
   - `dog_relations` table
   - `dog-photos` storage bucket

## Step 3: Get Environment Variables

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

## Step 4: Configure Environment Variables

### For Local Development:
1. Copy `env.example` to `.env.local` in the `client` directory:
   ```bash
   cp env.example client/.env.local
   ```

2. Update `client/.env.local` with your Supabase values:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Step 5: Test Database Connection

1. Start your development server:
   ```bash
   cd client && npm run dev
   ```

2. Visit `http://localhost:3000`
3. Try adding a new dog
4. Check Supabase dashboard → **Table Editor** to see if data appears

## Database Schema Overview

### Tables Created:

#### `dogs` Table
- `id` (UUID, Primary Key)
- `name` (VARCHAR, Required)
- `gender` (VARCHAR, Required, Check: 'male' or 'female')
- `birth_date` (DATE, Required)
- `breed` (VARCHAR, Required)
- `photo_url` (TEXT, Optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `dog_relations` Table
- `id` (UUID, Primary Key)
- `dog_id` (UUID, Foreign Key to dogs.id)
- `father_id` (UUID, Foreign Key to dogs.id, Optional)
- `mother_id` (UUID, Foreign Key to dogs.id, Optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Storage Bucket:
- `dog-photos`: For storing dog profile photos

### Security:
- Row Level Security (RLS) enabled
- Public read/write policies (adjust for production)
- Automatic timestamp updates

## Troubleshooting

### Common Issues:

1. **"Invalid supabaseUrl" Error**:
   - Check that SUPABASE_URL is correctly formatted
   - Ensure no trailing slashes

2. **"Failed to upload photo" Error**:
   - Verify `dog-photos` bucket exists
   - Check storage policies are set correctly

3. **"Dog not found" Error**:
   - Verify the dog ID exists in the database
   - Check API route is correctly configured

4. **Build Errors**:
   - Ensure all environment variables are set
   - Check that Supabase client is properly initialized

### Verification Steps:

1. **Check Tables**:
   ```sql
   SELECT * FROM dogs;
   SELECT * FROM dog_relations;
   ```

2. **Check Storage**:
   - Go to Storage → dog-photos bucket
   - Verify files can be uploaded

3. **Check API**:
   - Test API endpoints in browser
   - Check Network tab for errors

## Production Considerations

1. **Security**:
   - Review and tighten RLS policies
   - Consider authentication for production use
   - Validate file uploads more strictly

2. **Performance**:
   - Add database indexes for large datasets
   - Consider pagination for dog lists
   - Optimize image sizes

3. **Monitoring**:
   - Set up Supabase monitoring
   - Add error logging
   - Monitor storage usage

## Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify environment variables
3. Test API endpoints individually
4. Check browser console for errors
