import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server'

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export function verifyToken(token: string, secret: string) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// Generate JWT token
export function generateTokens(userId: string, email: string, role: string, rememberMe: boolean = false) {
  // Access token - short lived (30 min)
  const accessToken = jwt.sign(
    { 
      userId, 
      email, 
      role,
      type: 'access' 
    },
    process.env.JWT_SECRET!,
    { expiresIn: '30m' }
  );
  
  // Refresh token - long lived
  const refreshToken = jwt.sign(
    { 
      userId, 
      type: 'refresh',
      version: crypto.randomBytes(8).toString('hex') // For token revocation
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string, rememberMe: boolean = false) {
  // Set access token cookie (HTTP-only for security)
  response.cookies.set({
    name: 'access_token',
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes in seconds
  });
  
  // Set refresh token cookie (HTTP-only)
  response.cookies.set({
    name: 'refresh_token',
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 or 7 days
  });
  
  // Set user session cookie (accessible to frontend)
  const payload = jwt.decode(accessToken) as any;
  response.cookies.set({
    name: 'user',
    value: JSON.stringify({ 
      id: payload.userId, 
      email: payload.email, 
      role: payload.role,
      isAuthenticated: true 
    }),
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
  });
  
  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  response.cookies.delete('user');
  return response;
}

// Sanitize user object (remove sensitive data)
export function sanitizeUser(user: any) {
  const { password, verificationToken, verificationTokenExpiry, resetPasswordToken, resetPasswordExpiry, ...sanitizedUser } = user;
  return sanitizedUser;
}

// Format error response
export function formatError(error: any) {
  if (error.code === 'P2002') {
    return {
      field: error.meta?.target?.[0] || 'unknown',
      message: 'This value is already taken'
    };
  }
  
  return {
    field: 'unknown',
    message: 'An unexpected error occurred'
  };
}