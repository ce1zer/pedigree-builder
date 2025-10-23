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
        father:father_id(id, dog_name, primary_kennel, secondary_kennel, gender, image_url),
        mother:mother_id(id, dog_name, primary_kennel, secondary_kennel, gender, image_url)
      `)
      .eq('id', id)
      .single();

    if (dogError) throw dogError;

    return NextResponse.json({ success: true, data: dog });
  } catch (error: any) {
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
    if (!dogData.dog_name || dogData.dog_name.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dog name must be at least 2 characters long' 
      }, { status: 400 });
    }
    
    if (!dogData.primary_kennel || dogData.primary_kennel.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Primary kennel must be at least 2 characters long' 
      }, { status: 400 });
    }
    
    if (!dogData.gender || !['male', 'female'].includes(dogData.gender)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gender must be "male" or "female"' 
      }, { status: 400 });
    }

    // Check for duplicates (excluding current dog)
    const { data: existingDog } = await supabase
      .from('dogs')
      .select('id')
      .eq('dog_name', dogData.dog_name.trim())
      .neq('id', id)
      .single();
    
    if (existingDog) {
      return NextResponse.json({ 
        success: false, 
        error: 'A dog with this name already exists' 
      }, { status: 400 });
    }

    let imageUrl = null;

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
      
      imageUrl = publicUrl;
    }

    // Update dog
    const updateData: any = {
      dog_name: dogData.dog_name.trim(),
      primary_kennel: dogData.primary_kennel.trim(),
      secondary_kennel: dogData.secondary_kennel?.trim() || null,
      gender: dogData.gender,
      father_id: dogData.father_id || null,
      mother_id: dogData.mother_id || null,
    };

    if (imageUrl) {
      updateData.image_url = imageUrl;
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
