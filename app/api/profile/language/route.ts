import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

export async function POST(request: Request) {
  try {
    const { language } = await request.json();
    
    // Validate language
    const validLanguages: Language[] = ["en", "am", "om", "ti"];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        { error: "Invalid language" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update user's language preference
    const { error } = await supabase
      .from("profiles")
      .update({ language_pref: language })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating language:", error);
      return NextResponse.json(
        { error: "Failed to update language" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in language update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
