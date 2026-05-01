import crypto from "node:crypto";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Cloudinary uploads.`);
  }
  return value;
}

export function getCloudinaryConfig() {
  return {
    cloudName: requiredEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requiredEnv("CLOUDINARY_API_KEY"),
    apiSecret: requiredEnv("CLOUDINARY_API_SECRET"),
    folder: process.env.CLOUDINARY_FOLDER || "askuala/avatars",
  };
}

function signParams(input: Record<string, string>, apiSecret: string): string {
  const serialized = Object.keys(input)
    .sort()
    .map((key) => `${key}=${input[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const { cloudName, apiKey, apiSecret, folder } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { folder, timestamp };
  const signature = signParams(params, apiSecret);

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUri = `data:${file.type || "image/jpeg"};base64,${base64}`;

  const body = new URLSearchParams({
    file: dataUri,
    api_key: apiKey,
    timestamp,
    folder,
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }

  const json = (await response.json()) as { secure_url?: string };
  if (!json.secure_url) {
    throw new Error("Cloudinary did not return a secure_url.");
  }
  return json.secure_url;
}
