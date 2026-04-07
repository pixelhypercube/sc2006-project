import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';
import { z } from 'zod';

// GET - Fetch pending caregiver applications
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = (payload as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Fetch all pending caregiver applications (verified = false)
    const pendingApplications = await prisma.caregiverProfile.findMany({
      where: { verified: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        biography: true,
        dailyRate: true,
        location: true,
        experienceYears: true,
        petPreferences: true,
        availabilityStartDate: true,
        availabilityEndDate: true,
        verificationDoc: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            avatar: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    // Format response
    const formattedApplications = pendingApplications.map((app) => ({
      id: app.id,
      name: app.name,
      email: app.user.email,
      biography: app.biography,
      dailyRate: app.dailyRate,
      location: app.location,
      experienceYears: app.experienceYears,
      petPreferences: app.petPreferences,
      availabilityStartDate: app.availabilityStartDate,
      availabilityEndDate: app.availabilityEndDate,
      verificationDocs: app.verificationDoc ? app.verificationDoc.split(', ') : [],
      avatar: app.user.avatar,
      phone: app.user.phone,
      latitude: app.user.latitude,
      longitude: app.user.longitude,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    return NextResponse.json({ applications: formattedApplications });
  } catch (error) {
    console.error('Fetch pending applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending applications' },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject a caregiver application
const applicationActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  caregiverId: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = (payload as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const adminId = userId;

    const body = await request.json();
    const validated = applicationActionSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Get caregiver profile
      const caregiverProfile = await tx.caregiverProfile.findUnique({
        where: { id: validated.caregiverId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!caregiverProfile) {
        throw new Error('Caregiver not found');
      }

      if (validated.action === 'approve') {
        // Update caregiver profile to verified
        await tx.caregiverProfile.update({
          where: { id: validated.caregiverId },
          data: { verified: true },
        });

        // Update user verified status
        await tx.user.update({
          where: { id: validated.caregiverId },
          data: { verified: true },
        });

        // Create verification record
        await tx.verificationRecord.create({
          data: {
            caregiverId: validated.caregiverId,
            adminId: adminId,
            action: 'APPROVED',
            reason: validated.reason || null,
            notes: validated.notes || null,
          },
        });

        // Create notification for caregiver
        await tx.notification.create({
          data: {
            userId: validated.caregiverId,
            type: 'NEW_MESSAGE',
            title: 'Application Approved',
            message: 'Congratulations! Your caregiver application has been approved. You can now accept bookings.',
            data: {
              status: 'APPROVED',
            },
          },
        });

        return { success: true, message: 'Caregiver application approved' };
      } else if (validated.action === 'reject') {
        // Create verification record (before deleting)
        await tx.verificationRecord.create({
          data: {
            caregiverId: validated.caregiverId,
            adminId: adminId,
            action: 'REJECTED',
            reason: validated.reason || null,
            notes: validated.notes || null,
          },
        });

        // Delete caregiver profile
        await tx.caregiverProfile.delete({
          where: { id: validated.caregiverId },
        });

        // Create notification for caregiver
        await tx.notification.create({
          data: {
            userId: validated.caregiverId,
            type: 'NEW_MESSAGE',
            title: 'Application Rejected',
            message: 'Your caregiver application has been rejected. You can submit a new application after 30 days.',
            data: {
              status: 'REJECTED',
            },
          },
        });

        return { success: true, message: 'Caregiver application rejected' };
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Application action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process application' },
      { status: 500 }
    );
  }
}
