import { apiError, apiOk } from "@/lib/api-response";
import { controlFan, getTelemetry } from "@/lib/hardware";
import { FanControlRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = FanControlRequestSchema.parse(body);
    await controlFan(parsed);
    const telemetry = await getTelemetry();
    return apiOk({ applied: parsed, nbfc: telemetry.nbfc });
  } catch (err) {
    return apiError(err, err instanceof SyntaxError ? 400 : 500);
  }
}

