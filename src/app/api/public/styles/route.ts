import { NextResponse } from "next/server";
import { prisma } from "@/db/client";

export async function GET() {
  const styles = await prisma.visualStyle.findMany({ where: { active: true }, select: { id: true, slug: true, name: true, description: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ styles });
}
