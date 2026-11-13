import { apiError, apiOk } from "@/lib/api-response";
import { getRgbProfiles, handleRgbProfile } from "@/lib/hardware";
import { RgbProfileActionSchema, RgbProfilesResponseSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RgbProfileActionSchema.parse(body);
    const loadedConfig = await handleRgbProfile(parsed);
    const profiles = RgbProfilesResponseSchema.parse(await getRgbProfiles());
    return apiOk({
      ...profiles,
      loadedConfig,
    });
  } catch (err) {
    return apiError(err, err instanceof SyntaxError ? 400 : 500);
  }
}

