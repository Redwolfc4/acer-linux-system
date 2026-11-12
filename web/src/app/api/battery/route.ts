import { apiError, apiOk } from "@/lib/api-response";
import { controlBattery, getTelemetry } from "@/lib/hardware";
import { BatteryControlRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BatteryControlRequestSchema.parse(body);
    await controlBattery(parsed);
    const telemetry = await getTelemetry();
    return apiOk({ battery: telemetry.battery });
  } catch (err) {
    return apiError(err, err instanceof SyntaxError ? 400 : 500);
  }
}

