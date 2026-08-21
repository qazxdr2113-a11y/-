"use client";
import { useState } from "react";

type AnyLead = Record<string, any>;

export default function AiLeadsBetaPage() {
  const [keyword, setKeyword] = useState("服飾");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<AnyLead[]>([]);

  async function run() {
    const value = keyword.trim();
    if (!value) return;
    setLoading(true); setMessage("先用原本 Rule Engine 搜尋…"); setResults([]);
    try {
      const searchResponse = await fetch("/api/search", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: value }),
      });
      const searchText = await searchResponse.text();
      let searchData: any;
      try { searchData = JSON.parse(searchText); }
      catch { throw new Error(searchText.slice(0, 250) || `搜尋 API HTTP ${searchResponse.status}`); }
      if (!searchResponse.ok || !searchData?.success) throw new Error(searchData?.error || "原搜尋 API 失敗");

      const leads = Array.isArray(searchData.results) ? searchData.results.slice(0, 15) : [];
      setMessage(`Rule Engine 找到 ${leads.length} 筆，AI 正在二次審查…`);
      const aiResponse = await fetch("/api/ai/judge", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: value, leads }),
      });
      const aiData = await aiResponse.json();
      if (!aiResponse.ok || !aiData?.success) {
        setResults(leads.map((lead: AnyLead) => ({ ...lead, ai: { aiReviewed: false, keep: true, priority: "C", reason: "AI 暫時不可用，顯示原 Rule Engine 結果。" } })));
        setMessage("AI Judge 暫時不可用；已安全降級為原搜尋結果。");
        return;
      }
      const reviewed = Array.isArray(aiData.results) ? aiData.results : [];
      const rank: Record<string, number> = { A: 3, B: 2, C: 1 };
      setResults(reviewed.filter((lead: AnyLead) => lead?.ai?.keep !== false).sort((a: AnyLead, b: AnyLead) => (rank[b?.ai?.priority] || 0) - (rank[a?.ai?.priority] || 0)));
      setMessage(`AI 審查完成：保留 ${aiData.keptCount} / ${reviewed.length} 筆`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "執行失敗");
    } finally { setLoading(false); }
  }

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "Arial, 'Noto Sans TC', sans-serif" }}>
    <h1>PayLead AI Beta</h1>
    <p>獨立測試頁，不會修改原本商戶搜尋流程。</p>
    <div style={{ display: "flex", gap: 8, margin: "20px 0" }}>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="例如：服飾" style={{ flex: 1, padding: "12px 14px", border: "1px solid #ccc", borderRadius: 8 }} />
      <button onClick={run} disabled={loading} style={{ padding: "12px 18px", borderRadius: 8, border: 0, cursor: "pointer" }}>{loading ? "AI 分析中…" : "AI Beta 搜尋"}</button>
    </div>
    {message && <p style={{ marginBottom: 20 }}>{message}</p>}
    <div style={{ display: "grid", gap: 14 }}>
      {results.map((lead, index) => <article key={`${lead.url}-${index}`} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div><h3 style={{ margin: "0 0 6px" }}>{lead.brand || lead.title || lead.url}</h3><a href={lead.url} target="_blank" rel="noreferrer">{lead.url}</a></div>
          <strong>AI {lead?.ai?.priority || "C"}</strong>
        </div>
        <p><b>AI 判斷：</b>{lead?.ai?.businessType || "待確認"}｜{lead?.ai?.opportunity || "待確認"}</p>
        <p><b>建議窗口：</b>{lead?.ai?.suggestedOwner || "待確認"}</p>
        <p><b>理由：</b>{lead?.ai?.reason || "無"}</p>
        <small>Rule Lead Score：{lead.leadScore ?? "-"} ｜ Platform：{lead.platform || "Unknown"} ｜ AI：{lead?.ai?.aiReviewed ? "已參與" : "降級模式"}</small>
      </article>)}
    </div>
  </main>;
}
