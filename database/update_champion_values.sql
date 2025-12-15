-- Migration: Update champion column to support new values
-- Run this script in your Supabase SQL editor

-- Step 1: Drop the existing check constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'dogs_champion_check'
    ) THEN
        ALTER TABLE dogs DROP CONSTRAINT dogs_champion_check;
    END IF;
END $$;

-- Step 2: Add the new check constraint with all champion values
ALTER TABLE dogs 
    ADD CONSTRAINT dogs_champion_check 
    CHECK (champion IN ('none', 'ch', 'dual_ch', 'gr_ch', 'dual_gr_ch', 'nw_gr_ch', 'inw_gr_ch'));

-- Step 3: Verify the constraint was added
-- You can check this by running:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conname = 'dogs_champion_check';


