// pages/api/upload-cv.ts
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { supabase } from '@/lib/supabaseClient';

// Harus ada untuk formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== API Upload CV (Pages Router) ===');

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    console.log('Parsing form data...');

    // Parse form data dengan formidable
    const form = new formidable.IncomingForm({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    // Parse dengan Promise
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      }
    );

    console.log('Form parsed:', {
      fields: Object.keys(fields),
      files: Object.keys(files)
    });

    // Get file and user_id
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const userId = Array.isArray(fields.user_id) ? fields.user_id[0] : fields.user_id;

    console.log('File info:', {
      hasFile: !!file,
      fileName: file?.originalFilename,
      fileSize: file?.size,
      userId
    });

    // Validations
    if (!file) {
      console.error('No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!userId) {
      console.error('No user_id provided');
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (file.mimetype !== 'application/pdf') {
      console.error('Invalid file type:', file.mimetype);
      return res.status(400).json({ 
        error: 'Only PDF files are allowed',
        receivedType: file.mimetype
      });
    }

    // Generate file name
    const timestamp = Date.now();
    const originalName = file.originalFilename || 'document.pdf';
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${userId}/${timestamp}_${safeName}`;

    console.log('Uploading file:', fileName);

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      
      // Check if bucket exists
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
        return res.status(500).json({
          error: 'Storage bucket not found',
          details: 'Please create bucket named "cvs" in Supabase Storage'
        });
      }
      
      return res.status(500).json({
        error: 'Failed to upload to storage',
        details: uploadError.message
      });
    }

    console.log('Storage upload successful');

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('cvs')
      .getPublicUrl(fileName);

    console.log('Public URL:', urlData.publicUrl);

    // 3. Save to database
    let dbData = null;
    try {
      // Try with 'user_cvs' table (sesuai dengan kode yang berhasil)
      const { data, error: dbError } = await supabase
        .from('user_cvs')
        .upsert({
          user_id: userId,
          file_name: originalName,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.mimetype,
          storage_path: fileName,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) {
        console.warn('Database error (trying cvs table):', dbError);
        
        // Try with 'cvs' table instead
        const { data: altData, error: altError } = await supabase
          .from('cvs')
          .upsert({
            user_id: userId,
            file_name: originalName,
            file_url: urlData.publicUrl,
            file_size: file.size,
            file_type: file.mimetype,
            storage_path: fileName,
          })
          .select()
          .single();

        if (altError) {
          console.warn('Both database tables failed:', altError);
          // Continue without database
        } else {
          dbData = altData;
          console.log('Saved to cvs table');
        }
      } else {
        dbData = data;
        console.log('Saved to user_cvs table');
      }
    } catch (dbException: any) {
      console.warn('Database exception:', dbException);
      // Continue with storage-only
    }

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
      console.log('Temp file cleaned');
    } catch (cleanupError) {
      console.warn('Failed to clean temp file:', cleanupError);
    }

    // 4. Return success response
    const responseData = {
      success: true,
      message: 'File uploaded successfully',
      data: {
        ...(dbData || {}),
        publicUrl: urlData.publicUrl,
        storage_path: fileName,
        file_name: originalName,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        userId
      }
    };

    console.log('Returning success response');
    return res.status(201).json(responseData);

  } catch (error: any) {
    console.error('=== API ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
      timestamp: new Date().toISOString()
    });
  }
}