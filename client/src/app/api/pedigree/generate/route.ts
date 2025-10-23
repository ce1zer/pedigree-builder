import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
);

// Constants
const DEFAULT_MAX_GENERATIONS = 5;

// Helper function to create error response
const createErrorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ success: false, error: message }, { status });
};

// Helper function to create success response
const createSuccessResponse = (data: any) => {
  return NextResponse.json({ success: true, data });
};

// Interface for pedigree tree node
interface PedigreeNode {
  id: string;
  dog_name: string;
  primary_kennel: string;
  secondary_kennel?: string;
  gender: string;
  image_url?: string;
  generation: number;
  father: PedigreeNode | null;
  mother: PedigreeNode | null;
}

/**
 * Recursively build pedigree tree by fetching parent information
 */
const buildPedigreeTree = async (
  dogId: string, 
  generation: number = 0, 
  maxGenerations: number = DEFAULT_MAX_GENERATIONS
): Promise<PedigreeNode | null> => {
  // Stop recursion if we've reached the maximum generation depth
  if (generation >= maxGenerations) return null;
  
  // Fetch dog with parent information
  const { data: dog, error: dogError } = await supabase
    .from('dogs')
    .select(`
      *,
      father:father_id(id, dog_name, primary_kennel, secondary_kennel, gender, image_url),
      mother:mother_id(id, dog_name, primary_kennel, secondary_kennel, gender, image_url)
    `)
    .eq('id', dogId)
    .single();
  
  if (dogError || !dog) return null;
  
  // Create pedigree node
  const tree: PedigreeNode = {
    id: dog.id,
    dog_name: dog.dog_name,
    primary_kennel: dog.primary_kennel,
    secondary_kennel: dog.secondary_kennel,
    gender: dog.gender,
    image_url: dog.image_url,
    generation,
    father: null,
    mother: null
  };
  
  // Recursively build parent trees
  if (dog.father_id) {
    tree.father = await buildPedigreeTree(dog.father_id, generation + 1, maxGenerations);
  }
  if (dog.mother_id) {
    tree.mother = await buildPedigreeTree(dog.mother_id, generation + 1, maxGenerations);
  }
  
  return tree;
};

/**
 * POST /api/pedigree/generate - Generate a pedigree tree for a specific dog
 * Body: { rootDogId: string, maxGenerations?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { rootDogId, maxGenerations = DEFAULT_MAX_GENERATIONS } = await request.json();
    
    // Validate required parameters
    if (!rootDogId) {
      return createErrorResponse('Root dog ID is required', 400);
    }
    
    // Generate pedigree tree
    const pedigreeTree = await buildPedigreeTree(rootDogId, 0, maxGenerations);
    
    if (!pedigreeTree) {
      return createErrorResponse('Dog not found', 404);
    }
    
    return createSuccessResponse(pedigreeTree);
  } catch (error: any) {
    return createErrorResponse(error.message);
  }
}