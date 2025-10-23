import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
);

// GET /api/dogs/search - Search dogs by name or breed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Search query must be at least 2 characters long' 
      }, { status: 400 });
    }

    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .or(`dog_name.ilike.${searchTerm},primary_kennel.ilike.${searchTerm},secondary_kennel.ilike.${searchTerm}`)
      .order('dog_name');

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
