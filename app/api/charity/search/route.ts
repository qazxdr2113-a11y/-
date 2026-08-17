import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Type
// ============================================================

type DonationResult = {
    online: boolean;
    recurring: boolean;
    methods: string[];
};

type PhysicalResult = {
    hasPhysicalStore: boolean;
    signals: string[];
};

type FundraisingResult = {
    hasFundraisingInfo: boolean;
    signals: string[];
    number?: string;
};

type CharityAnalysis = {
    organizationName: string;
    url: string;

    categories: string[];

    donation: DonationResult;

    physicalStore: PhysicalResult;

    fundraising: FundraisingResult;

    fullPay: {
        hasFullPay: boolean;
        signals: string[];
    };

    paymentScore: number;
    physicalScore: number;

    confidence: number;

    cooperation: string[];

    recommendation: string;

    evidence: string[];
};

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
            "兒少福利",
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
            "身障者",
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
            "醫療照護",
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
            "教育公益",
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
            "環境保護",
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
            "社會關懷",
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
    if (!url) return "";

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
        return "";
    }
}

// ============================================================
// 偵測網站名稱
// ============================================================

function detectOrganizationName(
    html: string,
    url: string
) {
    const ogSiteName = html.match(
        /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
    );

    if (ogSiteName?.[1]) {
        return decodeHtml(
            ogSiteName[1]
        ).trim();
    }

    const applicationName = html.match(
        /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i
    );

    if (applicationName?.[1]) {
        return decodeHtml(
            applicationName[1]
        ).trim();
    }

    const title = html.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
    );

    if (title?.[1]) {
        const titleText = decodeHtml(
            title[1]
        )
            .replace(/\s+/g, " ")
            .trim();

        if (
            titleText.length >= 2 &&
            titleText.length <= 150
        ) {
            return titleText;
        }
    }

    try {
        return new URL(url)
            .hostname
            .replace(/^www\./i, "");
    } catch {
        return "未知公益組織";
    }
}

// ============================================================
// 公益分類
// ============================================================

function detectCharityCategories(
    text: string
) {
    const lowerText =
        text.toLowerCase();

    const results: string[] = [];

    for (
        const category
        of charityCategories
    ) {
        const matched =
            category.keywords.some(
                keyword =>
                    lowerText.includes(
                        keyword.toLowerCase()
                    )
            );

        if (matched) {
            results.push(
                category.name
            );
        }
    }

    return results;
}

// ============================================================
// 捐款偵測
// ============================================================

function detectDonation(
    text: string
): DonationResult {

    const lowerText =
        text.toLowerCase();

    const donationKeywords = [
        "捐款",
        "捐贈",
        "支持我們",
        "支持我們的工作",
        "立即捐款",
        "線上捐款",
        "愛心捐款",
        "我要捐款",
        "線上捐贈",
        "立即支持",
        "donate",
        "donation",
    ];

    const recurringKeywords = [
        "定期捐款",
        "定期定額",
        "每月捐款",
        "月捐",
        "定期捐贈",
        "每月支持",
        "長期支持",
        "每月定期",
        "recurring donation",
        "monthly donation",
    ];

    const methods: string[] = [];

    const donationFound =
        donationKeywords.some(
            keyword =>
                lowerText.includes(
                    keyword.toLowerCase()
                )
        );

    const recurringFound =
        recurringKeywords.some(
            keyword =>
                lowerText.includes(
                    keyword.toLowerCase()
                )
        );

    if (donationFound) {
        methods.push(
            "線上捐款"
        );
    }

    if (recurringFound) {
        methods.push(
            "定期捐款"
        );
    }

    return {
        online: donationFound,
        recurring: recurringFound,
        methods,
    };
}

// ============================================================
// 實體據點偵測
// ============================================================

function detectPhysicalStore(
    text: string
): PhysicalResult {

    const lowerText =
        text.toLowerCase();

    const signals: string[] = [];

    const addressKeywords = [
        "地址",
        "聯絡地址",
        "服務地址",
        "服務據點",
        "據點",
        "服務中心",
        "中心",
        "分會",
        "辦事處",
        "門市",
        "店址",
        "營業地址",
        "location",
        "address",
        "office",
        "center",
    ];

    for (
        const keyword
        of addressKeywords
    ) {
        if (
            lowerText.includes(
                keyword.toLowerCase()
            )
        ) {
            signals.push(keyword);
        }
    }

    const phoneFound =
        /(?:0\d{1,2}[-\s]?\d{6,8})/.test(
            text
        );

    if (phoneFound) {
        signals.push(
            "電話資訊"
        );
    }

    const hasPhysical =
        signals.length >= 1;

    return {
        hasPhysicalStore:
            hasPhysical,
        signals:
            Array.from(
                new Set(signals)
            ).slice(0, 8),
    };
}

// ============================================================
// 勸募資訊
// ============================================================

function detectFundraising(
    text: string
): FundraisingResult {

    const lowerText =
        text.toLowerCase();

    const keywords = [
        "勸募字號",
        "勸募許可",
        "勸募核准",
        "衛部救字",
        "衛部救",
        "府社",
        "勸募活動",
        "勸募期間",
        "募款期間",
        "募款許可",
        "公益勸募",
        "勸募文號",
        "勸募許可文號",
        "公益勸募活動",
    ];

    const signals =
        keywords.filter(
            keyword =>
                lowerText.includes(
                    keyword.toLowerCase()
                )
        );

    // 嘗試抓常見勸募字號
    const numberMatch =
        text.match(
            /(?:衛部救字|衛部救|府社)[^\s，。,；;]{0,30}/i
        );

    return {
        hasFundraisingInfo:
            signals.length > 0 ||
            !!numberMatch,

        signals:
            signals.slice(0, 8),

        number:
            numberMatch?.[0]
                ?.trim(),
    };
}

// ============================================================
// 全支付偵測
// ============================================================

function detectFullPay(
    text: string
) {

    const lowerText =
        text.toLowerCase();

    const keywords = [
        "全支付",
        "全+pay",
        "全+支付",
        "pxpay+",
        "px pay+",
        "pxpay plus",
        "px pay plus",
        "plus pay",
        "全支付付款",
        "全支付支付",
        "使用全支付",
        "全支付捐款",
        "全支付捐贈",
    ];

    const signals =
        keywords.filter(
            keyword =>
                lowerText.includes(
                    keyword.toLowerCase()
                )
        );

    return {
        hasFullPay:
            signals.length > 0,

        signals:
            signals.slice(0, 10),
    };
}

// ============================================================
// Payment Score
// ============================================================

function calculatePaymentScore(
    donation: DonationResult
) {

    if (!donation.online) {
        return 0;
    }

    if (donation.recurring) {
        return 25;
    }

    return 18;
}

// ============================================================
// Physical Score
// ============================================================

function calculatePhysicalScore(
    physicalStore: PhysicalResult
) {

    if (
        physicalStore.hasPhysicalStore
    ) {
        return 10;
    }

    return 0;
}

// ============================================================
// 合作切入點
// ============================================================

function buildCooperation(
    donation: DonationResult,
    physicalStore: PhysicalResult
) {

    const cooperation: string[] = [];

    if (donation.online) {
        cooperation.push(
            "線上捐款"
        );
    }

    if (
        physicalStore.hasPhysicalStore
    ) {
        cooperation.push(
            "實體據點"
        );
    }

    return cooperation;
}

// ============================================================
// Recommendation
// ============================================================

function buildRecommendation(
    donation: DonationResult,
    physicalStore: PhysicalResult,
    fundraising: FundraisingResult,
    fullPay: {
        hasFullPay: boolean;
        signals: string[];
    }
) {

    if (fullPay.hasFullPay) {
        return (
            "官網已偵測到全支付相關資訊，" +
            "建議確認現有合作狀態，避免重複開發。"
        );
    }

    const recommendations: string[] = [];

    if (donation.online) {

        recommendations.push(
            "網站已有線上捐款需求，可優先洽談 EC／APP 捐款金流合作。"
        );

        if (donation.recurring) {

            recommendations.push(
                "網站具有定期捐款需求，可進一步洽談定期扣款與會員型金流。"
            );
        }
    }

    if (
        physicalStore.hasPhysicalStore
    ) {

        recommendations.push(
            "網站具有實體服務據點，可進一步確認現場收款、POS 或其他支付需求。"
        );
    }

    if (
        fundraising.hasFundraisingInfo
    ) {

        recommendations.push(
            "網站具有勸募相關資訊，可進一步確認 APP 捐款專區合作資格。"
        );
    }

    if (
        recommendations.length === 0
    ) {

        recommendations.push(
            "目前未偵測到明確線上交易或實體收款訊號，建議進一步確認付款、會員、捐款或服務收費流程。"
        );
    }

    return recommendations.join(" ");
}

// ============================================================
// Confidence
// ============================================================

function calculateConfidence(
    categories: string[],
    donation: DonationResult,
    physicalStore: PhysicalResult,
    fundraising: FundraisingResult
) {

    let confidence = 40;

    // 公益分類
    confidence += Math.min(
        categories.length * 8,
        24
    );

    // 線上捐款
    if (donation.online) {
        confidence += 12;
    }

    // 定期捐款
    if (donation.recurring) {
        confidence += 8;
    }

    // 實體據點
    if (
        physicalStore.hasPhysicalStore
    ) {
        confidence += 6;
    }

    // 勸募
    if (
        fundraising.hasFundraisingInfo
    ) {
        confidence += 8;
    }

    return Math.min(
        98,
        confidence
    );
}

// ============================================================
// Evidence
// ============================================================

function buildEvidence(
    categories: string[],
    donation: DonationResult,
    physicalStore: PhysicalResult,
    fundraising: FundraisingResult,
    fullPay: {
        hasFullPay: boolean;
        signals: string[];
    }
) {

    const evidence: string[] = [];

    if (categories.length > 0) {
        evidence.push(
            `公益分類：${categories.join("、")}`
        );
    }

    if (donation.online) {
        evidence.push(
            "偵測到線上捐款相關資訊"
        );
    }

    if (donation.recurring) {
        evidence.push(
            "偵測到定期／每月捐款資訊"
        );
    }

    if (
        physicalStore.hasPhysicalStore
    ) {
        evidence.push(
            `偵測到實體據點訊號：${physicalStore.signals.join("、")}`
        );
    }

    if (
        fundraising.hasFundraisingInfo
    ) {
        evidence.push(
            `偵測到勸募資訊：${fundraising.signals.join("、")}`
        );
    }

    if (fullPay.hasFullPay) {
        evidence.push(
            `偵測到全支付相關資訊：${fullPay.signals.join("、")}`
        );
    }

    return evidence;
}

// ============================================================
// 分析單一網站
// ============================================================

async function analyzeWebsite(
    rawUrl: string
): Promise<CharityAnalysis | null> {

    const url =
        normalizeUrl(rawUrl);

    if (!url) {
        return null;
    }

    try {

        console.log(
            "🌐 分析網站：",
            url
        );

        const response =
            await fetch(
                url,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

                        "Accept":
                            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    },

                    redirect: "follow",

                    cache: "no-store",

                    signal:
                        AbortSignal.timeout(
                            12000
                        ),
                }
            );

        if (!response.ok) {

            console.log(
                "⚠️ 網站 HTTP 錯誤：",
                url,
                response.status
            );

            return null;
        }

        const html =
            await response.text();

        if (!html) {
            return null;
        }

        const text =
            cleanHtml(html);

        // --------------------------------------------------------
        // 基本資訊
        // --------------------------------------------------------

        const organizationName =
            detectOrganizationName(
                html,
                url
            );

        // --------------------------------------------------------
        // 分類
        // --------------------------------------------------------

        const categories =
            detectCharityCategories(
                text
            );

        // --------------------------------------------------------
        // 捐款
        // --------------------------------------------------------

        const donation =
            detectDonation(
                text
            );

        // --------------------------------------------------------
        // 實體
        // --------------------------------------------------------

        const physicalStore =
            detectPhysicalStore(
                text
            );

        // --------------------------------------------------------
        // 勸募
        // --------------------------------------------------------

        const fundraising =
            detectFundraising(
                text
            );

        // --------------------------------------------------------
        // 全支付
        // --------------------------------------------------------

        const fullPay =
            detectFullPay(
                text
            );

        // --------------------------------------------------------
        // Score
        // --------------------------------------------------------

        const paymentScore =
            calculatePaymentScore(
                donation
            );

        const physicalScore =
            calculatePhysicalScore(
                physicalStore
            );

        // --------------------------------------------------------
        // 合作
        // --------------------------------------------------------

        const cooperation =
            buildCooperation(
                donation,
                physicalStore
            );

        // --------------------------------------------------------
        // 建議
        // --------------------------------------------------------

        const recommendation =
            buildRecommendation(
                donation,
                physicalStore,
                fundraising,
                fullPay
            );

        // --------------------------------------------------------
        // Confidence
        // --------------------------------------------------------

        const confidence =
            calculateConfidence(
                categories,
                donation,
                physicalStore,
                fundraising
            );

        // --------------------------------------------------------
        // Evidence
        // --------------------------------------------------------

        const evidence =
            buildEvidence(
                categories,
                donation,
                physicalStore,
                fundraising,
                fullPay
            );

        // --------------------------------------------------------
        // 結果
        // --------------------------------------------------------

        const result: CharityAnalysis = {

            organizationName,

            url,

            categories,

            donation,

            physicalStore,

            fundraising,

            fullPay,

            paymentScore,

            physicalScore,

            confidence,

            cooperation,

            recommendation,

            evidence,
        };

        console.log(
            "✅ 網站分析完成：",
            {
                url,
                categories,
                donation,
                physicalStore,
                paymentScore,
                physicalScore,
                confidence,
            }
        );

        return result;

    } catch (error) {

        console.error(
            "⚠️ 網站分析失敗：",
            url,
            error
        );

        // 單一網站失敗
        // 不影響其他網站

        return null;
    }
}

// ============================================================
// 排除網站
// ============================================================

const excludedDomains = [
    "google.com",
    "google.com.tw",
    "youtube.com",
    "facebook.com",
    "instagram.com",
    "threads.net",
    "twitter.com",
    "x.com",
    "wikipedia.org",

    "udn.com",
    "setn.com",
    "ettoday.net",
    "news.ltn.com.tw",
    "cna.com.tw",
    "yahoo.com",

    "shoplineapp.com",
    "shopify.com",
    "pchome.com.tw",
    "ruten.com.tw",

    "amazon.com",
    "momo.com.tw",
];

// ============================================================
// 判斷是否排除
// ============================================================

function isExcludedDomain(
    url: string
) {

    try {

        const hostname =
            new URL(url)
                .hostname
                .replace(
                    /^www\./,
                    ""
                );

        return excludedDomains.some(
            domain =>
                hostname === domain ||
                hostname.endsWith(
                    `.${domain}`
                )
        );

    } catch {

        return true;
    }
}

// ============================================================
// DuckDuckGo 搜尋
// ============================================================

async function searchDuckDuckGo(
    keyword: string
) {

    try {

        const response =
            await fetch(
                `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
                    keyword
                )}`,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0",
                    },

                    cache: "no-store",

                    signal:
                        AbortSignal.timeout(
                            10000
                        ),
                }
            );

        if (!response.ok) {

            console.log(
                "⚠️ DuckDuckGo 搜尋失敗：",
                response.status
            );

            return [];
        }

        const html =
            await response.text();

        const urls: string[] = [];

        // --------------------------------------------------------
        // uddg
        // --------------------------------------------------------

        const matches =
            html.match(
                /uddg=([^"&]+)/g
            ) || [];

        for (
            const match
            of matches
        ) {

            try {

                const encoded =
                    match.replace(
                        "uddg=",
                        ""
                    );

                const decoded =
                    decodeURIComponent(
                        encoded
                    );

                const url =
                    normalizeUrl(
                        decoded
                    );

                if (
                    url &&
                    !urls.includes(url)
                ) {

                    urls.push(url);
                }

            } catch {
                // ignore
            }
        }

        // --------------------------------------------------------
        // href
        // --------------------------------------------------------

        const hrefMatches =
            html.match(
                /href=["']([^"']+)["']/gi
            ) || [];

        for (
            const match
            of hrefMatches
        ) {

            const found =
                match.match(
                    /href=["']([^"']+)["']/i
                );

            if (!found?.[1]) {
                continue;
            }

            let value =
                found[1];

            try {

                if (
                    value.includes(
                        "uddg="
                    )
                ) {

                    const params =
                        new URL(
                            value.startsWith(
                                "http"
                            )
                                ? value
                                : `https://duckduckgo.com${value}`
                        );

                    const uddg =
                        params.searchParams.get(
                            "uddg"
                        );

                    if (uddg) {
                        value = uddg;
                    }
                }

                const url =
                    normalizeUrl(
                        value
                    );

                if (
                    url &&
                    !urls.includes(url)
                ) {

                    urls.push(url);
                }

            } catch {
                // ignore
            }
        }

        return urls;

    } catch (error) {

        console.error(
            "❌ DuckDuckGo API Error:",
            error
        );

        return [];
    }
}

// ============================================================
// POST
// ============================================================

export async function POST(
    request: NextRequest
) {

    try {

        const body =
            await request.json();

        const keyword =
            String(
                body?.keyword || ""
            ).trim();

        if (!keyword) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "請輸入公益類型",
                },
                {
                    status: 400,
                }
            );
        }

        console.log(
            "🏛️ 公益搜尋：",
            keyword
        );

        // ========================================================
        // 搜尋詞
        // ========================================================

        const searchKeywords = [

            `${keyword} 基金會`,

            `${keyword} 協會`,

            `${keyword} 公益 捐款`,

            `${keyword} 慈善 捐款`,

            `${keyword} 公益組織`,

            `${keyword} 捐贈`,
        ];

        console.log(
            "🔎 公益搜尋詞：",
            searchKeywords
        );

        // ========================================================
        // 搜尋
        // ========================================================

        const allUrls: string[] = [];

        for (
            const searchKeyword
            of searchKeywords
        ) {

            console.log(
                "搜尋：",
                searchKeyword
            );

            const urls =
                await searchDuckDuckGo(
                    searchKeyword
                );

            for (
                const url
                of urls
            ) {

                if (
                    !allUrls.includes(url)
                ) {

                    allUrls.push(url);
                }
            }
        }

        console.log(
            "🔎 原始結果：",
            allUrls.length
        );

        // ========================================================
        // 過濾
        // ========================================================

        const candidates =
            allUrls
                .filter(
                    url =>
                        !isExcludedDomain(
                            url
                        )
                )
                .slice(0, 15);

        console.log(
            "🏛️ 候選網站：",
            candidates.length
        );

        // ========================================================
        // 分析網站
        //
        // Promise.allSettled
        //
        // 就算某一個網站壞掉
        // 其他網站還是會繼續
        // ========================================================

        const analyzed =
            await Promise.allSettled(
                candidates.map(
                    url =>
                        analyzeWebsite(
                            url
                        )
                )
            );

        const results =
            analyzed
                .filter(
                    item =>
                        item.status ===
                        "fulfilled"
                )
                .map(
                    item =>
                        item.status ===
                        "fulfilled"
                            ? item.value
                            : null
                )
                .filter(
                    (
                        item
                    ): item is CharityAnalysis =>
                        item !== null
                );

        // ========================================================
        // 排序
        //
        // 優先：
        // 1. Payment Score
        // 2. Physical Score
        // 3. Confidence
        // ========================================================

        results.sort(
            (a, b) => {

                const scoreA =
                    a.paymentScore +
                    a.physicalScore +
                    a.confidence;

                const scoreB =
                    b.paymentScore +
                    b.physicalScore +
                    b.confidence;

                return (
                    scoreB -
                    scoreA
                );
            }
        );

        console.log(
            "✅ 最終結果：",
            results.length
        );

        return NextResponse.json({

            success: true,

            keyword,

            count:
                results.length,

            results,
        });

    } catch (error) {

        console.error(
            "❌ Charity Search API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,

                error:
                    error instanceof Error
                        ? error.message
                        : "公益搜尋失敗",
            },
            {
                status: 500,
            }
        );
    }
}