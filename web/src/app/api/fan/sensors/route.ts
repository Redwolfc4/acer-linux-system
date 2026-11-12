import { apiError, apiOk } from "@/lib/api-response";
import { getFanSensors, updateFanSensors } from "@/lib/hardware";
import { FanSensorsResponseSchema, FanSensorUpdateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = FanSensorsResponseSchema.parse(await getFanSensors());
    return apiOk(data);
  } catch (err) {
    return apiError(err, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = FanSensorUpdateSchema.parse(body);
    await updateFanSensors(parsed);
    const updated = FanSensorsResponseSchema.parse(await getFanSensors());
    return apiOk(updated);
  } catch (err) {
    return apiError(err, err instanceof SyntaxError ? 400 : 500);
  }
}

