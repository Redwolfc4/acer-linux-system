import { apiError, apiOk } from "@/lib/api-response";
import { applyRgb, getRgbProfiles } from "@/lib/hardware";
import { RgbControlRequestSchema, RgbProfilesResponseSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = RgbProfilesResponseSchema.parse(await getRgbProfiles());
    return apiOk(data);
  } catch (err) {
    return apiError(err, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RgbControlRequestSchema.parse(body);
    await applyRgb(parsed);
    return apiOk({ applied: parsed });
  } catch (err) {
    return apiError(err, err instanceof SyntaxError ? 400 : 500);
  }
}

