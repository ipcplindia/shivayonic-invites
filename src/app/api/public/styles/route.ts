import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getPublicOrganizationId } from "@/core/public-organization";

export async function GET() {
  const styles = await prisma.visualStyle.findMany({ where: { active: true, organizationId: await getPublicOrganizationId() }, select: { id: true, slug: true, name: true, description: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ styles });
}
