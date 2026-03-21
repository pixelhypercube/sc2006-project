import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './app/lib/utils';

// Public routes that don't need authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register', 
  '/api/auth/refresh',
  '/api/auth/verify-email',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/',
  '/login',
  '/register',
  '/about',
  '/pricing',
  '/signin',
  '/signup'
];

// Role-based route protection
const roleRoutes: Record<string, string[]> = {
  '/api/admin': ['ADMIN'],
  '/api/caregiver': ['CAREGIVER', 'ADMIN'],
  '/admin': ['ADMIN'],
  '/caregiver': ['CAREGIVER', 'ADMIN'],
  '/owner': ['PET_OWNER'],
  '/api/pets': ['PET_OWNER', 'CAREGIVER', 'ADMIN'],
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Proxy path:', pathname);
  
  // Check if route is public FIRST
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  console.log('Access Token:', !!accessToken);
  console.log('Refresh Token:', !!refreshToken);
  
  // No access token → try refresh if refresh token exists
  if (!accessToken) {
    if (refreshToken) {
      try {
        // ✅ Fix: Use FULL URL for internal fetch
        const origin = request.nextUrl.origin;
        const refreshResponse = await fetch(`${origin}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Cookie': `refresh_token=${refreshToken}`
          }
        });
        
        if (refreshResponse.ok) {
          // Refresh successful → Forward new cookies + continue
          const response = NextResponse.next();
          
          // Forward cookies (your existing logic is perfect)
          const setCookieHeaders = refreshResponse.headers.getSetCookie?.() || 
                                   [refreshResponse.headers.get('set-cookie')].filter(Boolean);
          
          for (const cookieHeader of setCookieHeaders) {
            if (cookieHeader) {
              const [cookieValue] = cookieHeader.split(';');
              const [name, value] = cookieValue.split('=');
              
              if (name && value) {
                const options: any = {
                  path: '/',
                  httpOnly: cookieHeader.includes('HttpOnly'),
                  secure: cookieHeader.includes('Secure'),
                  sameSite: cookieHeader.includes('SameSite=Lax') ? 'lax' : 
                           cookieHeader.includes('SameSite=Strict') ? 'strict' : 'lax',
                };
                
                const maxAgeMatch = cookieHeader.match(/Max-Age=(\d+)/);
                if (maxAgeMatch) {
                  options.maxAge = parseInt(maxAgeMatch[1], 10);
                }
                
                response.cookies.set(name.trim(), value, options);
              }
            }
          }
          
          console.log('Token refreshed successfully, cookies forwarded.');
          return response;
        }
      } catch (refreshError) {
        console.error('Refresh failed:', refreshError);
      }
    }
    
    // No token or refresh failed → redirect to signin
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('user');
    return response;
  }
  
  // ✅ Verify access token
  let payload;
  try {
    payload = verifyToken(accessToken!, process.env.JWT_SECRET!);
  } catch (error: any) {
    console.error('Token verification failed:', error);
    // Token invalid → clear cookies and redirect
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('user');
    return response;
  }
  
  if (!payload || typeof payload === 'string') {
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('user');
    return response;
  }
  
  // Check role-based access
  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(payload.role)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        const dashboardUrl = new URL(
          payload.role === 'CAREGIVER' ? '/caregiver' : '/owner',
          request.url
        );
        return NextResponse.redirect(dashboardUrl);
      }
      break;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
  '/((?!_next/static|_next/image|favicon.ico|api/auth/).*)',  // ✅ No trailing |/.
]

};
