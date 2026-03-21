// import { NextRequest, NextResponse } from 'next/server';
// import { verifyToken } from '@/app/lib/utils'; // your existing verify
// import { prisma } from '@/app/lib/prisma';       

// export async function PUT(request: NextRequest) {
//   try {
//     const accessToken = request.cookies.get('access_token')?.value;
//     console.log(accessToken)
//     if (!accessToken) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const payload = verifyToken(accessToken, process.env.JWT_SECRET!);
    
//     if (!payload || typeof payload === 'string') {
//       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//     }

//     const body = await request.json();
//     const { name, phone } = body;

//     // Basic validation
//     if (!name) {
//       return NextResponse.json({ error: 'Name is required' }, { status: 400 });
//     }

//     // Example using Prisma
//     const updatedUser = await prisma.user.update({
//       where: { id: payload.userId }, // or payload.userId
//       data: { name, phone },
//       select: { id: true, email: true, name: true, phone: true, role: true, avatar: true, verified: true },
//     });

//     return NextResponse.json({ user: updatedUser });
//   } catch (err) {
//     console.error('Profile update error:', err);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }

// app/api/profile/route.ts - UPDATES ANY USER FIELDS
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/utils';
import { prisma } from '@/app/lib/prisma';

type UpdateData = Partial<{
  name: string;
  phone: string;
  biography: string;
  petSpecies: string[];
  dogSizes: string[];
  hourlyRate: number;
  location: string;
  // Add more fields here as needed
}>;

const ALLOWED_FIELDS: (keyof UpdateData)[] = [
  'name', 'phone', 'biography', 'petSpecies', 
  'dogSizes', 'hourlyRate', 'location'
];

export async function PUT(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(accessToken, process.env.JWT_SECRET!);
    
    if (!payload || typeof payload === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    
    // Filter only allowed fields
    const updateData: UpdateData = {};
    for (const [key, value] of Object.entries(body) as [keyof UpdateData, any][]) {
      if (ALLOWED_FIELDS.includes(key)) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update User model
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true, email: true, name: true, phone: true, 
        role: true, avatar: true, verified: true
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Profile update error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Field value already taken' }, 
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' }, 
      { status: 500 }
    );
  }
}
