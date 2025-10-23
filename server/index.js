import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import puppeteer from 'puppeteer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'your-supabase-url',
  process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key'
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Multer configuratie voor foto uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Alleen afbeeldingen zijn toegestaan'), false);
    }
  }
});

// Utility functies
const validateDogData = (dogData) => {
  const errors = [];
  
  if (!dogData.name || dogData.name.trim().length < 2) {
    errors.push('Naam moet minimaal 2 karakters bevatten');
  }
  
  if (!dogData.gender || !['male', 'female'].includes(dogData.gender)) {
    errors.push('Geslacht moet "male" of "female" zijn');
  }
  
  if (!dogData.birth_date) {
    errors.push('Geboortedatum is verplicht');
  }
  
  if (!dogData.breed || dogData.breed.trim().length < 2) {
    errors.push('Ras moet minimaal 2 karakters bevatten');
  }
  
  return errors;
};

const checkCircularReference = async (dogId, parentId) => {
  if (dogId === parentId) return true;
  
  // Check if parent is already a descendant of the dog
  const { data: relations } = await supabase
    .from('dog_relations')
    .select('father_id, mother_id')
    .eq('dog_id', parentId);
  
  if (relations && relations.length > 0) {
    const relation = relations[0];
    if (relation.father_id === dogId || relation.mother_id === dogId) {
      return true;
    }
    
    // Recursively check further up the tree
    if (relation.father_id) {
      const fatherCircular = await checkCircularReference(dogId, relation.father_id);
      if (fatherCircular) return true;
    }
    
    if (relation.mother_id) {
      const motherCircular = await checkCircularReference(dogId, relation.mother_id);
      if (motherCircular) return true;
    }
  }
  
  return false;
};

// API Routes

// Alle honden ophalen
app.get('/api/dogs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Specifieke hond ophalen
app.get('/api/dogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (dogError) throw dogError;
    
    // Haal ook ouders op
    const { data: relations, error: relationsError } = await supabase
      .from('dog_relations')
      .select(`
        father_id,
        mother_id,
        father:father_id(id, name, gender, breed, photo_url),
        mother:mother_id(id, name, gender, breed, photo_url)
      `)
      .eq('dog_id', id)
      .single();
    
    if (relationsError && relationsError.code !== 'PGRST116') {
      throw relationsError;
    }
    
    res.json({ 
      success: true, 
      data: { 
        ...dog, 
        father: relations?.father || null,
        mother: relations?.mother || null
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Nieuwe hond aanmaken
app.post('/api/dogs', upload.single('photo'), async (req, res) => {
  try {
    const dogData = JSON.parse(req.body.dogData);
    const errors = validateDogData(dogData);
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    
    // Check voor duplicaten
    const { data: existingDog } = await supabase
      .from('dogs')
      .select('id')
      .eq('name', dogData.name.trim())
      .single();
    
    if (existingDog) {
      return res.status(400).json({ 
        success: false, 
        error: 'Een hond met deze naam bestaat al' 
      });
    }
    
    let photoUrl = null;
    
    // Verwerk foto upload
    if (req.file) {
      const filename = `${uuidv4()}.jpg`;
      const processedImage = await sharp(req.file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(filename, processedImage, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(filename);
      
      photoUrl = publicUrl;
    }
    
    // Maak hond aan
    const { data, error } = await supabase
      .from('dogs')
      .insert([{
        name: dogData.name.trim(),
        gender: dogData.gender,
        birth_date: dogData.birth_date,
        breed: dogData.breed.trim(),
        photo_url: photoUrl
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Hondenprofiel bijwerken
app.put('/api/dogs/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const dogData = JSON.parse(req.body.dogData);
    const errors = validateDogData(dogData);
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    
    // Check voor duplicaten (exclusief huidige hond)
    const { data: existingDog } = await supabase
      .from('dogs')
      .select('id')
      .eq('name', dogData.name.trim())
      .neq('id', id)
      .single();
    
    if (existingDog) {
      return res.status(400).json({ 
        success: false, 
        error: 'Een hond met deze naam bestaat al' 
      });
    }
    
    let updateData = {
      name: dogData.name.trim(),
      gender: dogData.gender,
      birth_date: dogData.birth_date,
      breed: dogData.breed.trim(),
      updated_at: new Date().toISOString()
    };
    
    // Verwerk nieuwe foto upload
    if (req.file) {
      const filename = `${uuidv4()}.jpg`;
      const processedImage = await sharp(req.file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(filename, processedImage, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(filename);
      
      updateData.photo_url = publicUrl;
    }
    
    const { data, error } = await supabase
      .from('dogs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ouders koppelen
app.post('/api/dogs/:id/parents', async (req, res) => {
  try {
    const { id } = req.params;
    const { father_id, mother_id } = req.body;
    
    // Validatie
    if (!father_id && !mother_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Minimaal één ouder moet worden opgegeven' 
      });
    }
    
    // Check cirkelverwijzingen
    if (father_id) {
      const fatherCircular = await checkCircularReference(id, father_id);
      if (fatherCircular) {
        return res.status(400).json({ 
          success: false, 
          error: 'Vader kan niet een nakomeling zijn van deze hond' 
        });
      }
    }
    
    if (mother_id) {
      const motherCircular = await checkCircularReference(id, mother_id);
      if (motherCircular) {
        return res.status(400).json({ 
          success: false, 
          error: 'Moeder kan niet een nakomeling zijn van deze hond' 
        });
      }
    }
    
    // Check of ouders bestaan
    if (father_id) {
      const { data: father } = await supabase
        .from('dogs')
        .select('id, gender')
        .eq('id', father_id)
        .single();
      
      if (!father) {
        return res.status(400).json({ 
          success: false, 
          error: 'Vader niet gevonden' 
        });
      }
      
      if (father.gender !== 'male') {
        return res.status(400).json({ 
          success: false, 
          error: 'Vader moet een mannelijke hond zijn' 
        });
      }
    }
    
    if (mother_id) {
      const { data: mother } = await supabase
        .from('dogs')
        .select('id, gender')
        .eq('id', mother_id)
        .single();
      
      if (!mother) {
        return res.status(400).json({ 
          success: false, 
          error: 'Moeder niet gevonden' 
        });
      }
      
      if (mother.gender !== 'female') {
        return res.status(400).json({ 
          success: false, 
          error: 'Moeder moet een vrouwelijke hond zijn' 
        });
      }
    }
    
    // Update of insert relatie
    const { data, error } = await supabase
      .from('dog_relations')
      .upsert([{
        dog_id: id,
        father_id: father_id || null,
        mother_id: mother_id || null
      }], {
        onConflict: 'dog_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Zoeken op naam
app.get('/api/dogs/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Zoekterm moet minimaal 2 karakters bevatten' 
      });
    }
    
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .ilike('name', `%${q.trim()}%`)
      .order('name')
      .limit(20);
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stamboom genereren
app.post('/api/pedigree/generate', async (req, res) => {
  try {
    const { rootDogId, maxGenerations = 5 } = req.body;
    
    if (!rootDogId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Root dog ID is verplicht' 
      });
    }
    
    const buildPedigreeTree = async (dogId, generation = 0) => {
      if (generation >= maxGenerations) return null;
      
      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', dogId)
        .single();
      
      if (dogError || !dog) return null;
      
      const { data: relations } = await supabase
        .from('dog_relations')
        .select('father_id, mother_id')
        .eq('dog_id', dogId)
        .single();
      
      const tree = {
        id: dog.id,
        name: dog.name,
        gender: dog.gender,
        breed: dog.breed,
        birth_date: dog.birth_date,
        photo_url: dog.photo_url,
        generation,
        father: null,
        mother: null
      };
      
      if (relations) {
        if (relations.father_id) {
          tree.father = await buildPedigreeTree(relations.father_id, generation + 1);
        }
        if (relations.mother_id) {
          tree.mother = await buildPedigreeTree(relations.mother_id, generation + 1);
        }
      }
      
      return tree;
    };
    
    const pedigreeTree = await buildPedigreeTree(rootDogId);
    
    if (!pedigreeTree) {
      return res.status(404).json({ 
        success: false, 
        error: 'Hond niet gevonden' 
      });
    }
    
    res.json({ success: true, data: pedigreeTree });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stamboom exporteren als PNG
app.post('/api/pedigree/export', async (req, res) => {
  try {
    const { pedigreeData, format = 'png' } = req.body;
    
    if (!pedigreeData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pedigree data is verplicht' 
      });
    }
    
    // Generate HTML for pedigree tree
    const generatePedigreeHTML = (node, level = 0) => {
      if (!node) return '';
      
      const genderColor = node.gender === 'male' ? '#dbeafe' : '#fce4ec';
      const borderColor = node.gender === 'male' ? '#3b82f6' : '#ec4899';
      
      let html = `
        <div class="pedigree-node" style="
          background-color: ${genderColor};
          border: 2px solid ${borderColor};
          border-radius: 8px;
          padding: 10px;
          margin: 5px;
          text-align: center;
          min-width: 120px;
          position: relative;
        ">
          <div style="font-weight: bold; font-size: 14px;">${node.name}</div>
          <div style="font-size: 12px; color: #666;">${node.breed}</div>
          <div style="font-size: 11px; color: #888;">${new Date(node.birth_date).getFullYear()}</div>
        </div>
      `;
      
      if (node.father || node.mother) {
        html += '<div style="display: flex; justify-content: space-around; margin-top: 20px;">';
        if (node.father) {
          html += `<div>${generatePedigreeHTML(node.father, level + 1)}</div>`;
        }
        if (node.mother) {
          html += `<div>${generatePedigreeHTML(node.mother, level + 1)}</div>`;
        }
        html += '</div>';
      }
      
      return html;
    };
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Stamboom van ${pedigreeData.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: white;
          }
          .pedigree-container {
            text-align: center;
            padding: 20px;
          }
          .pedigree-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            color: #333;
          }
          .pedigree-tree {
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="pedigree-container">
          <div class="pedigree-title">Stamboom van ${pedigreeData.name}</div>
          <div class="pedigree-tree">
            ${generatePedigreeHTML(pedigreeData)}
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
      quality: 90
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="stamboom-${pedigreeData.name}.png"`);
    res.send(screenshot);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Interne server fout' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint niet gevonden' 
  });
});

// Export voor Vercel
export default app;

// Start server alleen in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  });
}
