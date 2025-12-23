-- Migration: Update kennels table to support uppercase/lowercase while maintaining case-insensitive uniqueness
-- This script updates an existing kennels table to add name_lower column for case-insensitive uniqueness
-- Run this if you already have a kennels table with lowercase names

-- Step 1: Add name_lower column if it doesn't exist
ALTER TABLE kennels 
ADD COLUMN IF NOT EXISTS name_lower TEXT;

-- Step 2: Populate name_lower for existing kennels (assuming they're already lowercase)
UPDATE kennels 
SET name_lower = LOWER(name)
WHERE name_lower IS NULL;

-- Step 3: Create unique constraint on name_lower
CREATE UNIQUE INDEX IF NOT EXISTS idx_kennels_name_lower_unique ON kennels(name_lower);

-- Step 4: Make name_lower NOT NULL (after populating it)
ALTER TABLE kennels 
ALTER COLUMN name_lower SET NOT NULL;

-- Step 5: Drop the old unique constraint on name if it exists (since we now use name_lower)
-- Note: This will fail if there are duplicate names (case-insensitive), which shouldn't happen
-- If it fails, you may need to clean up duplicates first
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'kennels_name_key' 
        AND conrelid = 'kennels'::regclass
    ) THEN
        ALTER TABLE kennels DROP CONSTRAINT kennels_name_key;
    END IF;
END $$;

-- Step 6: Create index for faster lookups on name_lower
CREATE INDEX IF NOT EXISTS idx_kennels_name_lower ON kennels(name_lower);




