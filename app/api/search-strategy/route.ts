import { NextResponse } from "next/server";

// ============================================================
// PayLead Finder
// AI Search Strategy API
//
// 功能：
// 使用者輸入一個開發方向
//
// 例如：
// 寵物
//
// AI 自動產生：
// 1. 產業概念
// 2. 商戶關鍵字
// 3. 金流關鍵字
// 4. POS 關鍵字
// 5. 多組搜尋 Query
//
// 前端之後拿 searchQueries 去搜尋
// 再把搜尋結果丟給 Website Analyzer API
// ============================================================

const OPENAI_API_URL =
    "https://api.openai.com/v1/responses";

// ============================================================
// POST
// ============================================================

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const keyword = String(
            body.keyword || ""
        ).trim();

        if (!keyword) {
            return NextResponse.json(
                {
                    success: false,
                    error: "請輸入產業或關鍵字",
                },
                {
                    status: 400,
                }
            );
        }

        const apiKey =
            process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "尚未設定 OPENAI_API_KEY",
                },
                {
                    status: 500,
                }
            );
        }

        // ====================================================
        // AI Prompt
        // ====================================================

        const prompt = `
你是一名台灣 B2B 商務開發顧問。

你的任務是協助「全支付」尋找潛在商戶。

使用者輸入的開發方向：

${keyword}

你的工作不是單純解釋這個產業。

你必須把這個產業拆成「可以拿去搜尋真實商戶網站」的多組搜尋方向。

請從以下角度思考：

1. 線上購物
2. 線上付款
3. 預約
4. 會員
5. 訂閱
6. 月費
7. 儲值
8. 線下門市
9. 分店
10. 實體據點
11. POS
12. 停車
13. 電動車充電
14. 票券
15. 租賃
16. 共享服務
17. APP
18. 電商
19. B2B
20. B2C
21. 生活服務
22. 連鎖品牌
23. 新興服務

--------------------------------------------------
重要：
不要只產生原始產業名稱。
--------------------------------------------------

例如：

使用者輸入：

電動車充電

你應該想到：

充電樁
電動車充電站
EV charging
充電服務
充電站營運商
智慧充電
充電 APP
充電會員
充電付款
停車充電
新能源服務
充電網路
電動車能源服務
電動車充電平台

--------------------------------------------------

如果使用者輸入：

寵物

應該想到：

寵物用品
寵物食品
寵物店
寵物美容
寵物旅館
寵物醫院
寵物訓練
寵物電商
寵物品牌
寵物用品店
寵物服務
寵物會員
寵物預約
寵物線上商城

--------------------------------------------------

如果使用者輸入：

美容

應該想到：

美容SPA
美容院
美髮沙龍
髮廊
美甲
美睫
美容診所
醫美
美容工作室
美容預約
美容會員
美容連鎖
美容品牌

--------------------------------------------------

你要找的是「真正可能成為全支付商戶」的網站。

因此要優先：

- 有商品
- 有服務
- 有價格
- 有訂單
- 有預約
- 有會員
- 有 APP
- 有付款
- 有門市
- 有分店
- 有 POS
- 有線上交易
- 有實體交易

--------------------------------------------------
必須排除：
--------------------------------------------------

新聞
媒體
雜誌
部落格
Blog
論壇
討論區
百科
Wikipedia
評論
政府網站
政府機關
學校
大學
研究機構
純資訊網站
純內容網站
新聞報導
新聞媒體
社群平台
大型 marketplace
Shopee
MOMO
PChome
蝦皮
露天

不要把這些網站當成潛在商戶。

--------------------------------------------------
merchantKeywords
--------------------------------------------------

產生可以找到「商戶」的搜尋關鍵字。

例如：

寵物用品
寵物用品店
寵物品牌
寵物電商
寵物美容
寵物旅館

--------------------------------------------------
paymentKeywords
--------------------------------------------------

產生跟金流、交易、付款有關的搜尋詞。

例如：

線上付款
線上購物
會員
預約
訂購
購物車
結帳
付款
APP
訂閱

--------------------------------------------------
physicalKeywords
--------------------------------------------------

產生實體 POS / 門市相關搜尋詞。

例如：

門市
分店
實體店
據點
旗艦店
連鎖店
店家
營業據點
POS

--------------------------------------------------
searchQueries
--------------------------------------------------

這是最重要的部分。

必須產生「可以直接拿去 Google / DuckDuckGo 搜尋」的完整搜尋語句。

例如：

寵物用品 台灣
寵物用品店 台灣
寵物品牌 台灣
寵物美容 台灣
寵物旅館 台灣
寵物電商 台灣
寵物食品品牌 台灣
寵物店 門市 台灣
寵物美容 預約 台灣
寵物用品 線上購物 台灣

不要全部都是相同結構。

應該涵蓋：

- 商戶
- 品牌
- 電商
- 門市
- 連鎖
- 預約
- APP
- 會員
- 服務
- POS
- 線上付款

--------------------------------------------------
輸出格式
--------------------------------------------------

只能輸出 JSON。

格式：

{
    "industry": "原始產業",

    "concepts": [
        "產業概念1",
        "產業概念2"
    ],

    "merchantKeywords": [
        "商戶關鍵字1",
        "商戶關鍵字2"
    ],

    "paymentKeywords": [
        "金流關鍵字1",
        "金流關鍵字2"
    ],

    "physicalKeywords": [
        "線下關鍵字1",
        "線下關鍵字2"
    ],

    "searchQueries": [
        "搜尋語句1",
        "搜尋語句2"
    ]
}

--------------------------------------------------
數量限制
--------------------------------------------------

concepts：最多 12 個

merchantKeywords：最多 25 個

paymentKeywords：最多 20 個

physicalKeywords：最多 20 個

searchQueries：最多 30 個

至少產生：

concepts：6 個
merchantKeywords：10 個
paymentKeywords：6 個
physicalKeywords：5 個
searchQueries：15 個

searchQueries 必須是真正可以搜尋網站的語句。

不要加入說明文字。

只輸出 JSON。
`;

        // ====================================================
        // OpenAI
        // ====================================================

        const response = await fetch(
            OPENAI_API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${apiKey}`,
                },

                body: JSON.stringify({
                    model: "gpt-5-mini",

                    input: prompt,
                }),
            }
        );

        // ====================================================
        // OpenAI Error
        // ====================================================

        if (!response.ok) {
            const errorText =
                await response.text();

            console.error(
                "OpenAI Error:",
                errorText
            );

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "AI 搜尋策略產生失敗",
                },
                {
                    status: 500,
                }
            );
        }

        const data =
            await response.json();

        // ====================================================
        // output_text
        // ====================================================

        const outputText =
            data.output_text || "";

        if (!outputText) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "AI 沒有產生搜尋策略",
                },
                {
                    status: 500,
                }
            );
        }

        // ====================================================
        // 清理 JSON
        // ====================================================

        let cleaned =
            outputText
                .trim()
                .replace(
                    /^```json\s*/i,
                    ""
                )
                .replace(
                    /^```\s*/i,
                    ""
                )
                .replace(
                    /\s*```$/i,
                    ""
                )
                .trim();

        // ====================================================
        // JSON Parse
        // ====================================================

        let strategy: any;

        try {
            strategy =
                JSON.parse(cleaned);
        } catch (error) {
            console.error(
                "AI JSON Parse Error:",
                cleaned
            );

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "AI 搜尋策略格式錯誤",
                },
                {
                    status: 500,
                }
            );
        }

        // ====================================================
        // 安全整理
        // ====================================================

        strategy = {
            industry:
                typeof strategy.industry ===
                "string"
                    ? strategy.industry
                    : keyword,

            concepts:
                Array.isArray(
                    strategy.concepts
                )
                    ? strategy.concepts
                        .filter(
                            (x: unknown) =>
                                typeof x ===
                                "string"
                        )
                        .slice(0, 12)
                    : [],

            merchantKeywords:
                Array.isArray(
                    strategy.merchantKeywords
                )
                    ? strategy.merchantKeywords
                        .filter(
                            (x: unknown) =>
                                typeof x ===
                                "string"
                        )
                        .slice(0, 25)
                    : [],

            paymentKeywords:
                Array.isArray(
                    strategy.paymentKeywords
                )
                    ? strategy.paymentKeywords
                        .filter(
                            (x: unknown) =>
                                typeof x ===
                                "string"
                        )
                        .slice(0, 20)
                    : [],

            physicalKeywords:
                Array.isArray(
                    strategy.physicalKeywords
                )
                    ? strategy.physicalKeywords
                        .filter(
                            (x: unknown) =>
                                typeof x ===
                                "string"
                        )
                        .slice(0, 20)
                    : [],

            searchQueries:
                Array.isArray(
                    strategy.searchQueries
                )
                    ? strategy.searchQueries
                        .filter(
                            (x: unknown) =>
                                typeof x ===
                                "string"
                        )
                        .slice(0, 30)
                    : [],
        };

        console.log(
            "🤖 AI Search Strategy:",
            strategy
        );

        // ====================================================
        // Response
        // ====================================================

        return NextResponse.json({
            success: true,
            ...strategy,
        });

    } catch (error) {
        console.error(
            "❌ Search Strategy Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "AI 搜尋策略發生錯誤",
            },
            {
                status: 500,
            }
        );
    }
}