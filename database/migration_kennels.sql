-- Migration: Convert kennel text fields to relational kennels table
-- This script:
-- 1. Creates a kennels table
-- 2. Migrates existing kennel names (merging duplicates)
-- 3. Updates dogs table to use foreign keys
-- 4. Drops old text columns

-- Step 1: Create kennels table
CREATE TABLE IF NOT EXISTS kennels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_lower TEXT NOT NULL UNIQUE, -- For case-insensitive uniqueness
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kennels_name ON kennels(name);
CREATE INDEX IF NOT EXISTS idx_kennels_name_lower ON kennels(name_lower);

-- Enable Row Level Security (RLS)
ALTER TABLE kennels ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on kennels" ON kennels
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on kennels" ON kennels
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on kennels" ON kennels
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on kennels" ON kennels
    FOR DELETE USING (true);

-- Step 2: Migrate existing primary kennel names (preserve original casing, merge duplicates case-insensitively)
-- For each unique lowercase name, use the first occurrence's original casing
INSERT INTO kennels (name, name_lower)
SELECT DISTINCT ON (LOWER(TRIM(primary_kennel)))
    TRIM(primary_kennel) as name,
    LOWER(TRIM(primary_kennel)) as name_lower
FROM dogs
WHERE primary_kennel IS NOT NULL AND TRIM(primary_kennel) != ''
ORDER BY LOWER(TRIM(primary_kennel)), created_at
ON CONFLICT (name_lower) DO NOTHING;

-- Step 3: Migrate existing secondary kennel names (preserve original casing, merge duplicates case-insensitively)
INSERT INTO kennels (name, name_lower)
SELECT DISTINCT ON (LOWER(TRIM(secondary_kennel)))
    TRIM(secondary_kennel) as name,
    LOWER(TRIM(secondary_kennel)) as name_lower
FROM dogs
WHERE secondary_kennel IS NOT NULL AND TRIM(secondary_kennel) != ''
ORDER BY LOWER(TRIM(secondary_kennel)), created_at
ON CONFLICT (name_lower) DO NOTHING;

-- Step 4: Add new foreign key columns to dogs table
ALTER TABLE dogs 
ADD COLUMN IF NOT EXISTS primary_kennel_id UUID REFERENCES kennels(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS secondary_kennel_id UUID REFERENCES kennels(id) ON DELETE SET NULL;

-- Step 5: Populate the new foreign key columns based on existing text values
UPDATE dogs d
SET primary_kennel_id = k.id
FROM kennels k
WHERE LOWER(TRIM(d.primary_kennel)) = k.name_lower
AND d.primary_kennel IS NOT NULL;

UPDATE dogs d
SET secondary_kennel_id = k.id
FROM kennels k
WHERE LOWER(TRIM(d.secondary_kennel)) = k.name_lower
AND d.secondary_kennel IS NOT NULL;

-- Step 6: Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_dogs_primary_kennel_id ON dogs(primary_kennel_id);
CREATE INDEX IF NOT EXISTS idx_dogs_secondary_kennel_id ON dogs(secondary_kennel_id);

-- Step 7: Drop old text columns (commented out for safety - uncomment after verifying migration)
-- ALTER TABLE dogs DROP COLUMN IF EXISTS primary_kennel;
-- ALTER TABLE dogs DROP COLUMN IF EXISTS secondary_kennel;

