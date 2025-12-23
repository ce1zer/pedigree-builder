-- Performance Optimization: Add missing database indexes
-- Run this script in your Supabase SQL editor

-- Index for champion column (used in duplicate checks and queries)
CREATE INDEX IF NOT EXISTS idx_dogs_champion ON dogs(champion);

-- Indexes for kennel foreign keys (if not already created by migration)
CREATE INDEX IF NOT EXISTS idx_dogs_primary_kennel_id ON dogs(primary_kennel_id);
CREATE INDEX IF NOT EXISTS idx_dogs_secondary_kennel_id ON dogs(secondary_kennel_id);

-- Composite index for the unique check (champion + primary_kennel_id + dog_name)
-- This significantly speeds up duplicate checking queries
CREATE INDEX IF NOT EXISTS idx_dogs_unique_check ON dogs(champion, primary_kennel_id, dog_name);

-- Index for created_at (useful for sorting and filtering by date)
CREATE INDEX IF NOT EXISTS idx_dogs_created_at ON dogs(created_at DESC);




