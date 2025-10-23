-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean rebuild)
DROP TABLE IF EXISTS dog_relations CASCADE;
DROP TABLE IF EXISTS dogs CASCADE;

-- Create dogs table with proper structure
CREATE TABLE dogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_name TEXT NOT NULL,
    primary_kennel TEXT NOT NULL,
    secondary_kennel TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    image_url TEXT,
    father_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
    mother_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_dogs_dog_name ON dogs(dog_name);
CREATE INDEX idx_dogs_primary_kennel ON dogs(primary_kennel);
CREATE INDEX idx_dogs_secondary_kennel ON dogs(secondary_kennel);
CREATE INDEX idx_dogs_gender ON dogs(gender);
CREATE INDEX idx_dogs_father_id ON dogs(father_id);
CREATE INDEX idx_dogs_mother_id ON dogs(mother_id);

-- Enable Row Level Security (RLS)
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on dogs" ON dogs
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on dogs" ON dogs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on dogs" ON dogs
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on dogs" ON dogs
    FOR DELETE USING (true);

-- Create storage bucket for dog photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dog-photos', 'dog-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for dog photos
CREATE POLICY "Allow public read access on dog photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'dog-photos');

CREATE POLICY "Allow public upload on dog photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'dog-photos');

CREATE POLICY "Allow public update on dog photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'dog-photos');

CREATE POLICY "Allow public delete on dog photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'dog-photos');

-- Insert sample data
INSERT INTO dogs (dog_name, primary_kennel, secondary_kennel, gender) VALUES
    ('Max', 'Golden Kennels', 'Sunshine Farms', 'male'),
    ('Luna', 'German Elite', NULL, 'female'),
    ('Buddy', 'Labrador House', 'Happy Tails', 'male')
ON CONFLICT DO NOTHING;