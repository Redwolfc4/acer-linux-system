import { apiError, apiOk } from "@/lib/api-response";
import { getGitOverview, manageGitAction } from "@/lib/hardware";
import { GitActionRequestSchema, GitOverviewResponseSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = GitOverviewResponseSchema.parse(await getGitOverview());
    return apiOk(data);
  } catch (err) {
    return apiError(err, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = GitActionRequestSchema.parse(body);
    await manageGitAction(action);
    const updated = GitOverviewResponseSchema.parse(await getGitOverview());
    return apiOk({ success: true, overview: updated });
  } catch (err) {
    return apiError(err, err instanceof SyntaxError ? 400 : 500);
  }
}

