import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, generateTokens, setAuthCookies, clearAuthCookies } from '@/app/lib/utils';
import { prisma } from '@/app/lib/prisma';

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

function inferRememberMeFromRefreshPayload(payload: { iat?: unknown; exp?: unknown }) {
  if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
    return false;
  }

  // If token lifetime exceeds 7 days, it originated from remember-me login.
  return payload.exp - payload.iat > SEVEN_DAYS_IN_SECONDS;
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }
    
    // Verify refresh token
    const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET!);
    
    if (!payload || typeof payload === 'string') {
      const response = NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }
    
    const tokenPayload = payload as { userId?: string; iat?: unknown; exp?: unknown };
    const userId = tokenPayload.userId;
    if (!userId) {
      const response = NextResponse.json(
        { error: 'Invalid refresh token payload' },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    // Refresh tokens must be rebuilt with canonical user claims from DB.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    const rememberMe = inferRememberMeFromRefreshPayload(tokenPayload);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email,
      user.role,
      rememberMe // maintain original session length
    );
    
    const response = NextResponse.json({
      success: true,
      accessToken,
    });
    
    // Set new cookies
    setAuthCookies(response, accessToken, newRefreshToken, rememberMe);
    
    return response;
    
  } catch (error) {
    console.error('Refresh error:', error);
    const response = NextResponse.json(
      { error: 'Refresh failed' },
      { status: 500 }
    );
    return clearAuthCookies(response);
  }
}