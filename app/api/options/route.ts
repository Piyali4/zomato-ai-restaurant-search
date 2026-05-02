import { NextResponse } from "next/server";
import { listAreas, listCuisines } from "@/lib/data";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    areas: listAreas(),
    cuisines: listCuisines(),
    budgets: ["low", "medium", "high"],
  });
}
