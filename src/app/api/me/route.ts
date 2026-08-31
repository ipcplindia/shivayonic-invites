import { getCurrentUserContext } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";

export async function GET(request: Request) {
  try {
    const context = await getCurrentUserContext({ headers: request.headers });
    return Response.json(context);
  } catch (error) {
    if (error instanceof AppAuthError) return authErrorResponse(error);
    return Response.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401 });
  }
}
