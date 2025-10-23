-- PedigreeBuilder Database Schema
-- Supabase PostgreSQL Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dogs table
CREATE TABLE dogs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    birth_date DATE NOT NULL,
    breed VARCHAR(255) NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dog relations table (parents)
CREATE TABLE dog_relations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    father_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
    mother_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a dog can't be its own parent
    CONSTRAINT no_self_parent CHECK (dog_id != father_id AND dog_id != mother_id),
    
    -- Ensure father and mother are different
    CONSTRAINT different_parents CHECK (father_id IS NULL OR mother_id IS NULL OR father_id != mother_id),
    
    -- Unique constraint to prevent duplicate relations
    UNIQUE(dog_id)
);

-- Indexes for better performance
CREATE INDEX idx_dogs_name ON dogs(name);
CREATE INDEX idx_dogs_breed ON dogs(breed);
CREATE INDEX idx_dogs_gender ON dogs(gender);
CREATE INDEX idx_dog_relations_dog_id ON dog_relations(dog_id);
CREATE INDEX idx_dog_relations_father_id ON dog_relations(father_id);
CREATE INDEX idx_dog_relations_mother_id ON dog_relations(mother_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_dogs_updated_at 
    BEFORE UPDATE ON dogs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_relations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON dogs
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON dog_relations
    FOR ALL USING (true);

-- Storage bucket for dog photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dog-photos', 'dog-photos', true);

-- Storage policies
CREATE POLICY "Allow public access to dog photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'dog-photos');

CREATE POLICY "Allow authenticated users to upload dog photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'dog-photos');

CREATE POLICY "Allow authenticated users to update dog photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'dog-photos');

CREATE POLICY "Allow authenticated users to delete dog photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'dog-photos');

-- Sample data (optional)
INSERT INTO dogs (name, gender, birth_date, breed) VALUES
('Max', 'male', '2020-01-15', 'Golden Retriever'),
('Luna', 'female', '2019-05-20', 'Duitse Herder'),
('Buddy', 'male', '2021-03-10', 'Labrador'),
('Bella', 'female', '2020-08-25', 'Border Collie');

-- Sample relations (optional)
INSERT INTO dog_relations (dog_id, father_id, mother_id) VALUES
((SELECT id FROM dogs WHERE name = 'Max'), NULL, NULL),
((SELECT id FROM dogs WHERE name = 'Luna'), NULL, NULL),
((SELECT id FROM dogs WHERE name = 'Buddy'), (SELECT id FROM dogs WHERE name = 'Max'), (SELECT id FROM dogs WHERE name = 'Luna')),
((SELECT id FROM dogs WHERE name = 'Bella'), (SELECT id FROM dogs WHERE name = 'Max'), (SELECT id FROM dogs WHERE name = 'Luna'));
