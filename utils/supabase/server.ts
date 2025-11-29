import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies(); // this is RequestCookies

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Use cookieStore.get(name) which returns Cookie | undefined
          const cookie = cookieStore.get(name);
          return cookie ? cookie.value : undefined;
        },
      },
    }
  );
};
