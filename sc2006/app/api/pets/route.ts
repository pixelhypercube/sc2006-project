// app/api/pets/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';
import { petSchema } from '@/app/lib/validation';
import { z } from 'zod';

// GET - List all pets for the authenticated user
export async function GET() {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch all pets for this user
    const pets = await prisma.pet.findMany({
      where: { ownerId: payload.userId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ pets });

  } catch (error) {
    console.error('Fetch pets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
      { status: 500 }
    );
  }
}

// POST - Create a new pet
export async function POST(request: Request) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check content type
    const contentType = request.headers.get('content-type') || '';
    
    let petData: any;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await request.formData();
      petData = {
        name: formData.get('name'),
        type: formData.get('type'),
        breed: formData.get('breed') || null,
        age: formData.get('age') ? parseInt(formData.get('age') as string) : null,
        weight: formData.get('weight') ? parseFloat(formData.get('weight') as string) : null,
        specialNeeds: formData.get('specialNeeds') || null,
        photo: formData.get('photo') || null,
      };
    } else {
      // Handle JSON
      petData = await request.json();
    }
    console.log('Pet Data:', petData);
    // Validate input
    const validatedData = petSchema.parse(petData);
    // Check if user exists and is a pet owner (optional)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create pet in database
    const pet = await prisma.pet.create({
      data: {
        ownerId: payload.userId,
        name: validatedData.name,
        type: validatedData.type,
        breed: validatedData.breed,
        age: validatedData.age,
        weight: validatedData.weight,
        specialNeeds: validatedData.specialNeeds,
        photo: validatedData.photo,
      },
    });

    // Create notification
    // await prisma.notification.create({
    //   data: {
    //     userId: payload.userId,
    //     type: 'PET_ADDED',
    //     title: 'New Pet Added',
    //     message: `${pet.name} has been added to your profile.`,
    //     data: { petId: pet.id },
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Pet added successfully',
      pet
    }, { status: 201 });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return NextResponse.json(
        { 
          error: 'Validation failed',
          field: firstError.path[0],
          message: firstError.message
        },
        { status: 400 }
      );
    }

    console.error('Create pet error:', error);
    return NextResponse.json(
      { error: 'Failed to create pet' },
      { status: 500 }
    );
  }
}