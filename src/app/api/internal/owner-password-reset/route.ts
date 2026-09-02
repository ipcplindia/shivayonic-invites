import { handleOwnerPasswordReset } from "@/core/owner-password-reset";

export async function POST(request: Request) {
  return handleOwnerPasswordReset(request);
}
