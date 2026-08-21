// ============================================================
// PayLead AI Beta
// Gemini Interactions API version
// ============================================================

export type SearchLead = {
  title?: string;
  brand?: string;
  url: string;
  description?: string;
  platform?: string;
  cooperation?: string;
  paymentScore?: number;
  physicalScore?: number;
  industryScore?: number;
  leadScore?: number;
  hasPaymentNeed?: boolean;
  physicalStore?: {
    hasPhysicalStore?: boolean;
    signals?: string[];
  };
  industrySignals?: string[];
  paymentSignals?: string[];
};

export type AiLeadDecision = {
  url: string;
  aiReviewed: boolean;
  keep: boolean;
  isMerchant: boolean;
  industryMatch: boolean;
  isContentSite: boolean;
  priority: "A" | "B" | "C";
  businessType: string;
  opportunity: string;
  suggestedOwner: string;
  reason: string;
};

const GEMINI_MODEL = (() => {
  const value =
    String(
      process.env.GEMINI_MODEL ||
      ""
    ).trim();

  if (
    value &&
    /^gemini-[a-z0-9.-]+$/i.test(value) &&
    !value.endsWith("-")
  ) {
    return value;
  }

  return "gemini-3.7-flash";
})();

const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

function safeText(value: unknown, max = 1200) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function stripCodeFence(text: string) {
  return String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

let lastGeminiRequestAt = 0;

// Free Tier 保守節流：避免 20 RPM 上限。
// 3.2 秒至少間隔，理論上不超過約 18 requests/min。
async function throttleGemini() {
  const MIN_INTERVAL_MS = 3200;
  const now = Date.now();
  const waitMs =
    Math.max(
      0,
      MIN_INTERVAL_MS -
        (now - lastGeminiRequestAt)
    );

  if (waitMs > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, waitMs)
    );
  }

  lastGeminiRequestAt = Date.now();
}

function isRateLimitError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Gemini HTTP 429")
  );
}

async function callGeminiJson<T>(
  prompt: string,
  schema: Record<string, any>
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 未設定");
  }

  await throttleGemini();

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input: prompt,

        // 官方 Interactions API Structured Output。
        // 讓 Gemini 直接按照 schema 回 JSON，
        // 不再依賴 prompt 要求「請只回 JSON」。
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema,
        },

        generation_config: {
          max_output_tokens: 1800,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    }
  );

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `Gemini HTTP ${response.status}: ${raw.slice(0, 500)}`
    );
  }

  let data: any;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Gemini API 外層回傳不是有效 JSON");
  }

  // REST Interactions API 從 steps 取得最後 model_output。
  const steps = Array.isArray(data?.steps) ? data.steps : [];

  const outputText = steps
    .filter((step: any) => step?.type === "model_output")
    .flatMap((step: any) =>
      Array.isArray(step?.content) ? step.content : []
    )
    .filter(
      (content: any) =>
        content?.type === "text" &&
        typeof content?.text === "string"
    )
    .map((content: any) => content.text)
    .join("")
    .trim();

  if (!outputText) {
    throw new Error(
      `Gemini 沒有 model_output，status=${String(data?.status || "unknown")}`
    );
  }

  try {
    return JSON.parse(outputText) as T;
  } catch (error) {
    console.error("❌ Gemini structured JSON parse failed");
    console.error("STATUS:", data?.status);
    console.error("OUTPUT:", outputText.slice(0, 1000));

    throw new Error(
      error instanceof Error
        ? `Gemini JSON 不完整：${error.message}`
        : "Gemini JSON 不完整"
    );
  }
}

function normalizeJsonText(
  text: string
): string {
  let value =
    String(text || "")
      .trim()
      .replace(/^```json\\s*/i, "")
      .replace(/^```\\s*/i, "")
      .replace(/\\s*```$/i, "")
      .trim();

  if (!value) {
    return "";
  }

  const firstObject =
    value.indexOf("{");
  const firstArray =
    value.indexOf("[");

  if (
    firstArray >= 0 &&
    (
      firstObject < 0 ||
      firstArray < firstObject
    )
  ) {
    const lastArray =
      value.lastIndexOf("]");

    if (lastArray > firstArray) {
      return value
        .slice(
          firstArray,
          lastArray + 1
        )
        .trim();
    }
  }

  if (firstObject >= 0) {
    const lastObject =
      value.lastIndexOf("}");

    if (lastObject > firstObject) {
      return value
        .slice(
          firstObject,
          lastObject + 1
        )
        .trim();
    }
  }

  return value;
}

async function callOpenRouterJson<T>(
  prompt: string,
  schema: Record<string, any>
): Promise<T> {
  const apiKey =
    process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY 未設定"
    );
  }

  const response =
    await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${apiKey}`,
          "X-Title":
            "PayLead Finder",
        },
        body: JSON.stringify({
          model:
            OPENROUTER_MODEL,
          messages: [
            {
              role: "system",
              content:
                "你是台灣電子支付公司的 BD Lead Reviewer。只輸出有效 JSON，不要 Markdown，不要任何額外文字。",
            },
            {
              role: "user",
              content:
                prompt,
            },
          ],
          temperature: 0,
          max_completion_tokens:
            1400,
        }),
        cache:
          "no-store",
        signal:
          AbortSignal.timeout(
            45000
          ),
      }
    );

  const raw =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `OpenRouter HTTP ${response.status}: ${raw.slice(0, 500)}`
    );
  }

  let data: any;

  try {
    data =
      JSON.parse(raw);
  } catch {
    throw new Error(
      "OpenRouter API 外層回傳不是有效 JSON"
    );
  }

  const message =
    data?.choices?.[0]
      ?.message;

  let content: unknown =
    message?.content;

  // 有些模型可能把 content 回成 content-part array。
  if (Array.isArray(content)) {
    content =
      content
        .map((part: any) =>
          typeof part === "string"
            ? part
            : typeof part?.text === "string"
              ? part.text
              : ""
        )
        .join("");
  }

  // OpenAI-compatible provider 偶爾會用 choices[0].text。
  if (
    (
      typeof content !== "string" ||
      !content.trim()
    ) &&
    typeof data?.choices?.[0]?.text === "string"
  ) {
    content =
      data.choices[0].text;
  }

  if (
    typeof content !==
      "string" ||
    !content.trim()
  ) {
    console.error(
      "❌ OpenRouter empty output:",
      JSON.stringify(
        data
      ).slice(
        0,
        1200
      )
    );

    throw new Error(
      "OpenRouter 沒有有效輸出文字"
    );
  }

  const jsonText =
    normalizeJsonText(
      content
    );

  try {
    const parsed =
      JSON.parse(
        jsonText
      );

    if (Array.isArray(parsed)) {
      return {
        results: parsed,
      } as T;
    }

    return parsed as T;
  } catch (error) {
    console.error(
      "❌ OpenRouter JSON parse failed"
    );
    console.error(
      "OUTPUT:",
      content.slice(
        0,
        1000
      )
    );

    throw new Error(
      error instanceof Error
        ? `OpenRouter JSON 解析失敗：${error.message}`
        : "OpenRouter JSON 解析失敗"
    );
  }
}

async function callAiJson<T>(
  prompt: string,
  schema: Record<string, any>
): Promise<{
  data: T;
  provider:
    | "Gemini"
    | "OpenRouter";
}> {
  try {
    const data =
      await callGeminiJson<T>(
        prompt,
        schema
      );

    return {
      data,
      provider:
        "Gemini",
    };
  } catch (geminiError) {
    console.warn(
      `⚠️ Gemini unavailable → switching to OpenRouter (${OPENROUTER_MODEL}):`,
      geminiError instanceof Error
        ? geminiError.message
        : String(
            geminiError
          )
    );

    try {
      const data =
        await callOpenRouterJson<T>(
          prompt,
          schema
        );

      return {
        data,
        provider:
          "OpenRouter",
      };
    } catch (
      openRouterError
    ) {
      console.error(
        "❌ Gemini + OpenRouter both failed",
        {
          gemini:
            geminiError instanceof Error
              ? geminiError.message
              : String(
                  geminiError
                ),
          openrouter:
            openRouterError instanceof Error
              ? openRouterError.message
              : String(
                  openRouterError
                ),
        }
      );

      throw new Error(
        "所有 AI Provider 均不可用"
      );
    }
  }
}

export async function planDailyIndustries() {
  const fallback = ["服飾", "健身房", "美容"];

  const pool = [
    "服飾",
    "鞋包配件",
    "美妝保養",
    "健身房",
    "美容",
    "醫美",
    "餐廳",
    "咖啡",
    "家具家居",
    "寵物",
    "旅宿",
    "票券娛樂",
    "停車場",
    "電動車充電",
    "租車",
    "教育課程",
    "生活服務",
    "連鎖零售",
  ];

  const schema = {
    type: "object",
    properties: {
      industries: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
      },
      reason: {
        type: "string",
      },
    },
    required: ["industries", "reason"],
  };

  try {
    const {
      data: result,
      provider,
    } = await callAiJson<{
      industries: string[];
      reason: string;
    }>(
      `你是台灣電子支付公司的 BD Search Planner。
請從以下候選產業挑出今天最值得搜尋的 3 個產業：
${JSON.stringify(pool)}

優先：
- 高交易頻率
- 會員
- 線上交易
- 實體門市
- 預約
- 票券
- 支付場景

只能從候選產業中選。`,
      schema
    );

    console.log(
      `✅ AI Planner provider: ${provider}`
    );

    const industries = Array.isArray(result?.industries)
      ? result.industries
          .filter((item) => pool.includes(item))
          .slice(0, 3)
      : [];

    return {
      aiPlanned: industries.length === 3,
      industries: industries.length === 3 ? industries : fallback,
      reason:
        safeText(result?.reason, 250) ||
        "AI 規劃不足，使用預設產業。",
    };
  } catch (error) {
    console.error("⚠️ AI Planner fallback:", error);

    return {
      aiPlanned: false,
      industries: fallback,
      reason:
        error instanceof Error
          ? `AI Planner 降級：${error.message}`
          : "AI Planner 降級",
    };
  }
}

function fallbackDecision(
  lead: SearchLead
): AiLeadDecision {
  return {
    url: lead.url,
    aiReviewed: false,
    keep: true,
    isMerchant: true,
    industryMatch: true,
    isContentSite: false,
    priority:
      (lead.leadScore || 0) >= 55
        ? "A"
        : (lead.leadScore || 0) >= 30
          ? "B"
          : "C",
    businessType: "AI 未判斷",
    opportunity: "沿用 Rule Engine 結果",
    suggestedOwner: "待分派",
    reason:
      "AI 暫時不可用，保留原搜尋結果，不影響正式流程。",
  };
}

export async function judgeLeads(
  keyword: string,
  leads: SearchLead[]
): Promise<AiLeadDecision[]> {
  if (leads.length === 0) {
    return [];
  }

  const limited = leads.slice(0, 15);

  // ==========================================================
  // Free Tier 策略
  //
  // 15 家不再 15 次 request。
  // 改為 5 家一批 → 最多只打 3 次 Gemini。
  //
  // Gemini 3.7 Flash Free Tier 目前可能只有 20 RPM；
  // 一家一 request 很容易直接撞 429。
  // ==========================================================

  const BATCH_SIZE = 5;

  const resultItemSchema = {
    type: "object",
    properties: {
      index: { type: "integer" },
      isMerchant: { type: "boolean" },
      industryMatch: { type: "boolean" },
      isContentSite: { type: "boolean" },
      priority: {
        type: "string",
        enum: ["A", "B", "C"],
      },
      businessType: { type: "string" },
      opportunity: {
        type: "string",
        enum: [
          "EC",
          "APP",
          "POS",
          "EC + POS",
          "APP + POS",
          "EC + APP + POS",
          "待確認",
        ],
      },
      suggestedOwner: {
        type: "string",
        enum: [
          "電商／數位",
          "營運／門市",
          "資訊／系統",
          "財務／支付",
          "待確認",
        ],
      },
      reason: { type: "string" },
    },
    required: [
      "index",
      "isMerchant",
      "industryMatch",
      "isContentSite",
      "priority",
      "businessType",
      "opportunity",
      "suggestedOwner",
      "reason",
    ],
  };

  const batchSchema = {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: resultItemSchema,
      },
    },
    required: ["results"],
  };

  const decisions: AiLeadDecision[] = [];

  for (
    let startIndex = 0;
    startIndex < limited.length;
    startIndex += BATCH_SIZE
  ) {
    const batch =
      limited.slice(
        startIndex,
        startIndex + BATCH_SIZE
      );

    const targets =
      batch.map((lead, offset) => ({
        index: offset,
        title:
          safeText(
            lead.title || lead.brand,
            150
          ),
        brand:
          safeText(
            lead.brand,
            90
          ),
        url:
          safeText(
            lead.url,
            220
          ),
        description:
          safeText(
            lead.description,
            360
          ),
        platform:
          safeText(
            lead.platform,
            50
          ),
        paymentScore:
          lead.paymentScore || 0,
        physicalScore:
          lead.physicalScore ||
          (
            lead
              .physicalStore
              ?.hasPhysicalStore
              ? 8
              : 0
          ),
        industryScore:
          lead.industryScore || 0,
        leadScore:
          lead.leadScore || 0,
        industrySignals:
          (
            lead.industrySignals ||
            []
          ).slice(0, 4),
        paymentSignals:
          (
            lead.paymentSignals ||
            []
          ).slice(0, 4),
      }));

    try {
      const {
        data: ai,
        provider,
      } = await callAiJson<{
        results: Array<{
          index: number;
          isMerchant: boolean;
          industryMatch: boolean;
          isContentSite: boolean;
          priority: "A" | "B" | "C";
          businessType: string;
          opportunity: string;
          suggestedOwner: string;
          reason: string;
          decision?: string;
        }>;
      }>(
        `你是台灣電子支付公司的資深 BD Lead Reviewer。

目標產業：
${safeText(keyword, 80)}

以下候選網站已由 Rule Engine 初篩：
${JSON.stringify(targets)}

請逐筆判斷它是不是「目標產業真正可開發的商戶」。

規則：
- 百科、黃頁、新聞、雜誌、Podcast、Blog、內容媒體、求職平台、社群平台、商戶目錄：剔除。
- POS / SaaS / 管理系統供應商，如果本身不是目標產業營運商：剔除。
- 只販售該產業設備、但不是該產業營運商：剔除。
- 品牌官網、零售商、連鎖店、服務業者、實際營運場館：可保留。
- 資訊不足可以保留並給 C，不要亂砍。
- 不可猜開店平台，platform 以 Rule Engine 為準。
- index 必須原樣回傳，用來對應候選網站。
- reason 最多 28 個中文字。
- 每一個輸入 index 都必須輸出一筆結果。
- 請只輸出 JSON，不要 Markdown。
- 最穩定格式是：
  {"results":[{"index":0,"decision":"保留","reason":"理由"}]}
- 若你只能輸出 array，也接受：
  [{"index":0,"decision":"保留","reason":"理由"}]
- decision 只能是「保留」或「剔除」。
- 每個 index 都必須輸出。`,
        batchSchema
      );

      const aiMap =
        new Map(
          (Array.isArray(ai?.results)
            ? ai.results
            : []
          ).map((item) => [
            Number(item.index),
            item,
          ])
        );

      const batchDecisions =
        batch.map((lead, offset) => {
          const item =
            aiMap.get(offset);

          if (!item) {
            return fallbackDecision(
              lead
            );
          }

          const simpleDecision =
            safeText(
              (item as any).decision,
              20
            );

          const simpleKeep =
            /保留|keep|yes|true/i.test(
              simpleDecision
            )
              ? true
              : /剔除|排除|reject|remove|no|false/i.test(
                    simpleDecision
                  )
                ? false
                : null;

          const hasFullFlags =
            typeof item.isMerchant ===
              "boolean" &&
            typeof item.industryMatch ===
              "boolean" &&
            typeof item.isContentSite ===
              "boolean";

          const isMerchant =
            hasFullFlags
              ? Boolean(
                  item.isMerchant
                )
              : simpleKeep === true;

          const industryMatch =
            hasFullFlags
              ? Boolean(
                  item.industryMatch
                )
              : simpleKeep === true;

          const isContentSite =
            hasFullFlags
              ? Boolean(
                  item.isContentSite
                )
              : simpleKeep === false;

          const keep =
            hasFullFlags
              ? (
                  isMerchant &&
                  industryMatch &&
                  !isContentSite
                )
              : simpleKeep !== null
                ? simpleKeep
                : true;

          return {
            url: lead.url,
            aiReviewed:
              hasFullFlags ||
              simpleKeep !== null,
            keep,
            isMerchant,
            industryMatch,
            isContentSite,
            priority:
              item.priority === "A" ||
              item.priority === "B" ||
              item.priority === "C"
                ? item.priority
                : keep
                  ? "B"
                  : "C",
            businessType:
              safeText(
                item.businessType,
                100
              ) ||
              (
                keep
                  ? "目標產業商戶"
                  : "非目標商戶"
              ),
            opportunity:
              safeText(
                item.opportunity,
                100
              ) || "待確認",
            suggestedOwner:
              safeText(
                item.suggestedOwner,
                100
              ) || "待確認",
            reason:
              safeText(
                item.reason,
                150
              ) || "AI 未提供理由",
          } satisfies AiLeadDecision;
        });

      decisions.push(
        ...batchDecisions
      );

      console.log(
        `✅ AI Judge batch ${Math.floor(startIndex / BATCH_SIZE) + 1}/${Math.ceil(limited.length / BATCH_SIZE)} [${provider}]:`,
        {
          input: batch.length,
          reviewed:
            batchDecisions.filter(
              (item) =>
                item.aiReviewed
            ).length,
          kept:
            batchDecisions.filter(
              (item) =>
                item.keep
            ).length,
        }
      );
    } catch (error) {
      console.error(
        `⚠️ AI Judge batch ${Math.floor(startIndex / BATCH_SIZE) + 1} fallback:`,
        error
      );

      decisions.push(
        ...batch.map(
          fallbackDecision
        )
      );

    }
  }

  if (
    leads.length >
    limited.length
  ) {
    decisions.push(
      ...leads
        .slice(
          limited.length
        )
        .map(
          fallbackDecision
        )
    );
  }

  return decisions;
}

