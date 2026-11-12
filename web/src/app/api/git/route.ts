import { apiError, apiOk } from "@/lib/api-response";
import { getGitOverview } from "@/lib/hardware";
import { GitOverviewResponseSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = GitOverviewResponseSchema.parse(await getGitOverview());
    return apiOk(data);
  } catch (err) {
    return apiError(err, 500);
  }
}

