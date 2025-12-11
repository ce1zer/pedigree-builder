# Database Migration Guide

This guide explains how to run database migrations for the pedigree application.

## Champion Column Migration

### Quick Migration: Add Champion Column

To add the `champion` column to the `dogs` table, run this SQL in your Supabase SQL editor:

```sql
-- Add champion column
ALTER TABLE dogs 
ADD COLUMN IF NOT EXISTS champion TEXT DEFAULT 'none';

-- Update existing dogs
UPDATE dogs 
SET champion = 'none'
WHERE champion IS NULL;

-- Set default
ALTER TABLE dogs 
ALTER COLUMN champion SET DEFAULT 'none';

-- Add check constraint
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
```

Or copy and paste the contents of `database/add_champion_column.sql` into the Supabase SQL editor.

**How to run:**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Paste the SQL script above
5. Click **Run** (or press Cmd/Ctrl + Enter)

---

# Kennel Migration Guide

This guide explains how to migrate from text-based kennel fields to relational kennel entities.

## Overview

The kennel fields (`primary_kennel` and `secondary_kennel`) have been refactored from simple text inputs to proper relational entities. This provides:

- **Data consistency**: No duplicate kennel names (case-insensitive)
- **Better UX**: Creatable select component with autocomplete
- **Easier management**: Centralized kennel data

## Migration Steps

### 1. Run the Migration Script

Execute the migration script in your Supabase SQL editor:

```sql
-- Run the migration script
\i database/migration_kennels.sql
```

Or copy and paste the contents of `database/migration_kennels.sql` into the Supabase SQL editor.

**Note:** If you already have a kennels table with lowercase names, run the update script first:

```sql
-- Run the update script to add name_lower column
\i database/migration_kennels_update_casing.sql
```

### 2. Verify Migration

After running the migration, verify the data:

```sql
-- Check kennels table
SELECT * FROM kennels ORDER BY name;

-- Check that dogs have kennel IDs
SELECT 
  id, 
  dog_name, 
  primary_kennel_id, 
  secondary_kennel_id,
  primary_kennel,
  secondary_kennel
FROM dogs 
LIMIT 10;

-- Verify all primary kennels were migrated
SELECT 
  COUNT(*) as total_dogs,
  COUNT(primary_kennel_id) as dogs_with_primary_kennel_id,
  COUNT(primary_kennel) as dogs_with_primary_kennel_text
FROM dogs;
```

### 3. Drop Old Text Columns (Optional)

Once you've verified the migration is successful and all data is correct, you can drop the old text columns:

```sql
-- WARNING: Only run this after verifying the migration!
ALTER TABLE dogs DROP COLUMN IF EXISTS primary_kennel;
ALTER TABLE dogs DROP COLUMN IF EXISTS secondary_kennel;
```

**Note**: The migration script keeps the old columns for backward compatibility. You can drop them later once you're confident everything is working.

## What the Migration Does

1. **Creates `kennels` table**: Stores kennel names with original casing, using `name_lower` for case-insensitive uniqueness
2. **Migrates existing kennels**: Extracts all unique kennel names from existing dogs, preserving original casing
3. **Merges duplicates**: Case-insensitive matching (e.g., "Golden Kennels" and "golden kennels" become one, preserving the first occurrence's casing)
4. **Updates dogs table**: Adds foreign key columns and populates them
5. **Preserves old data**: Keeps text columns for backward compatibility
6. **Supports mixed case**: Users can type and display kennels with uppercase/lowercase, but duplicates are prevented case-insensitively

## Backward Compatibility

The application supports both old and new formats during the transition:

- Old format: `dog.primary_kennel` (text)
- New format: `dog.primary_kennel_id` (UUID) with `dog.primary_kennel.name` (joined)

The code checks for both formats:
```typescript
dog.primary_kennel?.name || dog.primary_kennel_name || 'N/A'
```

## API Changes

### Before
```typescript
{
  primary_kennel: "Golden Kennels",
  secondary_kennel: "Sunshine Farms"
}
```

### After
```typescript
{
  primary_kennel_id: "uuid-here",
  secondary_kennel_id: "uuid-here"
}
```

The API automatically handles both formats during the transition period.

## UI Changes

- **Add Dog Page**: Now uses `CreatableSelect` component for kennel selection
- **Edit Dog Page**: Now uses `CreatableSelect` component for kennel selection
- **Display**: Shows kennel names from the joined `kennels` table

## Troubleshooting

### Issue: Some dogs don't have kennel IDs after migration

**Solution**: Check if the kennel names in the old columns are valid:
```sql
SELECT DISTINCT primary_kennel 
FROM dogs 
WHERE primary_kennel IS NOT NULL 
  AND primary_kennel_id IS NULL;
```

If there are any, they may have been missed. Re-run the migration UPDATE statements.

### Issue: Duplicate kennels still exist

**Solution**: The migration merges case-insensitive duplicates. If you see duplicates with different casing, they should have been merged. Check:
```sql
SELECT name, COUNT(*) 
FROM kennels 
GROUP BY LOWER(name) 
HAVING COUNT(*) > 1;
```

### Issue: API returns errors about missing kennel

**Solution**: The API should handle both formats. If you see errors, ensure the migration completed successfully and that the `kennels` table exists.

## Rollback

If you need to rollback:

1. The old text columns are still present (unless you dropped them)
2. You can revert the code changes
3. The migration doesn't delete any data, only adds new columns

However, if you've already dropped the old columns, you'll need to restore from a backup.

