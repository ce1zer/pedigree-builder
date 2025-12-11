import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Supabase client configuration
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
);

// Constants
const MIN_SEARCH_LENGTH = 2;

// Helper function to create error response
const createErrorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ success: false, error: message }, { status });
};

// Helper function to create success response
const createSuccessResponse = (data: any) => {
  return NextResponse.json({ success: true, data });
};

/**
 * GET /api/dogs/search - Search dogs by name or kennel
 * Query parameter: q (search term)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Validate search query
    if (!query || query.trim().length < MIN_SEARCH_LENGTH) {
      return createErrorResponse(
        'Search query must be at least 2 characters long', 
        400
      );
    }

    const searchTerm = `%${query.trim()}%`;

    // Search in dogs table with kennel joins
    // Note: This searches in both old text fields (for backward compatibility) and new kennel names
    const { data, error } = await supabase
      .from('dogs')
      .select(`
        *,
        primary_kennel:primary_kennel_id(id, name),
        secondary_kennel:secondary_kennel_id(id, name)
      `)
      .or(`dog_name.ilike.${searchTerm},primary_kennel.ilike.${searchTerm},secondary_kennel.ilike.${searchTerm}`)
      .order('dog_name');

    if (error) throw error;

    // Return with no-cache headers
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error: any) {
    return createErrorResponse(error.message);
  }
}