import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
);

// GET /api/dogs/[id] - Get specific dog with parents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get dog with parent relations
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select(`
        *,
        father:dog_relations!dog_relations_dog_id_fkey(father_id),
        mother:dog_relations!dog_relations_dog_id_fkey(mother_id)
      `)
      .eq('id', id)
      .single();

    if (dogError) throw dogError;

    let father = null;
    let mother = null;

    // Get father details if exists
    if (dog.father?.[0]?.father_id) {
      const { data: fatherData } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', dog.father[0].father_id)
        .single();
      father = fatherData;
    }

    // Get mother details if exists
    if (dog.mother?.[0]?.mother_id) {
      const { data: motherData } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', dog.mother[0].mother_id)
        .single();
      mother = motherData;
    }

    const dogWithParents = {
      ...dog,
      father,
      mother
    };

    return NextResponse.json({ success: true, data: dogWithParents });
  } catch (error: any) {
    console.error('Error fetching dog:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/dogs/[id] - Update dog
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check for duplicates (excluding current dog)
    const { data: existingDog } = await supabase
      .from('dogs')
      .select('id')
      .eq('name', dogData.name.trim())
      .neq('id', id)
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
        console.error('Upload error:', uploadError);
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

    // Update dog
    const updateData: any = {
      name: dogData.name.trim(),
      gender: dogData.gender,
      birth_date: dogData.birth_date,
      breed: dogData.breed.trim(),
    };

    if (photoUrl) {
      updateData.photo_url = photoUrl;
    }

    const { data, error } = await supabase
      .from('dogs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating dog:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/dogs/[id] - Delete dog
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete dog (cascade will handle relations)
    const { error } = await supabase
      .from('dogs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting dog:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
