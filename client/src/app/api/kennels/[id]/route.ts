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
 * GET /api/kennels/[id] - Retrieve a specific kennel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: kennel, error } = await supabase
      .from('kennels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return createSuccessResponse(kennel);
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to fetch kennel');
  }
}

/**
 * PUT /api/kennels/[id] - Update a kennel
 * Body: { name: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return createErrorResponse('Server configuration error: Missing Supabase credentials', 500);
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return createErrorResponse('Kennel name must be at least 2 characters long', 400);
    }

    // Preserve original casing but use lowercase for uniqueness check
    const trimmedName = name.trim();
    const nameLower = trimmedName.toLowerCase();

    // Check if another kennel with the same name (case-insensitive) exists
    // Try using name_lower first, fall back to case-insensitive name check if column doesn't exist
    let existingKennel = null;
    
    try {
      const result = await supabase
        .from('kennels')
        .select('id, name, name_lower')
        .eq('name_lower', nameLower)
        .neq('id', id)
        .maybeSingle();
      
      if (result.error) {
        // If column doesn't exist (error code 42703), fall back to case-insensitive name check
        if (result.error.code === '42703' || result.error.message?.includes('name_lower')) {
          const fallbackResult = await supabase
            .from('kennels')
            .select('id, name')
            .ilike('name', trimmedName)
            .neq('id', id)
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
          .neq('id', id)
          .maybeSingle();
        
        if (!fallbackResult.error) {
          existingKennel = fallbackResult.data;
        }
      } else {
        throw error;
      }
    }

    // If another kennel with the same name exists, return error
    if (existingKennel) {
      return createErrorResponse('A kennel with this name already exists', 400);
    }

    // Update kennel - try with name_lower, fall back to just name if column doesn't exist
    let updateData: any = { name: trimmedName };
    try {
      // Check if name_lower column exists
      const testResult = await supabase
        .from('kennels')
        .select('name_lower')
        .limit(1);
      
      // If query succeeds, column exists
      if (!testResult.error) {
        updateData.name_lower = nameLower;
      }
    } catch (e) {
      // Column doesn't exist, just use name
    }

    const { data: updatedKennel, error: updateError } = await supabase
      .from('kennels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      // If it's a column error for name_lower, try updating just name
      if (updateError.code === '42703' || updateError.message?.includes('name_lower')) {
        const fallbackResult = await supabase
          .from('kennels')
          .update({ name: trimmedName })
          .eq('id', id)
          .select()
          .single();
        
        if (fallbackResult.error) {
          throw fallbackResult.error;
        }
        return createSuccessResponse(fallbackResult.data);
      }
      throw updateError;
    }

    return createSuccessResponse(updatedKennel);
  } catch (error: any) {
    console.error('PUT /api/kennels/[id] error:', error);
    return createErrorResponse(
      error.message || 'Failed to update kennel',
      500
    );
  }
}

/**
 * DELETE /api/kennels/[id] - Delete a kennel
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if kennel is used by any dogs
    const { data: dogsWithPrimary, error: primaryError } = await supabase
      .from('dogs')
      .select('id')
      .eq('primary_kennel_id', id)
      .limit(1);

    if (primaryError) throw primaryError;

    const { data: dogsWithSecondary, error: secondaryError } = await supabase
      .from('dogs')
      .select('id')
      .eq('secondary_kennel_id', id)
      .limit(1);

    if (secondaryError) throw secondaryError;

    if ((dogsWithPrimary && dogsWithPrimary.length > 0) || (dogsWithSecondary && dogsWithSecondary.length > 0)) {
      return createErrorResponse(
        'Cannot delete kennel: It is currently assigned to one or more dogs',
        400
      );
    }

    // Delete kennel
    const { error: deleteError } = await supabase
      .from('kennels')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return createSuccessResponse({ message: 'Kennel deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/kennels/[id] error:', error);
    return createErrorResponse(
      error.message || 'Failed to delete kennel',
      500
    );
  }
}

