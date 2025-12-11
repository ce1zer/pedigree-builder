-- Migration: Add champion column to dogs table
-- Run this in your Supabase SQL editor
-- Go to: Supabase Dashboard > SQL Editor > New Query

-- Step 1: Add champion column if it doesn't exist
ALTER TABLE dogs 
ADD COLUMN IF NOT EXISTS champion TEXT DEFAULT 'none';

-- Step 2: Update existing dogs to have 'none' as default if NULL
UPDATE dogs 
SET champion = 'none'
WHERE champion IS NULL;

-- Step 3: Make sure the column is NOT NULL (after setting defaults)
ALTER TABLE dogs 
ALTER COLUMN champion SET DEFAULT 'none';

-- Step 4: Add check constraint to ensure only valid values
-- Note: This will fail if constraint already exists, which is fine
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'dogs_champion_check' 
        AND conrelid = 'dogs'::regclass
    ) THEN
        ALTER TABLE dogs 
        ADD CONSTRAINT dogs_champion_check 
        CHECK (champion IN ('none', 'ch', 'gr_ch'));
    END IF;
END $$;

-- Step 5: Verify the column was added (optional - just to check)
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'dogs' AND column_name = 'champion';
