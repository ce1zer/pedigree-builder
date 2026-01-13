import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Supabase client configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key'
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
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate search query
    if (!query || query.trim().length < MIN_SEARCH_LENGTH) {
      return createErrorResponse(
        'Search query must be at least 2 characters long', 
        400
      );
    }

    const limit = Math.min(Math.max(parseInt(limitParam || '100', 10) || 100, 1), 500);
    const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0);

    const searchTerm = `%${query.trim()}%`;

    // Search in dogs table.
    // We prefer to search across dog_name and (if present) legacy text kennel columns.
    // Some deployments do not have those legacy columns, so we gracefully fall back to dog_name only.
    let data: any[] | null = null;
    let count: number | null = null;

    const trySearch = async (orFilter: string) => {
      return await supabase
        .from('dogs')
        .select(
          `
            *,
            primary_kennel:primary_kennel_id(id, name),
            secondary_kennel:secondary_kennel_id(id, name)
          `,
          { count: 'exact' }
        )
        .or(orFilter)
        .order('dog_name')
        .range(offset, offset + limit - 1);
    };

    // Attempt: dog name + legacy kennel text columns (if they exist).
    let result = await trySearch(
      `dog_name.ilike.${searchTerm},primary_kennel.ilike.${searchTerm},secondary_kennel.ilike.${searchTerm}`
    );

    // Fallback: dog name only (for schemas without legacy kennel columns).
    if (result.error) {
      const msg = result.error.message || '';
      if (msg.includes('column') && (msg.includes('primary_kennel') || msg.includes('secondary_kennel'))) {
        result = await trySearch(`dog_name.ilike.${searchTerm}`);
      }
    }

    if (result.error) throw result.error;
    data = result.data;
    count = result.count ?? 0;

    // Return with no-cache headers
    return NextResponse.json(
      {
        success: true,
        data: {
          items: data || [],
          total: count ?? 0,
          limit,
          offset,
        },
      },
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