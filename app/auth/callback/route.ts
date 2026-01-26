import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options ?? {});
              });
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ Exchange failed:', error.message);
      return NextResponse.redirect(`${origin}/auth/signin?error=oauth_failed`);
    }

// Wait for cookies to appear (with timeout)
    const waitForCookies = async (maxAttempts = 10): Promise<boolean> => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const authCookies = cookieStore.getAll().filter(c => 
          c.name.includes('auth-token') && !c.name.includes('code-verifier')
        );

        if (authCookies.length > 0) {
          console.log(`✅ Cookies found after ${attempt} attempts`);
          return true;
        }

        // Exponential backoff: 10ms, 20ms, 40ms, etc.
        const delay = Math.min(10 * Math.pow(2, attempt), 100);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return false;
    };

    const cookiesReady = await waitForCookies();

    if (!cookiesReady) {
      console.error('❌ Timeout waiting for cookies');
      return NextResponse.redirect(`${origin}/auth/signin?error=cookie_timeout`);
    }

    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Session ready:', session?.user.email);

    return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/auth/signin`);
}