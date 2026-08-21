# PayLead AI Beta

這是一個旁路 Beta，不修改既有 `/api/search`。

新增：
- `lib/aiLeadBeta.ts`
- `app/api/ai/judge/route.ts`
- `app/api/jobs/daily-leads/route.ts`
- `app/ai-leads/page.tsx`

環境變數：
- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash-lite`
- `CRON_SECRET`
- `LEAD_WEBHOOK_URL`（選填）

先測：
1. 把 4 個程式檔依路徑新增進專案。
2. `.env.local` 加 `GEMINI_API_KEY=...`。
3. `npm run build`。
4. `npm run dev`。
5. 開 `/ai-leads`。

Cron：
`vercel.cron.example.json` 只是範例，不要直接覆蓋既有 `vercel.json`。`30 23 * * *` 是 UTC 23:30，即台北時間隔天 07:30。確認 Beta 正常後再把 crons 區段合併。

Fail-safe：Gemini 失敗會保留原 Rule Engine 結果；Daily Job 失敗不影響 `/api/search`。
