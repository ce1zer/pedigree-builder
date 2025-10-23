import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
);

// POST /api/dogs/[id]/parents - Link parents to dog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { father_id, mother_id } = await request.json();

    // Validate that the dog exists
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', id)
      .single();

    if (dogError || !dog) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dog not found' 
      }, { status: 404 });
    }

    // Validate father if provided
    if (father_id) {
      const { data: father, error: fatherError } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', father_id)
        .eq('gender', 'male')
        .single();

      if (fatherError || !father) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid father selected' 
        }, { status: 400 });
      }
    }

    // Validate mother if provided
    if (mother_id) {
      const { data: mother, error: motherError } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', mother_id)
        .eq('gender', 'female')
        .single();

      if (motherError || !mother) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid mother selected' 
        }, { status: 400 });
      }
    }

    // Check for circular references
    if (father_id === id || mother_id === id) {
      return NextResponse.json({ 
        success: false, 
        error: 'A dog cannot be its own parent' 
      }, { status: 400 });
    }

    // Upsert parent relations
    const { data, error } = await supabase
      .from('dog_relations')
      .upsert({
        dog_id: id,
        father_id: father_id || null,
        mother_id: mother_id || null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
