import { apiError, apiOk } from "@/lib/api-response";
import { controlGpu, getTelemetry } from "@/lib/hardware";
import { GpuControlRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = GpuControlRequestSchema.parse(body);
    await controlGpu(parsed);
    const telemetry = await getTelemetry();
    return apiOk({
      gpu: telemetry.gpu,
      rebootRequired: true,
    });
  } catch (err) {
    return apiError(err, err instanceof SyntaxError ? 400 : 500);
  }
}

