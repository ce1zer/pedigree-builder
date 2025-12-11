import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY
  });
}

// Supabase client configuration
const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
);

// Helper function to create error response
const createErrorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ success: false, error: message }, { status });
};

// Helper function to create success response
const createSuccessResponse = (data: any) => {
  return NextResponse.json({ success: true, data });
};

/**
 * GET /api/kennels - Retrieve all kennels
 */
export async function GET() {
  try {
    const { data: kennels, error } = await supabase
      .from('kennels')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return createSuccessResponse(kennels || []);
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to fetch kennels');
  }
}

/**
 * POST /api/kennels - Create a new kennel
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return createErrorResponse('Server configuration error: Missing Supabase credentials', 500);
    }
    
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return createErrorResponse('Kennel name must be at least 2 characters long', 400);
    }
    
    // Preserve original casing but use lowercase for uniqueness check
    const trimmedName = name.trim();
    const nameLower = trimmedName.toLowerCase();
    
    // Check if kennel already exists (case-insensitive)
    // Try using name_lower first, fall back to case-insensitive name check if column doesn't exist
    let existingKennel = null;
    
    try {
      const result = await supabase
        .from('kennels')
        .select('id, name, name_lower')
        .eq('name_lower', nameLower)
        .maybeSingle();
      
      if (result.error) {
        // If column doesn't exist (error code 42703), fall back to case-insensitive name check
        if (result.error.code === '42703' || result.error.message?.includes('name_lower')) {
          const fallbackResult = await supabase
            .from('kennels')
            .select('id, name')
            .ilike('name', trimmedName)
            .maybeSingle();
          
          if (!fallbackResult.error) {
            existingKennel = fallbackResult.data;
          }
        } else if (result.error.code !== 'PGRST116') {
          throw result.error;
        }
      } else {
        existingKennel = result.data;
      }
    } catch (error: any) {
      // If it's a column error, try fallback
      if (error.code === '42703' || error.message?.includes('name_lower')) {
        const fallbackResult = await supabase
          .from('kennels')
          .select('id, name')
          .ilike('name', trimmedName)
          .maybeSingle();
        
        if (!fallbackResult.error) {
          existingKennel = fallbackResult.data;
        }
      } else {
        throw error;
      }
    }
    
    // If kennel exists, return it (preserving existing casing)
    if (existingKennel) {
      return createSuccessResponse(existingKennel);
    }
    
    // Create new kennel - try with name_lower, fall back to just name if column doesn't exist
    let insertData: any = { name: trimmedName };
    try {
      // Try to include name_lower
      const testResult = await supabase
        .from('kennels')
        .select('name_lower')
        .limit(1);
      
      // If query succeeds, column exists
      if (!testResult.error) {
        insertData.name_lower = nameLower;
      }
    } catch (e) {
      // Column doesn't exist, just use name
    }
    
    const { data: newKennel, error: insertError } = await supabase
      .from('kennels')
      .insert([insertData])
      .select()
      .single();
    
    if (insertError) {
      // If it's a unique constraint violation, try to fetch the existing one
      if (insertError.code === '23505') {
        // Try to find existing by case-insensitive name
        const result = await supabase
          .from('kennels')
          .select('*')
          .ilike('name', trimmedName)
          .single();
        
        if (result.data) {
          return createSuccessResponse(result.data);
        }
      }
      throw insertError;
    }
    
    return createSuccessResponse(newKennel);
  } catch (error: any) {
    console.error('POST /api/kennels error:', error);
    return createErrorResponse(
      error.message || 'Failed to create kennel',
      500
    );
  }
}

