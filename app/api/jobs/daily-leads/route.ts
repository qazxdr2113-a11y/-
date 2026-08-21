import { NextResponse } from "next/server";
import { judgeLeads, planDailyIndustries, type SearchLead } from "@/lib/aiLeadBeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function searchExistingApi(req: Request, keyword: string): Promise<SearchLead[]> {
  const endpoint = new URL("/api/search", req.url);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword }),
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`/api/search ${keyword} HTTP ${response.status}: ${text.slice(0, 160)}`);
  }
  const data = await response.json();
  return Array.isArray(data?.results) ? data.results.slice(0, 15) : [];
}

async function deliverToWebhook(payload: unknown) {
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) return { delivered: false, reason: "LEAD_WEBHOOK_URL 未設定" };
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    return { delivered: response.ok, status: response.status };
  } catch (error) {
    return { delivered: false, reason: error instanceof Error ? error.message : "Webhook 發送失敗" };
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const startedAt = new Date().toISOString();

  try {
    const plan = await planDailyIndustries();
    const batches: any[] = [];

    for (const keyword of plan.industries) {
      try {
        const ruleResults = await searchExistingApi(req, keyword);
        const decisions = await judgeLeads(keyword, ruleResults);
        const decisionMap = new Map(decisions.map((x) => [x.url, x]));
        const enriched = ruleResults.map((lead) => ({ ...lead, ai: decisionMap.get(lead.url) }));
        const rank: Record<string, number> = { A: 3, B: 2, C: 1 };
        const kept = enriched
          .filter((lead: any) => lead.ai?.keep !== false)
          .sort((a: any, b: any) => (rank[b.ai?.priority || "C"] || 0) - (rank[a.ai?.priority || "C"] || 0))
          .slice(0, 10);
        batches.push({ keyword, ruleCount: ruleResults.length, keptCount: kept.length, results: kept });
      } catch (error) {
        batches.push({ keyword, ruleCount: 0, keptCount: 0, results: [], error: error instanceof Error ? error.message : "搜尋失敗" });
      }
    }

    const allResults = batches.flatMap((batch) => batch.results.map((lead: any) => ({ keyword: batch.keyword, ...lead })));
    const summary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      aiPlanned: plan.aiPlanned,
      industries: plan.industries,
      plannerReason: plan.reason,
      totalKept: allResults.length,
      priorityA: allResults.filter((lead: any) => lead?.ai?.priority === "A").length,
      priorityB: allResults.filter((lead: any) => lead?.ai?.priority === "B").length,
    };
    const payload = { source: "PayLead AI Beta", summary, batches };
    const delivery = await deliverToWebhook(payload);
    console.log("🤖 PayLead Daily AI completed", JSON.stringify({ summary, delivery }));
    return NextResponse.json({ success: true, summary, delivery, batches });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Daily AI Job 發生錯誤" }, { status: 500 });
  }
}
