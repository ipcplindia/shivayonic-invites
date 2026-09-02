import { handleProductionSetupExecutor } from "@/core/production-setup-executor";

export async function POST(request: Request) {
  return handleProductionSetupExecutor(request);
}
