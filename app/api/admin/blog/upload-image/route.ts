import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { isAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== BLOG IMAGE UPLOAD API CALLED ===');
    
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.log('❌ Admin access denied');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Admin access granted');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF files are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const fileName = `blog-${timestamp}-${randomString}.${fileExtension}`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'images', 'blog');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.log('Directory already exists or created');
    }

    // Save file
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Return the public URL
    const imageUrl = `/images/blog/${fileName}`;
    
    console.log('✅ Image uploaded successfully:', imageUrl);
    
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      fileName 
    }, { status: 200 });

  } catch (error) {
    console.error('💥 Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
