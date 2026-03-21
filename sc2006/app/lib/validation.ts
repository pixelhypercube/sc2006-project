import { z } from 'zod';

// Registration validation schema
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .transform((email) => email.toLowerCase().trim()),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .transform((name) => name.trim()),
    
  role: z.enum(['OWNER', 'CAREGIVER']),
  
  phone: z.string()
    .optional()
    .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), {
      message: 'Invalid phone number format'
    }),
    
  location: z.string()
  .max(100, 'Location must be less than 100 characters')
  .optional(),

    
  latitude: z.number()
    .min(-90)
    .max(90)
    .optional(),
    
  longitude: z.number()
    .min(-180)
    .max(180)
    .optional(),
});

export const loginSchema = z.object({
  identifier: z.string()
    .min(3, 'Identifier must be at least 3 characters')
    .max(100, 'Identifier too long')
    .refine(
      (value) => {
        // Either valid email OR reasonable username
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) || /^[a-zA-Z0-9_]{3,30}$/.test(value);
      },
      {
        message: 'Must be a valid email or username (letters, numbers, underscores)'
      }
    )
    .transform((value) => value.toLowerCase().trim()),
    
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password is too long'),

  rememberMe: z.boolean().optional().default(false),
});

export const petSchema = z.object({
  name: z.string()
    .min(1, 'Pet name is required')
    .max(50, 'Pet name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s'-]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes'),
    
  type: z.string()
    .min(1, 'Pet type is required'),
  
  breed: z.string()
    .max(50, 'Breed must be less than 50 characters')
    .optional()
    .nullable(),

  vaccinationStatus: z.string()
    .max(500, 'Vaccination status must be less than 500 characters')
    .optional()
    .nullable(),
    
  age: z.number()
    .int('Age must be a whole number')
    .min(0, 'Age cannot be negative')
    .max(50, 'Age must be less than 50 years')
    .optional()
    .nullable(),
    
  weight: z.float32()
    .min(0, 'Weight cannot be negative')
    .max(200, 'Weight must be less than 200 kg')
    .optional()
    .nullable(),
    
  specialNeeds: z.string()
    .max(500, 'Special needs must be less than 500 characters')
    .optional()
    .nullable(),
    
  photo: z.string()
    .url('Invalid photo URL')
    .optional()
    .nullable(),
});

export const bookingSchema = z.object({
  ownerId: z.string(),

  caregiverId: z.string(),
  petId: z.string(),

  startDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid start date format'),
  
  endDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid end date format'),

  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).default('PENDING'),

  totalPrice: z.number()
    .min(0, 'Total price cannot be negative')
    .optional(),

  specialInstructions: z.string()
    .max(500, 'Special instructions must be less than 500 characters')
    .optional()
    .nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const petUpdateSchema = petSchema.partial();
export type PetInput = z.infer<typeof petSchema>;
export type PetUpdateInput = z.infer<typeof petUpdateSchema>;