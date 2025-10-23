import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
);

// GET /api/dogs - Get all dogs with their parents
export async function GET() {
  try {
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select(`
        *,
        father:dog_relations!dog_relations_dog_id_fkey(father_id),
        mother:dog_relations!dog_relations_dog_id_fkey(mother_id)
      `)
      .order('name');
    
    if (dogsError) throw dogsError;

    // Get parent details for each dog
    const dogsWithParents = await Promise.all(
      dogs.map(async (dog) => {
        let father = null;
        let mother = null;

        if (dog.father?.[0]?.father_id) {
          const { data: fatherData } = await supabase
            .from('dogs')
            .select('*')
            .eq('id', dog.father[0].father_id)
            .single();
          father = fatherData;
        }

        if (dog.mother?.[0]?.mother_id) {
          const { data: motherData } = await supabase
            .from('dogs')
            .select('*')
            .eq('id', dog.mother[0].mother_id)
            .single();
          mother = motherData;
        }

        return {
          ...dog,
          father,
          mother
        };
      })
    );
    
    return NextResponse.json({ success: true, data: dogsWithParents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/dogs - Create new dog
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const dogData = JSON.parse(formData.get('dogData') as string);
    const photo = formData.get('photo') as File;
    
    // Validate data
    if (!dogData.name || dogData.name.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name must be at least 2 characters long' 
      }, { status: 400 });
    }
    
    if (!dogData.gender || !['male', 'female'].includes(dogData.gender)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gender must be "male" or "female"' 
      }, { status: 400 });
    }
    
    if (!dogData.birth_date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Birth date is required' 
      }, { status: 400 });
    }
    
    if (!dogData.breed || dogData.breed.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Breed must be at least 2 characters long' 
      }, { status: 400 });
    }
    
    // Check for duplicates
    const { data: existingDog } = await supabase
      .from('dogs')
      .select('id')
      .eq('name', dogData.name.trim())
      .single();
    
    if (existingDog) {
      return NextResponse.json({ 
        success: false, 
        error: 'A dog with this name already exists' 
      }, { status: 400 });
    }
    
    let photoUrl = null;
    
    // Handle photo upload if provided
    if (photo && photo.size > 0) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, photo, {
          contentType: photo.type,
          upsert: false
        });
      
      if (uploadError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to upload photo' 
        }, { status: 500 });
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);
      
      photoUrl = publicUrl;
    }
    
    // Create dog
    const { data, error } = await supabase
      .from('dogs')
      .insert([{
        name: dogData.name.trim(),
        gender: dogData.gender,
        birth_date: dogData.birth_date,
        breed: dogData.breed.trim(),
        photo_url: photoUrl
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}