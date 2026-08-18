import { NextResponse } from "next/server";

// ============================================================
// 公益分類
// ============================================================

const charityCategories = [
    {
        name: "動物／流浪動物",
        keywords: [
            "動物",
            "流浪動物",
            "犬",
            "貓",
            "毛孩",
            "寵物",
            "動保",
            "動物保護",
            "animal",
            "dog",
            "cat",
            "pet",
        ],
    },

    {
        name: "失智／認知障礙",
        keywords: [
            "失智",
            "認知障礙",
            "阿茲海默",
            "失智症",
            "長照",
            "dementia",
            "alzheimer",
        ],
    },

    {
        name: "長者／老人福利",
        keywords: [
            "老人",
            "長者",
            "高齡",
            "銀髮",
            "老人福利",
            "長輩",
            "elderly",
            "senior",
        ],
    },

    {
        name: "兒童／青少年",
        keywords: [
            "兒童",
            "孩童",
            "青少年",
            "少年",
            "兒少",
            "弱勢兒童",
            "兒童福利",
            "child",
            "children",
            "youth",
        ],
    },

    {
        name: "身心障礙",
        keywords: [
            "身心障礙",
            "身障",
            "障礙",
            "智能障礙",
            "視障",
            "聽障",
            "肢體障礙",
            "disability",
        ],
    },

    {
        name: "醫療／疾病",
        keywords: [
            "醫療",
            "疾病",
            "癌症",
            "罕見疾病",
            "病友",
            "醫院",
            "健康",
            "醫學",
            "medical",
            "cancer",
            "health",
        ],
    },

    {
        name: "教育",
        keywords: [
            "教育",
            "助學",
            "獎學金",
            "學童",
            "學生",
            "偏鄉教育",
            "教育基金",
            "education",
            "scholarship",
        ],
    },

    {
        name: "環境／生態",
        keywords: [
            "環境",
            "生態",
            "保育",
            "自然",
            "海洋",
            "森林",
            "氣候",
            "環保",
            "environment",
            "ecology",
            "conservation",
        ],
    },

    {
        name: "社會福利",
        keywords: [
            "社會福利",
            "弱勢",
            "社福",
            "貧困",
            "弱勢家庭",
            "社會救助",
            "公益",
            "社會服務",
            "social welfare",
        ],
    },

    {
        name: "災害救助",
        keywords: [
            "災害",
            "救災",
            "災民",
            "賑災",
            "地震",
            "颱風",
            "水災",
            "災區",
            "disaster",
            "relief",
        ],
    },

    {
        name: "國際援助",
        keywords: [
            "國際援助",
            "海外援助",
            "國際救援",
            "難民",
            "人道援助",
            "international",
            "humanitarian",
            "refugee",
        ],
    },

    {
        name: "婦女／家庭",
        keywords: [
            "婦女",
            "女性",
            "家庭",
            "單親",
            "家暴",
            "性別",
            "女性權益",
            "women",
            "family",
        ],
    },

    {
        name: "青少年／青年培力",
        keywords: [
            "青年",
            "青年培力",
            "青年發展",
            "青少年培力",
            "teen",
            "teenager",
        ],
    },

    {
        name: "心理健康",
        keywords: [
            "心理",
            "心理健康",
            "心理支持",
            "心理諮商",
            "精神健康",
            "mental health",
            "mental",
        ],
    },
];

// ============================================================
// HTML 清理
// ============================================================

function cleanHtml(html: string) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// ============================================================
// HTML Entity
// ============================================================

function decodeHtml(text: string) {
    return text
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&nbsp;/gi, " ");
}

// ============================================================
// URL 標準化
// ============================================================

function normalizeUrl(url: string) {
    let value = url.trim();

    if (!/^https?:\/\//i.test(value)) {
        value = `https://${value}`;
    }

    try {
        const parsed = new URL(value);

        return (
            parsed.protocol +
            "//" +
            parsed.hostname +
            (parsed.port ? `:${parsed.port}` : "")
        );
    } catch {
        return value;
    }
}

// ============================================================
// 組織名稱
// ============================================================

function detectOrganizationName(
    html: string,
    url: string
) {
    const ogSiteName = html.match(
        /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
    );

    if (ogSiteName?.[1]) {
        return decodeHtml(ogSiteName[1]).trim();
    }

    const applicationName = html.match(
        /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i
    );

    if (applicationName?.[1]) {
        return decodeHtml(applicationName[1]).trim();
    }

    const title = html.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
    );

    if (title?.[1]) {
        const titleText = decodeHtml(title[1])
            .replace(/\s+/g, " ")
            .trim();

        if (
            titleText.length >= 2 &&
            titleText.length <= 120
        ) {
            return titleText;
        }
    }

    try {
        return new URL(url)
            .hostname
            .replace(/^www\./i, "")
            .split(".")[0]
            .replace(/[-_]/g, " ");
    } catch {
        return "未知公益組織";
    }
}

// ============================================================
// 公益分類
// ============================================================

function detectCharityCategory(text: string) {
    const lowerText = text.toLowerCase();

    const matchedCategories: {
        name: string;
        score: number;
    }[] = [];

    for (const category of charityCategories) {
        let score = 0;

        for (const keyword of category.keywords) {
            const keywordLower = keyword.toLowerCase();

            if (lowerText.includes(keywordLower)) {
                score += keyword.length >= 4 ? 3 : 1;
            }
        }

        if (score > 0) {
            matchedCategories.push({
                name: category.name,
                score,
            });
        }
    }

    matchedCategories.sort(
        (a, b) => b.score - a.score
    );

    return {
        primary:
            matchedCategories[0]?.name ||
            "公益組織",

        categories:
            matchedCategories
                .slice(0, 3)
                .map(item => item.name),

        scores: matchedCategories,
    };
}

// ============================================================
// 線上捐款
// ============================================================

function detectDonation(text: string) {
    const lowerText = text.toLowerCase();

    const donationKeywords = [
        "線上捐款",
        "線上捐贈",
        "立即捐款",
        "我要捐款",
        "愛心捐款",
        "捐款",
        "捐贈",
        "支持我們",
        "支持我們的工作",
        "donate",
        "donation",
        "give now",
    ];

    const recurringKeywords = [
        "定期捐款",
        "定期定額",
        "每月捐款",
        "月捐",
        "定期捐贈",
        "每月支持",
        "monthly donation",
        "recurring donation",
        "monthly giving",
    ];

    const donationSignals =
        donationKeywords.filter(keyword =>
            lowerText.includes(
                keyword.toLowerCase()
            )
        );

    const recurringSignals =
        recurringKeywords.filter(keyword =>
            lowerText.includes(
                keyword.toLowerCase()
            )
        );

    return {
        hasOnlineDonation:
            donationSignals.length > 0,

        hasRecurringDonation:
            recurringSignals.length > 0,

        signals: [
            ...donationSignals,
            ...recurringSignals,
        ].slice(0, 10),
    };
}

// ============================================================
// 實體據點
//
// 不只抓「地址」
// 同時抓：
// 門市、服務據點、中心、院區、分院、服務站等
// ============================================================

function detectPhysicalStore(text: string) {
    const lowerText = text.toLowerCase();

    const keywords = [
        "服務據點",
        "服務中心",
        "服務站",
        "服務處",
        "辦事處",
        "分會",
        "分院",
        "院區",
        "中心",
        "門市",
        "店面",
        "據點",
        "地址",
        "聯絡地址",
        "營業地址",
        "服務地址",
        "contact us",
        "location",
        "office",
        "center",
        "branch",
        "store",
    ];

    const signals = keywords.filter(keyword =>
        lowerText.includes(
            keyword.toLowerCase()
        )
    );

    return {
        hasPhysicalStore:
            signals.length >= 1,

        signals: signals.slice(0, 10),
    };
}

// ============================================================
// 勸募字號
//
// 這裡不只是判斷有沒有「勸募」
// 而是實際嘗試抓出：
// 衛部救字第XXXXXXXX號
// 府社字第XXXXXXXX號
// 勸募許可字號 XXXXX
// ============================================================

function detectFundraising(text: string) {
    const normalized = text
        .replace(/\s+/g, " ")
        .trim();

    const signals: string[] = [];

    const keywordPatterns = [
        "勸募字號",
        "勸募許可",
        "勸募核准",
        "勸募文號",
        "公益勸募",
        "勸募活動",
        "募款許可",
        "募款期間",
        "勸募期間",
    ];

    for (const keyword of keywordPatterns) {
        if (
            normalized
                .toLowerCase()
                .includes(keyword.toLowerCase())
        ) {
            signals.push(keyword);
        }
    }

    // --------------------------------------------------------
    // 常見台灣勸募文號格式
    // --------------------------------------------------------

    const numberPatterns = [
        /衛部救字第[^\s，。,、；;]{2,40}/i,
        /衛部救字[^\s，。,、；;]{2,40}/i,
        /衛授救字第[^\s，。,、；;]{2,40}/i,
        /府社字第[^\s，。,、；;]{2,40}/i,
        /府社[^\s，。,、；;]{2,40}/i,
        /勸募許可字號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
        /勸募字號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
        /勸募核准文號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
        /勸募文號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
    ];

    let fundraisingNumber = "";

    for (const pattern of numberPatterns) {
        const match = normalized.match(pattern);

        if (match?.[0]) {
            fundraisingNumber = match[0]
                .replace(/\s+/g, " ")
                .trim();

            break;
        }
    }

    // --------------------------------------------------------
    // 有勸募相關關鍵字，但沒有抓到號碼
    // --------------------------------------------------------

    const hasFundraisingInfo =
        !!fundraisingNumber ||
        signals.length > 0;

    return {
        hasFundraisingInfo,

        fundraisingNumber,

        signals: signals.slice(0, 10),
    };
}

// ============================================================
// 全支付偵測
// ============================================================

function detectFullPay(text: string) {
    const lowerText = text.toLowerCase();

    const keywords = [
        "全支付",
        "全+pay",
        "全+支付",
        "pxpay+",
        "px pay+",
        "pxpay plus",
        "px pay plus",
        "全支付付款",
        "全支付支付",
        "使用全支付",
        "全支付捐款",
        "全支付捐贈",
    ];

    const signals = keywords.filter(keyword =>
        lowerText.includes(
            keyword.toLowerCase()
        )
    );

    return {
        hasFullPay:
            signals.length > 0,

        signals: signals.slice(0, 10),
    };
}

// ============================================================
// Payment Score
//
// 分數不是「付款金額」
// 是開發價值指標
// ============================================================

function calculatePaymentScore(
    donation: boolean,
    recurring: boolean,
    fundraising: boolean
) {
    let score = 0;

    if (donation) {
        score += 10;
    }

    if (recurring) {
        score += 8;
    }

    if (fundraising) {
        score += 5;
    }

    return Math.min(score, 30);
}

// ============================================================
// Physical Score
// ============================================================

function calculatePhysicalScore(
    physicalStore: boolean
) {
    if (physicalStore) {
        return 10;
    }

    return 0;
}

// ============================================================
// Confidence
// ============================================================

function calculateConfidence(
    categoryCount: number,
    donation: boolean,
    recurring: boolean,
    fundraising: boolean,
    physicalStore: boolean
) {
    let confidence = 45;

    if (categoryCount > 0) {
        confidence += 15;
    }

    if (donation) {
        confidence += 12;
    }

    if (recurring) {
        confidence += 8;
    }

    if (fundraising) {
        confidence += 10;
    }

    if (physicalStore) {
        confidence += 8;
    }

    return Math.min(
        confidence,
        98
    );
}

// ============================================================
// 開發建議
// ============================================================

function getRecommendation({
    donation,
    recurring,
    fundraising,
    physicalStore,
    fullPay,
}: {
    donation: boolean;
    recurring: boolean;
    fundraising: boolean;
    physicalStore: boolean;
    fullPay: boolean;
}) {
    if (fullPay) {
        return "官網已偵測到全支付相關資訊，建議確認既有合作狀態後再進一步開發。";
    }

    const recommendations: string[] = [];

    if (donation) {
        recommendations.push(
            "網站已有線上捐款需求，可優先洽談 EC／APP 捐款金流合作。"
        );
    }

    if (recurring) {
        recommendations.push(
            "網站具有定期捐款需求，可進一步洽談定期扣款與會員型金流。"
        );
    }

    if (fundraising) {
        recommendations.push(
            "網站具有公益勸募資訊，可確認勸募資格及 APP 捐款專區合作可能性。"
        );
    }

    if (physicalStore) {
        recommendations.push(
            "網站具有實體服務據點，可進一步確認現場收款、POS 或其他支付需求。"
        );
    }

    if (
        recommendations.length === 0
    ) {
        return "目前尚未偵測到明確合作訊號，建議進一步確認線上捐款、會員、定期捐款、實體據點或收費流程。";
    }

    return recommendations.join(" ");
}

// ============================================================
// POST
// ============================================================

export async function POST(
    req: Request
) {
    try {
        const body = await req.json();

        const rawUrl =
            body?.url?.trim();

        if (!rawUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: "請輸入公益組織網址",
                },
                {
                    status: 400,
                }
            );
        }

        const url =
            normalizeUrl(rawUrl);

        console.log(
            "🏛️ 開始公益分析：",
            url
        );

        // ====================================================
        // 抓網站
        // ====================================================

        const response =
            await fetch(
                url,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

                        "Accept":
                            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                        "Accept-Language":
                            "zh-TW,zh;q=0.9,en;q=0.8",
                    },

                    redirect: "follow",

                    signal:
                        AbortSignal.timeout(
                            15000
                        ),
                }
            );

        if (!response.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        `網站無法讀取 HTTP ${response.status}`,
                    url,
                },
                {
                    status: 400,
                }
            );
        }

        const html =
            await response.text();

        const text =
            cleanHtml(html);

        console.log(
            "📄 HTML 長度：",
            html.length
        );

        console.log(
            "📄 純文字長度：",
            text.length
        );

        // ====================================================
        // 名稱
        // ====================================================

        const organizationName =
            detectOrganizationName(
                html,
                url
            );

        // ====================================================
        // 類別
        // ====================================================

        const categoryResult =
            detectCharityCategory(
                text
            );

        // ====================================================
        // 捐款
        // ====================================================

        const donation =
            detectDonation(
                text
            );

        // ====================================================
        // 實體據點
        // ====================================================

        const physical =
            detectPhysicalStore(
                text
            );

        // ====================================================
        // 勸募
        // ====================================================

        const fundraising =
            detectFundraising(
                text
            );

        // ====================================================
        // 全支付
        // ====================================================

        const fullPay =
            detectFullPay(
                text
            );

        // ====================================================
        // Score
        // ====================================================

        const paymentScore =
            calculatePaymentScore(
                donation.hasOnlineDonation,
                donation.hasRecurringDonation,
                fundraising.hasFundraisingInfo
            );

        const physicalScore =
            calculatePhysicalScore(
                physical.hasPhysicalStore
            );

        // ====================================================
        // Confidence
        // ====================================================

        const confidence =
            calculateConfidence(
                categoryResult.categories.length,
                donation.hasOnlineDonation,
                donation.hasRecurringDonation,
                fundraising.hasFundraisingInfo,
                physical.hasPhysicalStore
            );

        // ====================================================
        // 建議
        // ====================================================

        const recommendation =
            getRecommendation({
                donation:
                    donation.hasOnlineDonation,

                recurring:
                    donation.hasRecurringDonation,

                fundraising:
                    fundraising.hasFundraisingInfo,

                physicalStore:
                    physical.hasPhysicalStore,

                fullPay:
                    fullPay.hasFullPay,
            });

        // ====================================================
        // 合作切入點
        // ====================================================

        const cooperation: string[] = [];

        if (
            donation.hasOnlineDonation
        ) {
            cooperation.push(
                "線上捐款"
            );
        }

        if (
            physical.hasPhysicalStore
        ) {
            cooperation.push(
                "實體據點"
            );
        }

        // ====================================================
        // 最終結果
        //
        // 注意：
        // 這裡刻意直接提供前端需要的欄位
        // ====================================================

        const result = {
            success: true,

            type: "charity",

            url,

            website: url,

            organizationName,

            name: organizationName,

            // ------------------------------------------------
            // 類別
            // ------------------------------------------------

            category:
                categoryResult.primary,

            categories:
                categoryResult.categories,

            categoryScores:
                categoryResult.scores,

            // ------------------------------------------------
            // 平台
            //
            // 公益網站不一定有開店平台
            // 因此不再顯示 Unknown
            // ------------------------------------------------

            platform: "",

            confidence,

            // ------------------------------------------------
            // 線上捐款
            // ------------------------------------------------

            onlineDonation:
                donation.hasOnlineDonation,

            donation:
                donation.hasOnlineDonation,

            recurringDonation:
                donation.hasRecurringDonation,

            donationSignals:
                donation.signals,

            // ------------------------------------------------
            // 實體據點
            // ------------------------------------------------

            physicalStore: {
                hasPhysicalStore:
                    physical.hasPhysicalStore,

                signals:
                    physical.signals,
            },

            hasPhysicalStore:
                physical.hasPhysicalStore,

            // ------------------------------------------------
            // 勸募
            // ------------------------------------------------

            fundraisingNumber:
                fundraising.fundraisingNumber,

            fundraisingNo:
                fundraising.fundraisingNumber,

            solicitationNumber:
                fundraising.fundraisingNumber,

            fundraising: {
                hasFundraisingInfo:
                    fundraising.hasFundraisingInfo,

                fundraisingNumber:
                    fundraising.fundraisingNumber,

                signals:
                    fundraising.signals,
            },

            // ------------------------------------------------
            // Score
            // ------------------------------------------------

            paymentScore,

            physicalScore,

            // ------------------------------------------------
            // 合作
            // ------------------------------------------------

            cooperation,

            // ------------------------------------------------
            // 全支付
            // ------------------------------------------------

            fullPay: {
                hasFullPay:
                    fullPay.hasFullPay,

                signals:
                    fullPay.signals,

                excludeFromSearch:
                    fullPay.hasFullPay,
            },

            // ------------------------------------------------
            // 開發建議
            // ------------------------------------------------

            recommendation,

            // ------------------------------------------------
            // Evidence
            // ------------------------------------------------

            evidence: [
                ...donation.signals,
                ...physical.signals,
                ...fundraising.signals,
            ].slice(0, 20),

            // ------------------------------------------------
            // Debug
            // ------------------------------------------------

            debug: {
                htmlLength:
                    html.length,

                textLength:
                    text.length,

                finalUrl:
                    response.url ||
                    url,
            },
        };

        console.log(
            "===================================="
        );

        console.log(
            "🏛️ 公益分析結果"
        );

        console.log(
            "組織：",
            organizationName
        );

        console.log(
            "類別：",
            categoryResult.primary
        );

        console.log(
            "線上捐款：",
            donation.hasOnlineDonation
        );

        console.log(
            "定期捐款：",
            donation.hasRecurringDonation
        );

        console.log(
            "實體據點：",
            physical.hasPhysicalStore
        );

        console.log(
            "勸募字號：",
            fundraising.fundraisingNumber
        );

        console.log(
            "Payment Score：",
            paymentScore
        );

        console.log(
            "Physical Score：",
            physicalScore
        );

        console.log(
            "合作切入點：",
            cooperation
        );

        console.log(
            "===================================="
        );

        return NextResponse.json(
            result
        );

    } catch (error) {
        console.error(
            "❌ Charity API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,

                error:
                    error instanceof Error
                        ? error.message
                        : "公益網站分析失敗",
            },
            {
                status: 500,
            }
        );
    }
}