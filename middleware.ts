import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        let hasProfile = false;
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, is_active')
                .eq('id', user.id)
                .maybeSingle();
            hasProfile = !!profile?.id && profile?.is_active !== false;
        }

        // Protected routes - require authentication
        const protectedPaths = ['/dashboard', '/tender', '/admin', '/settings'];
        const isProtectedPath = protectedPaths.some((path) =>
            request.nextUrl.pathname.startsWith(path)
        );

        if (isProtectedPath && (!user || !hasProfile)) {
            const redirectUrl = new URL('/login', request.url);
            redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Auth routes - redirect to dashboard if already logged in
        const authPaths = ['/login', '/signup'];
        const isAuthPath = authPaths.some((path) =>
            request.nextUrl.pathname.startsWith(path)
        );

        if (isAuthPath && user && hasProfile) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    } catch (error) {
        console.error('Error in middleware:', error);
        // In case of any error, just continue
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, fonts, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};