import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Prisma, Role } from '@/app/generated/prisma/client'
import { registerSchema } from '@/app/lib/validation';
import { 
  hashPassword, 
  generateVerificationToken,
  formatError 
} from '@/app/lib/utils';
import { sendVerificationEmail } from '@/app/lib/email';
import { z } from 'zod';

function mapRole(formRole: string): Role {
  switch (formRole.toLowerCase()) {
    case 'OWNER':
      return Role.OWNER  // or Role.OWNER if string enum
    case 'CAREGIVER':
      return Role.CAREGIVER
    default:
      throw new Error(`Invalid role: ${formRole}`)
  }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Received registration data:', body);
        const validatedData = registerSchema.parse(body);
        const { email, password, name, role } = body;
        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                { email: validatedData.email },
                { name: validatedData.name }
                ]
            },
            select: { 
                id: true, 
                email: true,
                name: true  // Add this too
            }
            });
    
        if (existingUser) {
        return NextResponse.json(
                { 
                error: 'User already exists',
                field: 'email',
                message: 'An account with this email already exists'
                },
                { status: 409 }
            );
        }

        if (validatedData.phone) {
            const existingPhone = await prisma.user.findUnique({
                where: { phone: validatedData.phone },
                select: { id: true }
            });
            
            if (existingPhone) {
                return NextResponse.json(
                { 
                    error: 'Phone number already registered',
                    field: 'phone',
                    message: 'This phone number is already in use'
                },
                { status: 409 }
                );
            }
        }
        
        const hashedPassword = await hashPassword(validatedData.password);
        const verificationToken = generateVerificationToken();
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours from now
        // Create user
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                email: validatedData.email,
                password: hashedPassword,
                name: validatedData.name,
                role: validatedData.role,
                phone: validatedData.phone,
                location: validatedData.location,
                latitude: validatedData.latitude,
                longitude: validatedData.longitude,
                verified: false,
                verificationToken,
                verificationTokenExpiry: tokenExpiry,
                },
                select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                location: true,
                verified: true,
                createdAt: true,
                }
            });
        
            // If user is a caregiver, create empty caregiver profile
            // if (validatedData.role === 'CAREGIVER') {
            //     await tx.caregiverProfile.create({
            //     data: {
            //         userId: user.id,
            //         dailyRate: 0, // Default, will be updated later
            //         petPreferences: [],
            //     }
            //     });
            // }
            
            // Create welcome notification
            await tx.notification.create({
                data: {
                userId: user.id,
                type: 'WELCOME',
                title: 'Welcome to PetCare!',
                message: `Welcome ${user.name}! We're excited to have you on board. Complete your profile to get started.`,
                }
            });
        
            return user;
        });
    
        // Send verification email (don't await to not block response)
        // In your register route
        sendVerificationEmail(result.email, verificationToken, result.name)
        .catch(console.error); // Log email errors but don't fail registration
        
        // Log registration
        console.log(`New user registered: ${result.email} (${result.id})`);
        
        // Return success response
        return NextResponse.json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        user: result,
        }, { status: 201 });
    
    } catch (error) {
        console.log('error encounterd');
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
        
        // Handle Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code.startsWith('P')) {
                const formattedError = formatError(error);
                return NextResponse.json({
                    error: 'Database Error',
                    field: formattedError.field,
                    message: error.message
            }, { status: 400 });
            }
        }
        
        // Log unexpected errors
        console.error('Registration error:', error);
        
        // Return generic error
        return NextResponse.json(
        { 
            error: 'Registration failed',
            message: 'An unexpected error occurred. Please try again later.'
        },
        { status: 500 }
        );
    }
}