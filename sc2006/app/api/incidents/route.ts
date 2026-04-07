import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';
import { z } from 'zod';
import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const VALID_TYPES = ['SAFETY', 'UNRESPONSIVE', 'OTHER'] as const;
type IncidentType = typeof VALID_TYPES[number];

const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  SAFETY: 'Safety Concern',
  UNRESPONSIVE: 'Caretaker Unresponsive',
  OTHER: 'Other Issue',
};

const INCIDENT_PRIORITY_BY_TYPE: Record<IncidentType, 'LOW' | 'MEDIUM' | 'HIGH'> = {
  SAFETY: 'HIGH',
  UNRESPONSIVE: 'MEDIUM',
  OTHER: 'LOW',
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

function isAllowedAttachmentType(mimeType: string) {
  return mimeType.startsWith('image/') || mimeType.startsWith('video/');
}

function normalizeExtension(filename: string, mimeType: string) {
  const fromName = path.extname(filename).toLowerCase();
  if (/^\.[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  if (mimeType.startsWith('image/')) return '.jpg';
  if (mimeType.startsWith('video/')) return '.mp4';
  return '';
}

const resolveIncidentSchema = z.object({
  incidentId: z.string(),
  status: z.enum(['RESOLVED', 'DISMISSED']),
  resolutionNotes: z.string().optional(),
});

async function ensureAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const payload = verifyToken(token, process.env.JWT_SECRET!);
  if (!payload || typeof payload === 'string') {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }

  const userId = (payload as { userId?: string }).userId;
  if (!userId) {
    return { error: NextResponse.json({ error: 'Invalid token payload' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 }) };
  }

  return { userId };
}

// GET - Fetch incidents for admin review
export async function GET() {
  try {
    const adminCheck = await ensureAdmin();
    if ('error' in adminCheck) return adminCheck.error;

    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            pet: { select: { name: true } },
          },
        },
        reporter: { select: { id: true, name: true, email: true } },
        caregiver: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      incidents: incidents.map((incident) => ({
        id: incident.id,
        bookingId: incident.bookingId,
        reporterId: incident.reporterId,
        caregiverId: incident.caregiverId,
        type: incident.type,
        title: INCIDENT_TYPE_LABELS[incident.type as IncidentType],
        priority: INCIDENT_PRIORITY_BY_TYPE[incident.type as IncidentType],
        status: incident.status,
        description: incident.description,
        attachmentUrl: (incident as { attachmentUrl?: string | null }).attachmentUrl ?? null,
        attachmentType: (incident as { attachmentType?: string | null }).attachmentType ?? null,
        attachmentName: (incident as { attachmentName?: string | null }).attachmentName ?? null,
        filed: incident.createdAt,
        resolvedAt: incident.resolvedAt,
        resolutionNotes: incident.resolutionNotes,
        reporter: incident.reporter.name,
        caretaker: incident.caregiver.name,
        bookingPetName: incident.booking.pet.name,
        bookingStartDate: incident.booking.startDate,
        bookingEndDate: incident.booking.endDate,
        resolvedBy: incident.resolvedBy?.name ?? null,
      })),
    });
  } catch (error) {
    console.error('Fetch incidents error:', error);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

// POST - Create a new incident report for a booking
export async function POST(request: NextRequest) {
  let savedAttachmentAbsolutePath: string | null = null;

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
    const contentType = request.headers.get('content-type') ?? '';

    let bookingId = '';
    let description = '';
    let type = '' as IncidentType;
    let attachmentUrl: string | null = null;
    let attachmentType: string | null = null;
    let attachmentName: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      bookingId = String(formData.get('bookingId') ?? '').trim();
      description = String(formData.get('description') ?? '').trim();
      type = String(formData.get('type') ?? '').toUpperCase() as IncidentType;

      const attachment = formData.get('attachment');
      if (attachment instanceof File && attachment.size > 0) {
        const mimeType = attachment.type || '';

        if (!isAllowedAttachmentType(mimeType)) {
          return NextResponse.json(
            { error: 'Attachment must be an image or video file' },
            { status: 400 }
          );
        }

        const maxBytes = mimeType.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (attachment.size > maxBytes) {
          return NextResponse.json(
            { error: mimeType.startsWith('video/') ? 'Video must be 25MB or smaller' : 'Image must be 10MB or smaller' },
            { status: 400 }
          );
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'incidents');
        await mkdir(uploadsDir, { recursive: true });

        const extension = normalizeExtension(attachment.name, mimeType);
        const storedName = `${Date.now()}-${randomUUID()}${extension}`;
        const absoluteFilePath = path.join(uploadsDir, storedName);
        const bytes = Buffer.from(await attachment.arrayBuffer());
        await writeFile(absoluteFilePath, bytes);

        savedAttachmentAbsolutePath = absoluteFilePath;
        attachmentUrl = `/uploads/incidents/${storedName}`;
        attachmentType = mimeType;
        attachmentName = attachment.name;
      }
    } else {
      const body = await request.json();
      bookingId = String(body.bookingId ?? '').trim();
      description = String(body.description ?? '').trim();
      type = String(body.type ?? '').toUpperCase() as IncidentType;
    }

    if (!bookingId || !description || !type) {
      return NextResponse.json(
        { error: 'bookingId, type and description are required' },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid incident type' },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        ownerId: true,
        caregiverId: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const incident = await prisma.incident.create({
      data: {
        bookingId: booking.id,
        reporterId: booking.ownerId,
        caregiverId: booking.caregiverId,
        type,
        description,
        attachmentUrl,
        attachmentType,
        attachmentName,
      },
      select: {
        id: true,
        bookingId: true,
        reporterId: true,
        caregiverId: true,
        type: true,
        status: true,
        description: true,
        attachmentUrl: true,
        attachmentType: true,
        attachmentName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, incident }, { status: 201 });
  } catch (error) {
    if (savedAttachmentAbsolutePath) {
      await unlink(savedAttachmentAbsolutePath).catch(() => undefined);
    }
    console.error('Create incident error:', error);
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}

// PATCH - Resolve or dismiss an incident
export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin();
    if ('error' in adminCheck) return adminCheck.error;

    const body = await request.json();
    const validated = resolveIncidentSchema.parse(body);

    const incident = await prisma.incident.findUnique({
      where: { id: validated.incidentId },
      select: {
        id: true,
        caregiverId: true,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedIncident = await tx.incident.update({
        where: { id: validated.incidentId },
        data: {
          status: validated.status,
          resolutionNotes: validated.resolutionNotes ?? null,
          resolvedAt: validated.status === 'RESOLVED' ? new Date() : null,
          resolvedById: validated.status === 'RESOLVED' || validated.status === 'DISMISSED' ? adminCheck.userId : null,
        },
        select: {
          id: true,
          status: true,
          resolutionNotes: true,
          resolvedAt: true,
        },
      });

      // If admin chooses to resolve (suspend action), suspend the caregiver tied to this booking.
      if (validated.status === 'RESOLVED') {
        await tx.user.update({
          where: { id: incident.caregiverId },
          data: { status: 'SUSPENDED' },
        });
      }

      return updatedIncident;
    });

    return NextResponse.json({ success: true, incident: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }

    console.error('Resolve incident error:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}
