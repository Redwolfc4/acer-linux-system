import { apiError, apiOk } from "@/lib/api-response";
import { getTelemetry } from "@/lib/hardware";
import { TelemetryResponseSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const telemetry = TelemetryResponseSchema.parse(await getTelemetry());
    return apiOk(telemetry);
  } catch (err) {
    return apiError(err, 500);
  }
}

