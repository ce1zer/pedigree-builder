import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
);

// POST /api/pedigree/generate - Generate pedigree tree
export async function POST(request: NextRequest) {
  try {
    const { rootDogId, maxGenerations = 5 } = await request.json();
    
    if (!rootDogId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Root dog ID is required' 
      }, { status: 400 });
    }
    
    const buildPedigreeTree = async (dogId: string, generation = 0): Promise<any> => {
      if (generation >= maxGenerations) return null;
      
      // Get dog with parent information
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
      
      const tree = {
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
        tree.father = await buildPedigreeTree(dog.father_id, generation + 1);
      }
      if (dog.mother_id) {
        tree.mother = await buildPedigreeTree(dog.mother_id, generation + 1);
      }
      
      return tree;
    };
    
    const pedigreeTree = await buildPedigreeTree(rootDogId);
    
    if (!pedigreeTree) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dog not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: pedigreeTree });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
