import { handleProductionSetup } from "@/core/production-setup";

export async function POST(request: Request) {
  return handleProductionSetup(request);
}
