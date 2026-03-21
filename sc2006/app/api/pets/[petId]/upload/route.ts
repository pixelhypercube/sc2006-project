// app/api/pets/[petId]/upload/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';

interface Params {
  params: {
    petId: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { petId } = params;

    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if pet exists and belongs to user
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        ownerId: payload.userId,
      }
    });

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found' },
        { status: 404 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const extension = file.type.split('/')[1];
    const filename = `pet-${petId}-${uuidv4()}.${extension}`;
    
    // Define upload path
    const uploadDir = path.join(process.cwd(), 'public/uploads/pets');
    const filePath = path.join(uploadDir, filename);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Save file
    await writeFile(filePath, buffer);

    // Public URL
    const photoUrl = `/uploads/pets/${filename}`;

    // Update pet with photo URL
    await prisma.pet.update({
      where: { id: petId },
      data: { photo: photoUrl },
    });

    return NextResponse.json({ 
      success: true,
      photoUrl 
    });

  } catch (error) {
    console.error('Pet photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}