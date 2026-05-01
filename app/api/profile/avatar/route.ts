import { NextResponse } from "next/server";

import { uploadImageToCloudinary } from "@/lib/cloudinary/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const url = await uploadImageToCloudinary(file);
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: url },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ avatarUrl: url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to upload avatar." },
      { status: 500 },
    );
  }
}
