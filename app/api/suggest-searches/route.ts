import { NextResponse } from "next/server";

const fallbackSuggestions = [
    "電動車充電",
    "停車場",
    "自助洗車",
    "健身房",
    "寵物美容",
    "美容美髮",
    "服飾品牌",
    "家具家居",
    "眼鏡行",
    "3C 電子產品",
    "汽車保養",
    "機車服務",
];

function cleanSuggestions(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) =>
            String(item || "")
                .trim()
                .replace(/^[-•*\d.、)\s]+/, "")
        )
        .filter((item) =>
            item.length >= 2 &&
            item.length <= 30
        )
        .filter(
            (item, index, array) =>
                array.indexOf(item) === index
        )
        .slice(0, 12);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const currentKeyword =
            String(body.currentKeyword || "").trim();

        const previousSuggestions =
            cleanSuggestions(
                body.previousSuggestions
            );

        const apiKey =
            process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                success: true,
                suggestions: fallbackSuggestions,
                source: "fallback",
            });
        }

        const prompt = `
你是一名「全支付商務開發市場情報助手」。

你的任務不是推薦熱門產業，而是幫業務人員找出「可能存在金流需求、值得開發的商業領域」。

請產生 12 個適合拿來搜尋潛在商戶的產業／商業領域。

請特別思考以下金流情境：

1. 線上購物
2. 線上付款
3. 預約
4. 訂金
5. 會員
6. 訂閱
7. 月費
8. POS
9. QR Code 支付
10. 分店
11. 自助服務
12. 新興商業模式

不要全部都是傳統電商。

可以包含：
零售、服務業、能源、交通、生活服務、娛樂、教育、醫療周邊、運動、旅遊、寵物、汽車、機車、餐飲、住宿、共享經濟、新創商業模式等。

請主動探索一般業務人員容易忽略的產業。

不要產生：
- 新聞
- 媒體
- 雜誌
- 股票
- 金融新聞
- 社群平台
- 搜尋引擎
- 大型電商平台本身
- 人力銀行
- 政府網站

目前搜尋關鍵字：
${currentKeyword || "無"}

上一批建議：
${previousSuggestions.join("、") || "無"}

請盡量避免與上一批重複。

只回傳 JSON，不要加 Markdown。

格式：

{
  "suggestions": [
    "產業1",
    "產業2",
    "產業3"
  ]
}
`;

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },

                body: JSON.stringify({
                    model:
                        process.env.OPENAI_MODEL ||
                        "gpt-4o-mini",

                    input: prompt,

                    temperature: 1,
                }),
            }
        );

        if (!response.ok) {
            console.error(
                "OpenAI Error:",
                await response.text()
            );

            return NextResponse.json({
                success: true,
                suggestions: fallbackSuggestions,
                source: "fallback",
            });
        }

        const data = await response.json();

        const outputText =
            data.output
                ?.flatMap(
                    (item: any) =>
                        item.content || []
                )
                ?.map(
                    (item: any) =>
                        item.text || ""
                )
                ?.join("")
                ?.trim() || "";

        let parsed: any = null;

        try {
            parsed = JSON.parse(outputText);
        } catch {
            const jsonMatch =
                outputText.match(
                    /\{[\s\S]*\}/
                );

            if (jsonMatch) {
                try {
                    parsed = JSON.parse(
                        jsonMatch[0]
                    );
                } catch {
                    parsed = null;
                }
            }
        }

        const suggestions =
            cleanSuggestions(
                parsed?.suggestions
            );

        if (!suggestions.length) {
            return NextResponse.json({
                success: true,
                suggestions: fallbackSuggestions,
                source: "fallback",
            });
        }

        return NextResponse.json({
            success: true,
            suggestions,
            source: "ai",
        });

    } catch (error) {
        console.error(
            "Suggest Search Error:",
            error
        );

        return NextResponse.json({
            success: true,
            suggestions: fallbackSuggestions,
            source: "fallback",
        });
    }
}