import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
);

// GET /api/dogs - Alle honden ophalen
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/dogs - Nieuwe hond aanmaken
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const dogData = JSON.parse(formData.get('dogData') as string);
    
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
    
    // Check voor duplicaten
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
    
    // Maak hond aan
    const { data, error } = await supabase
      .from('dogs')
      .insert([{
        name: dogData.name.trim(),
        gender: dogData.gender,
        birth_date: dogData.birth_date,
        breed: dogData.breed.trim(),
        photo_url: null // Voor nu geen foto upload
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}