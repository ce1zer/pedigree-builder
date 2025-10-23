-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create dogs table
CREATE TABLE IF NOT EXISTS dogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    birth_date DATE NOT NULL,
    breed VARCHAR(100) NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dog_relations table for parent-child relationships
CREATE TABLE IF NOT EXISTS dog_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    father_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
    mother_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dog_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dogs_name ON dogs(name);
CREATE INDEX IF NOT EXISTS idx_dogs_breed ON dogs(breed);
CREATE INDEX IF NOT EXISTS idx_dogs_gender ON dogs(gender);
CREATE INDEX IF NOT EXISTS idx_dog_relations_dog_id ON dog_relations(dog_id);
CREATE INDEX IF NOT EXISTS idx_dog_relations_father_id ON dog_relations(father_id);
CREATE INDEX IF NOT EXISTS idx_dog_relations_mother_id ON dog_relations(mother_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_dogs_updated_at 
    BEFORE UPDATE ON dogs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dog_relations_updated_at 
    BEFORE UPDATE ON dog_relations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_relations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access on dogs" ON dogs
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on dogs" ON dogs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on dogs" ON dogs
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on dogs" ON dogs
    FOR DELETE USING (true);

CREATE POLICY "Allow public read access on dog_relations" ON dog_relations
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on dog_relations" ON dog_relations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on dog_relations" ON dog_relations
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on dog_relations" ON dog_relations
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

-- Insert some sample data (optional)
INSERT INTO dogs (name, gender, birth_date, breed) VALUES
    ('Max', 'male', '2020-01-15', 'Golden Retriever'),
    ('Luna', 'female', '2019-06-20', 'German Shepherd'),
    ('Buddy', 'male', '2021-03-10', 'Labrador Retriever')
ON CONFLICT DO NOTHING;