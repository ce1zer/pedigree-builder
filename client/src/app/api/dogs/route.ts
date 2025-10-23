import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
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
  const { data: existingDog } = await supabase
    .from('dogs')
    .select('id')
    .eq('dog_name', dogName.trim())
    .single();
  
  return !!existingDog;
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
    const formData = await request.formData();
    const dogData = JSON.parse(formData.get('dogData') as string);
    const photo = formData.get('photo') as File;
    
    // Validate required fields
    const nameError = validateDogName(dogData.dog_name);
    if (nameError) return createErrorResponse(nameError, 400);
    
    const kennelError = validateKennel(dogData.primary_kennel);
    if (kennelError) return createErrorResponse(kennelError, 400);
    
    const genderError = validateGender(dogData.gender);
    if (genderError) return createErrorResponse(genderError, 400);
    
    // Check for duplicate names
    const isDuplicate = await checkDuplicateName(dogData.dog_name);
    if (isDuplicate) {
      return createErrorResponse('A dog with this name already exists', 400);
    }
    
    // Handle photo upload if provided
    let imageUrl = null;
    if (photo && photo.size > 0) {
      imageUrl = await uploadPhoto(photo);
    }
    
    // Create new dog record
    const { data, error } = await supabase
      .from('dogs')
      .insert([{
        dog_name: dogData.dog_name.trim(),
        primary_kennel: dogData.primary_kennel.trim(),
        secondary_kennel: dogData.secondary_kennel?.trim() || null,
        gender: dogData.gender,
        father_id: dogData.father_id || null,
        mother_id: dogData.mother_id || null,
        image_url: imageUrl
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return createSuccessResponse(data);
  } catch (error: any) {
    return createErrorResponse(error.message);
  }
}