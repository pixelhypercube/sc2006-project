import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';
import { PetType } from '@/app/generated/prisma/client';

const caregiverApplicationSchema = z.object({
  dailyRate: z.number().positive('Daily rate must be greater than 0'),
  biography: z.string().optional(),
  location: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
  petPreferences: z.array(z.nativeEnum(PetType)).optional(),
  verificationDocs: z.array(z.object({ name: z.string(), content: z.string() })).optional(),
  availability: z
    .array(
      z.object({
        startDate: z.union([z.string(), z.date()]),
        endDate: z.union([z.string(), z.date()]).nullable(),
      })
    )
    .optional(),
});

export async function POST(request: Request) {
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

    const userId = (payload as { userId: string }).userId;
    const body = await request.json();
    const validated = caregiverApplicationSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const availabilityWindow = validated.availability?.[0];
    const availabilityStartDate = availabilityWindow?.startDate
      ? new Date(availabilityWindow.startDate)
      : null;
    const availabilityEndDate = availabilityWindow?.endDate
      ? new Date(availabilityWindow.endDate)
      : null;

    const verificationDocNames = (validated.verificationDocs ?? []).map((doc) => doc.name);

    const caregiverProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.caregiverProfile.upsert({
        where: { id: userId },
        create: {
          id: userId,
          name: user.name,
          biography: validated.biography ?? null,
          location: validated.location ?? null,
          dailyRate: validated.dailyRate,
          experienceYears: validated.experienceYears ?? null,
          petPreferences: validated.petPreferences ?? [],
          dogSizes: [],
          services: [],
          availabilityStartDate,
          availabilityEndDate,
          verificationDoc: verificationDocNames.length > 0 ? verificationDocNames.join(', ') : null,
          verified: false,
        },
        update: {
          name: user.name,
          biography: validated.biography ?? null,
          location: validated.location ?? null,
          dailyRate: validated.dailyRate,
          experienceYears: validated.experienceYears ?? null,
          petPreferences: validated.petPreferences ?? [],
          availabilityStartDate,
          availabilityEndDate,
          verificationDoc: verificationDocNames.length > 0 ? verificationDocNames.join(', ') : null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          ...(validated.location !== undefined && { location: validated.location || null }),
          ...(validated.biography !== undefined && { biography: validated.biography || null }),
          ...(user.role === 'OWNER' && { secondaryRole: 'CAREGIVER' }),
        },
      });

      const admins = await tx.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'NEW_MESSAGE',
            title: 'New Caregiver Application',
            message: `${user.name} submitted a caregiver application for verification.`,
            data: {
              applicantId: userId,
              applicantName: user.name,
              dailyRate: validated.dailyRate,
              documentCount: verificationDocNames.length,
              requestedAt: new Date().toISOString(),
            },
          })),
        });
      }

      await tx.notification.create({
        data: {
          userId,
          type: 'NEW_MESSAGE',
          title: 'Application Submitted',
          message: 'Your caregiver application has been sent to admin for verification.',
          data: {
            status: 'PENDING',
          },
        },
      });

      return profile;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted for admin verification.',
        caregiver: caregiverProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return NextResponse.json(
        {
          error: 'Validation failed',
          field: firstError.path[0],
          message: firstError.message,
        },
        { status: 400 }
      );
    }

    console.error('Caregiver apply error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
