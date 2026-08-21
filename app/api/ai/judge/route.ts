import { NextResponse } from "next/server";
import { judgeLeads, type SearchLead } from "@/lib/aiLeadBeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const keyword = String(body?.keyword || "").trim();
    const leads = Array.isArray(body?.leads) ? (body.leads as SearchLead[]) : [];

    if (!keyword) return NextResponse.json({ success: false, error: "缺少 keyword" }, { status: 400 });
    if (leads.length === 0) return NextResponse.json({ success: true, keyword, aiReviewedCount: 0, keptCount: 0, results: [] });

    const decisions = await judgeLeads(keyword, leads.slice(0, 15));
    const decisionMap = new Map(decisions.map((item) => [item.url, item]));
    const reviewed = leads.slice(0, 15).map((lead) => ({ ...lead, ai: decisionMap.get(lead.url) }));

    return NextResponse.json({
      success: true,
      keyword,
      aiReviewedCount: decisions.filter((x) => x.aiReviewed).length,
      keptCount: decisions.filter((x) => x.keep).length,
      results: reviewed,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "AI Judge 發生錯誤" }, { status: 500 });
  }
}
