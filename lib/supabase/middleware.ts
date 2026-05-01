import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/subjects") ||
    pathname.startsWith("/chapter") ||
    pathname.startsWith("/tutor") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/admin");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const url = request.nextUrl.clone();
    if (profile?.role === "admin") {
      url.pathname = "/admin/dashboard";
    } else if (profile?.role === "teacher") {
      url.pathname = "/teacher/dashboard";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isTeacher = profile?.role === "teacher" || profile?.role === "admin";
    const isAdmin = profile?.role === "admin";

    if (isAdmin && pathname === "/dashboard") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }

    if (!isAdmin && pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = isTeacher ? "/teacher/dashboard" : "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isTeacher && pathname === "/dashboard") {
      const url = request.nextUrl.clone();
      url.pathname = "/teacher/dashboard";
      return NextResponse.redirect(url);
    }

    if (
      !isTeacher &&
      (pathname.startsWith("/teacher") || pathname === "/teacher")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
