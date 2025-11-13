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

const validateKennel = (kennel: string): string | null => {
  if (!kennel || kennel.trim().length < MIN_NAME_LENGTH) {
    return 'Primary kennel must be at least 2 characters long';
  }
  return null;
};

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

// Check for duplicate dog name
const checkDuplicateName = async (dogName: string): Promise<boolean> => {
  try {
    const { data: existingDog, error } = await supabase
      .from('dogs')
      .select('id')
      .eq('dog_name', dogName.trim())
      .maybeSingle();
    
    // If there's an error (like table doesn't exist), log it but don't fail
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking duplicate name:', error);
    }
    
    return !!existingDog;
  } catch (error) {
    console.error('Exception checking duplicate name:', error);
    return false; // Don't block creation if check fails
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
        father:father_id(id, dog_name, primary_kennel, secondary_kennel, gender, image_url),
        mother:mother_id(id, dog_name, primary_kennel, secondary_kennel, gender, image_url)
      `)
      .order('dog_name');
    
    if (dogsError) throw dogsError;
    
    return createSuccessResponse(dogs);
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
    
    const kennelError = validateKennel(dogData.primary_kennel);
    if (kennelError) return createErrorResponse(kennelError, 400);
    
    const genderError = validateGender(dogData.gender);
    if (genderError) return createErrorResponse(genderError, 400);
    
    // Check for duplicate names
    try {
      const isDuplicate = await checkDuplicateName(dogData.dog_name);
      if (isDuplicate) {
        return createErrorResponse('A dog with this name already exists', 400);
      }
    } catch (duplicateCheckError) {
      console.error('Error checking duplicate:', duplicateCheckError);
      // Continue - don't block creation if duplicate check fails
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
    const insertData = {
      dog_name: dogData.dog_name.trim(),
      primary_kennel: dogData.primary_kennel.trim(),
      secondary_kennel: dogData.secondary_kennel?.trim() || null,
      gender: dogData.gender,
      father_id: (dogData.father_id && dogData.father_id.trim() !== '') ? dogData.father_id : null,
      mother_id: (dogData.mother_id && dogData.mother_id.trim() !== '') ? dogData.mother_id : null,
      image_url: imageUrl
    };
    
    console.log('Inserting dog data:', { ...insertData, image_url: imageUrl ? '[URL]' : null });
    
    // Create new dog record
    const { data, error } = await supabase
      .from('dogs')
      .insert([insertData])
      .select()
      .single();
    
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
    
    return createSuccessResponse(data);
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