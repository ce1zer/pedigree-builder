-- Quick migration: Add name_lower column to existing kennels table
-- Run this in your Supabase SQL editor if you get "column name_lower does not exist" errors

-- Step 1: Add name_lower column if it doesn't exist
ALTER TABLE kennels 
ADD COLUMN IF NOT EXISTS name_lower TEXT;

-- Step 2: Populate name_lower for existing kennels
UPDATE kennels 
SET name_lower = LOWER(name)
WHERE name_lower IS NULL;

-- Step 3: Make name_lower NOT NULL (after populating it)
ALTER TABLE kennels 
ALTER COLUMN name_lower SET NOT NULL;

-- Step 4: Create unique constraint on name_lower
CREATE UNIQUE INDEX IF NOT EXISTS idx_kennels_name_lower_unique ON kennels(name_lower);

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kennels_name_lower ON kennels(name_lower);


