import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// Constants for validation
const MIN_NAME_LENGTH = 2;
const VALID_GENDERS = ['male', 'female'] as const;
const STORAGE_BUCKET = 'dog-photos';

// Helper function to create error response
const createErrorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ success: false, error: message }, { status });
};

// Helper function to create success response
const createSuccessResponse = (data: any) => {
  return NextResponse.json({ success: true, data });
};

// Validation helper functions
const validateDogName = (name: string): string | null => {
  if (!name || name.trim().length < MIN_NAME_LENGTH) {
    return 'Dog name must be at least 2 characters long';
  }
  return null;
};

// Kennel validation is now optional since it's handled by the CreatableSelect component

const validateGender = (gender: string): string | null => {
  if (!gender || !VALID_GENDERS.includes(gender as any)) {
    return 'Gender must be "male" or "female"';
  }
  return null;
};

// Photo upload helper function
const uploadPhoto = async (photo: File): Promise<string | null> => {
  try {
    const fileExt = photo.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, photo, {
        contentType: photo.type,
        upsert: false
      });
    
    if (uploadError) {
      throw new Error('Failed to upload photo');
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    throw new Error('Failed to upload photo');
  }
};

// Check for duplicate dog based on champion + primary_kennel_id + dog_name combination
const checkDuplicateDog = async (
  dogName: string, 
  champion: string = 'none',
  primaryKennelId: string | null = null,
  excludeId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('dogs')
      .select('id')
      .eq('dog_name', dogName.trim())
      .eq('champion', champion || 'none');
    
    // Check primary kennel match
    if (primaryKennelId) {
      query = query.eq('primary_kennel_id', primaryKennelId);
    } else {
      // If no primary kennel, check for dogs with no primary kennel
      query = query.is('primary_kennel_id', null);
    }
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data: existingDog, error } = await query.maybeSingle();
    
    // If error and it's not "no rows found", return false (no duplicate)
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking duplicate dog:', error);
      return false; // Don't block on error
    }
    
    // Return true if a duplicate exists
    return !!existingDog;
  } catch (error) {
    console.error('Exception checking duplicate dog:', error);
    return false; // Don't block on error
  }
};

/**
 * GET /api/dogs - Retrieve all dogs with their parent information
 */
export async function GET() {
  try {
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select(`
        *,
        primary_kennel:primary_kennel_id(id, name),
        secondary_kennel:secondary_kennel_id(id, name),
        father:father_id(id, dog_name, primary_kennel_id, secondary_kennel_id, gender, image_url),
        mother:mother_id(id, dog_name, primary_kennel_id, secondary_kennel_id, gender, image_url)
      `)
      .order('dog_name');
    
    if (dogsError) throw dogsError;
    
    // No caching - always return fresh data
    return NextResponse.json(
      { success: true, data: dogs },
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

/**
 * POST /api/dogs - Create a new dog profile
 */
export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase credentials');
      return createErrorResponse('Server configuration error: Missing Supabase credentials', 500);
    }
    
    const formData = await request.formData();
    
    // Get and parse dogData
    const dogDataString = formData.get('dogData') as string | null;
    if (!dogDataString) {
      return createErrorResponse('Missing dog data', 400);
    }
    
    let dogData;
    try {
      dogData = JSON.parse(dogDataString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return createErrorResponse('Invalid dog data format', 400);
    }
    
    const photo = formData.get('photo') as File | null;
    
    // Validate required fields
    const nameError = validateDogName(dogData.dog_name);
    if (nameError) return createErrorResponse(nameError, 400);
    
    const genderError = validateGender(dogData.gender);
    if (genderError) return createErrorResponse(genderError, 400);
    
    // Check for duplicate based on champion + primary_kennel_id + dog_name combination
    const isDuplicate = await checkDuplicateDog(
      dogData.dog_name,
      dogData.champion || 'none',
      dogData.primary_kennel_id || null
    );
    
    if (isDuplicate) {
      return createErrorResponse(
        'A dog with this name, champion status, and primary kennel combination already exists',
        400
      );
    }
    
    // Handle photo upload if provided
    let imageUrl = null;
    if (photo && photo.size > 0) {
      try {
        imageUrl = await uploadPhoto(photo);
      } catch (uploadError: any) {
        // Log upload error but don't fail the entire request
        console.error('Photo upload failed:', uploadError);
        // Continue without image
      }
    }
    
    // Prepare insert data
    const insertData: any = {
      dog_name: dogData.dog_name.trim(),
      gender: dogData.gender,
      father_id: (dogData.father_id && dogData.father_id.trim() !== '') ? dogData.father_id : null,
      mother_id: (dogData.mother_id && dogData.mother_id.trim() !== '') ? dogData.mother_id : null,
      image_url: imageUrl
    };
    
    // Add champion if provided (only if column exists)
    if (dogData.champion !== undefined) {
      insertData.champion = dogData.champion || 'none';
    }
    
    // Add kennel IDs if provided
    if (dogData.primary_kennel_id) {
      insertData.primary_kennel_id = dogData.primary_kennel_id;
    }
    if (dogData.secondary_kennel_id) {
      insertData.secondary_kennel_id = dogData.secondary_kennel_id;
    }
    
    // Create new dog record and return full data with relations
    let data, error;
    
    try {
      const result = await supabase
        .from('dogs')
        .insert([insertData])
        .select(`
          *,
          primary_kennel:primary_kennel_id(id, name),
          secondary_kennel:secondary_kennel_id(id, name),
          father:father_id(id, dog_name, primary_kennel_id, secondary_kennel_id, gender, image_url),
          mother:mother_id(id, dog_name, primary_kennel_id, secondary_kennel_id, gender, image_url)
        `)
        .single();
      
      data = result.data;
      error = result.error;
      
      // If error is about missing champion column, retry without it
      if (error && (error.message?.includes("champion") || error.code === '42703' || error.message?.includes("schema cache"))) {
        const insertDataWithoutChampion = { ...insertData };
        delete insertDataWithoutChampion.champion;
        
        const retryResult = await supabase
          .from('dogs')
          .insert([insertDataWithoutChampion])
          .select(`
            *,
            primary_kennel:primary_kennel_id(id, name),
            secondary_kennel:secondary_kennel_id(id, name),
            father:father_id(id, dog_name, primary_kennel_id, secondary_kennel_id, gender, image_url),
            mother:mother_id(id, dog_name, primary_kennel_id, secondary_kennel_id, gender, image_url)
          `)
          .single();
        
        data = retryResult.data;
        error = retryResult.error;
      }
    } catch (err: any) {
      // If it's a column error, try without champion
      if (err.message?.includes("champion") || err.code === '42703' || err.message?.includes("schema cache")) {
        const insertDataWithoutChampion = { ...insertData };
        delete insertDataWithoutChampion.champion;
        
        const retryResult = await supabase
          .from('dogs')
          .insert([insertDataWithoutChampion])
          .select(`
            *,
            primary_kennel:primary_kennel_id(id, name),
            secondary_kennel:secondary_kennel_id(id, name),
            father:father_id(id, dog_name, primary_kennel_id, secondary_kennel_id, gender, image_url),
            mother:mother_id(id, dog_name, primary_kennel_id, secondary_kennel_id, gender, image_url)
          `)
          .single();
        
        data = retryResult.data;
        error = retryResult.error;
      } else {
        throw err;
      }
    }
    
    if (error) {
      console.error('Supabase insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return createErrorResponse(
        error.message || `Database error: ${error.code || 'Unknown error'}`,
        500
      );
    }
    
    if (!data) {
      console.error('No data returned from insert');
      return createErrorResponse('Failed to create dog: No data returned', 500);
    }
    
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
    console.error('POST /api/dogs error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return createErrorResponse(
      error.message || 'An unexpected error occurred',
      500
    );
  }
}