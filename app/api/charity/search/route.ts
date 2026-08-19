import { NextRequest, NextResponse } from "next/server";

// ============================================================
// 公益搜尋 API
// 台灣公益組織 / 動物 / 動保
//
// 設計原則
// 1. 不使用 Yahoo
// 2. 搜尋引擎失敗不影響 API
// 3. 強制台灣網站驗證
// 4. 排除日本、美國及海外組織
// 5. 保留台灣公益組織 Seed，避免搜尋引擎掛掉時 0 筆
// 6. 所有 fetch 都有 timeout
// ============================================================

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
// 台灣公益分類
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
            "pet"
        ]
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
            "alzheimer"
        ]
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
            "senior"
        ]
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
            "youth"
        ]
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
            "disability"
        ]
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
            "health"
        ]
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
            "scholarship"
        ]
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
            "conservation"
        ]
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
            "social welfare"
        ]
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
            "relief"
        ]
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
            "refugee"
        ]
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
            "family"
        ]
    },

    {
        name: "青少年／青年培力",
        keywords: [
            "青年",
            "青年培力",
            "青年發展",
            "青少年培力",
            "teen",
            "teenager"
        ]
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
            "mental"
        ]
    }
];

// ============================================================
// 台灣動保 Seed
//
// 這個非常重要。
// 即使搜尋引擎掛掉，仍然可以找到基本台灣動保組織。
// ============================================================

const taiwanAnimalSeeds = [
    "https://www.apatw.org",
    "https://www.savedogs.org",
    "https://www.animalspark.org.tw",
    "https://www.hsapf.org.tw",
    "https://www.kitanimals.org",
    "https://www.animalstaiwan.org",

    // 常見台灣動保組織 / 公益組織
    "https://www.taiwananimal.org",
    "https://www.lca.org.tw",
    "https://www.tspca.org.tw"
];

// ============================================================
// 排除網域
// ============================================================

const excludedDomains = [

    // 搜尋引擎
    "google.com",
    "google.com.tw",
    "bing.com",
    "yahoo.com",
    "yahoo.com.tw",
    "duckduckgo.com",

    // 社群
    "facebook.com",
    "instagram.com",
    "threads.net",
    "twitter.com",
    "x.com",
    "youtube.com",

    // 百科
    "wikipedia.org",

    // 新聞
    "udn.com",
    "setn.com",
    "ettoday.net",
    "ltn.com.tw",
    "news.ltn.com.tw",
    "cna.com.tw",

    // 電商
    "shoplineapp.com",
    "shopify.com",
    "pchome.com.tw",
    "ruten.com.tw",
    "momo.com.tw",
    "momoshop.com.tw",
    "amazon.com",

    // 求職 / 內容平台
    "indeed.com",
    "104.com.tw",
    "1111.com.tw",
    "linkedin.com",
    "medium.com",
    "blogspot.com",
    "wordpress.com",

    // 海外常見
    "wikipedia.org",
    "org",
];

// ============================================================
// 海外國家 / 網域黑名單
// ============================================================

const foreignTlds = [
    ".jp",
    ".co.jp",
    ".us",
    ".uk",
    ".de",
    ".fr",
    ".cn",
    ".hk",
    ".sg",
    ".au",
    ".ca",
    ".kr",
    ".nz",
    ".my",
    ".ph",
    ".in"
];

// ============================================================
// HTML 清理
// ============================================================

function cleanHtml(html: string) {

    return html
        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )
        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )
        .replace(
            /<noscript[\s\S]*?<\/noscript>/gi,
            " "
        )
        .replace(
            /<svg[\s\S]*?<\/svg>/gi,
            " "
        )
        .replace(
            /<iframe[\s\S]*?<\/iframe>/gi,
            " "
        )
        .replace(
            /<[^>]+>/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
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

function normalizeUrl(
    rawUrl: string
) {

    if (!rawUrl) {
        return "";
    }

    let value =
        rawUrl.trim();

    try {
        value =
            decodeURIComponent(
                value
            );
    } catch {}

    // 去除 HTML 垃圾
    value =
        value
            .replace(
                /^["']+|["']+$/g,
                ""
            )
            .trim();

    // 絕對不要讓 html / font 再進來
    if (
        value === "html" ||
        value === "font" ||
        value === "https://html" ||
        value === "https://font" ||
        value.startsWith("javascript:") ||
        value.startsWith("data:") ||
        value.startsWith("#")
    ) {
        return "";
    }

    if (
        value.startsWith("//")
    ) {
        value =
            "https:" + value;
    }

    if (
        !/^https?:\/\//i.test(
            value
        )
    ) {
        value =
            `https://${value}`;
    }

    try {

        const parsed =
            new URL(value);

        if (
            !parsed.hostname ||
            !parsed.hostname.includes(".")
        ) {
            return "";
        }

        return (
            parsed.protocol +
            "//" +
            parsed.hostname
        );

    } catch {

        return "";
    }
}

// ============================================================
// 是否台灣網站
// ============================================================

function isTaiwanDomain(
    url: string
) {

    try {

        const parsed =
            new URL(url);

        const hostname =
            parsed.hostname
                .replace(
                    /^www\./i,
                    ""
                )
                .toLowerCase();

        // 台灣正式網域
        if (
            hostname.endsWith(".tw")
        ) {
            return true;
        }

        // 台灣公益常見
        if (
            hostname.endsWith(".org.tw")
        ) {
            return true;
        }

        if (
            hostname.endsWith(".ngo.tw")
        ) {
            return true;
        }

        if (
            hostname.endsWith(".gov.tw")
        ) {
            return true;
        }

        // 海外 TLD 明確排除
        if (
            foreignTlds.some(
                tld =>
                    hostname.endsWith(tld)
            )
        ) {
            return false;
        }

        return false;

    } catch {

        return false;
    }
}

// ============================================================
// 台灣內容驗證
//
// 解決日本、美國網站跑進來的核心
// ============================================================

function isTaiwanContent(
    text: string,
    url: string
) {

    const lower =
        text.toLowerCase();

    // 網域本身是 .tw
    if (
        isTaiwanDomain(url)
    ) {
        return true;
    }

    // 台灣身份關鍵字
    const taiwanSignals = [
        "台灣",
        "臺灣",
        "台北",
        "臺北",
        "新北",
        "桃園",
        "新竹",
        "台中",
        "臺中",
        "彰化",
        "嘉義",
        "台南",
        "臺南",
        "高雄",
        "屏東",
        "宜蘭",
        "花蓮",
        "台東",
        "臺東",
        "基隆",
        "澎湖",
        "金門",
        "連江",
        "taiwan",
        "taipei",
        "kaohsiung"
    ];

    let score = 0;

    for (
        const signal
        of taiwanSignals
    ) {

        if (
            lower.includes(
                signal.toLowerCase()
            )
        ) {
            score++;
        }
    }

    // 至少兩個台灣訊號
    return score >= 2;
}

// ============================================================
// 絕對排除海外
// ============================================================

function isForeignWebsite(
    url: string,
    text: string
) {

    try {

        const hostname =
            new URL(url)
                .hostname
                .toLowerCase();

        if (
            foreignTlds.some(
                tld =>
                    hostname.endsWith(tld)
            )
        ) {
            return true;
        }

        const lower =
            text.toLowerCase();

        const foreignSignals = [
            "japan",
            "日本",
            "tokyo",
            "osaka",
            "united states",
            "usa",
            "america",
            "new york",
            "california",
            "los angeles",
            "united kingdom",
            "germany",
            "france",
            "australia",
            "singapore"
        ];

        // 有台灣內容時，不直接因為文字出現 foreign 就排除
        const taiwanSignals = [
            "台灣",
            "臺灣",
            "taiwan",
            "taipei"
        ];

        const hasTaiwan =
            taiwanSignals.some(
                signal =>
                    lower.includes(
                        signal.toLowerCase()
                    )
            );

        const foreignCount =
            foreignSignals.filter(
                signal =>
                    lower.includes(
                        signal.toLowerCase()
                    )
            ).length;

        if (
            foreignCount >= 2 &&
            !hasTaiwan
        ) {
            return true;
        }

        return false;

    } catch {

        return true;
    }
}

// ============================================================
// Search URL 驗證
// ============================================================

function isValidSearchUrl(
    url: string
) {

    if (!url) {
        return false;
    }

    if (
        url === "https://font" ||
        url === "https://html"
    ) {
        return false;
    }

    if (
        url.includes(
            "javascript:"
        ) ||
        url.includes(
            "mailto:"
        )
    ) {
        return false;
    }

    try {

        const parsed =
            new URL(url);

        const hostname =
            parsed.hostname
                .replace(
                    /^www\./,
                    ""
                )
                .toLowerCase();

        if (
            !hostname ||
            !hostname.includes(".")
        ) {
            return false;
        }

        if (
            isExcludedDomain(
                url
            )
        ) {
            return false;
        }

        // 海外網域直接不要
        if (
            foreignTlds.some(
                tld =>
                    hostname.endsWith(tld)
            )
        ) {
            return false;
        }

        return true;

    } catch {

        return false;
    }
}

// ============================================================
// 排除網域
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
                )
                .toLowerCase();

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
// 偵測組織名稱
// ============================================================

function detectOrganizationName(
    html: string,
    url: string
) {

    const ogSiteName =
        html.match(
            /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
        );

    if (
        ogSiteName?.[1]
    ) {

        return decodeHtml(
            ogSiteName[1]
        ).trim();
    }

    const applicationName =
        html.match(
            /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i
        );

    if (
        applicationName?.[1]
    ) {

        return decodeHtml(
            applicationName[1]
        ).trim();
    }

    const title =
        html.match(
            /<title[^>]*>([\s\S]*?)<\/title>/i
        );

    if (
        title?.[1]
    ) {

        const titleText =
            decodeHtml(
                title[1]
            )
                .replace(
                    /\s+/g,
                    " "
                )
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
            .replace(
                /^www\./i,
                ""
            );

    } catch {

        return "未知公益組織";
    }
}

// ============================================================
// 分類
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
// 捐款
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
        "立即捐款",
        "線上捐款",
        "愛心捐款",
        "我要捐款",
        "線上捐贈",
        "立即支持",
        "donate",
        "donation"
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
        "monthly donation"
    ];

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

    const methods: string[] = [];

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
        methods
    };
}

// ============================================================
// 實體據點
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
        "center"
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

            signals.push(
                keyword
            );
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

    return {
        hasPhysicalStore:
            signals.length >= 1,

        signals:
            Array.from(
                new Set(
                    signals
                )
            ).slice(0, 8)
    };
}

// ============================================================
// 勸募
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
        "公益勸募活動"
    ];

    const signals =
        keywords.filter(
            keyword =>
                lowerText.includes(
                    keyword.toLowerCase()
                )
        );

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
            numberMatch?.[0]?.trim()
    };
}

// ============================================================
// 全支付
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
        "全支付捐贈"
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
            signals.slice(
                0,
                10
            )
    };
}

// ============================================================
// Score
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

function calculatePhysicalScore(
    physicalStore: PhysicalResult
) {

    return physicalStore.hasPhysicalStore
        ? 10
        : 0;
}

// ============================================================
// 合作
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

    if (
        fullPay.hasFullPay
    ) {

        return (
            "官網已偵測到全支付相關資訊，" +
            "建議確認現有合作狀態，避免重複開發。"
        );
    }

    const recommendations: string[] = [];

    if (
        donation.online
    ) {

        recommendations.push(
            "網站已有線上捐款需求，可優先洽談 EC／APP 捐款金流合作。"
        );

        if (
            donation.recurring
        ) {

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

    return recommendations.join(
        " "
    );
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

    confidence += Math.min(
        categories.length * 8,
        24
    );

    if (
        donation.online
    ) {
        confidence += 12;
    }

    if (
        donation.recurring
    ) {
        confidence += 8;
    }

    if (
        physicalStore.hasPhysicalStore
    ) {
        confidence += 6;
    }

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

    if (
        categories.length > 0
    ) {

        evidence.push(
            `公益分類：${categories.join("、")}`
        );
    }

    if (
        donation.online
    ) {

        evidence.push(
            "偵測到線上捐款相關資訊"
        );
    }

    if (
        donation.recurring
    ) {

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

    if (
        fullPay.hasFullPay
    ) {

        evidence.push(
            `偵測到全支付相關資訊：${fullPay.signals.join("、")}`
        );
    }

    return evidence;
}

// ============================================================
// 分析網站
// ============================================================

async function analyzeWebsite(
    rawUrl: string
): Promise<CharityAnalysis | null> {

    const url =
        normalizeUrl(
            rawUrl
        );

    if (!url) {
        return null;
    }

    if (
        !isValidSearchUrl(
            url
        )
    ) {
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

                        "Accept-Language":
                            "zh-TW,zh;q=0.9,en;q=0.8"
                    },

                    redirect:
                        "follow",

                    cache:
                        "no-store",

                    signal:
                        AbortSignal.timeout(
                            10000
                        )
                }
            );

        if (
            !response.ok
        ) {

            console.log(
                "⚠️ HTTP",
                response.status,
                url
            );

            return null;
        }

        const html =
            await response.text();

        if (
            !html ||
            html.length < 100
        ) {
            return null;
        }

        const text =
            cleanHtml(
                html
            );

        // ========================================================
        // 台灣驗證
        // ========================================================

        if (
            !isTaiwanContent(
                text,
                url
            )
        ) {

            console.log(
                "🚫 非台灣網站：",
                url
            );

            return null;
        }

        if (
            isForeignWebsite(
                url,
                text
            )
        ) {

            console.log(
                "🚫 海外網站：",
                url
            );

            return null;
        }

        const organizationName =
            detectOrganizationName(
                html,
                url
            );

        const categories =
            detectCharityCategories(
                text
            );

        // 如果使用者搜尋的是動物
        // 就要求網站真的出現動物相關內容
        //
        // 避免「搜尋動物」卻跑出一般社福機構
        const lowerText =
            text.toLowerCase();

        if (
            categories.length === 0
        ) {
            return null;
        }

        const donation =
            detectDonation(
                text
            );

        const physicalStore =
            detectPhysicalStore(
                text
            );

        const fundraising =
            detectFundraising(
                text
            );

        const fullPay =
            detectFullPay(
                text
            );

        const paymentScore =
            calculatePaymentScore(
                donation
            );

        const physicalScore =
            calculatePhysicalScore(
                physicalStore
            );

        const cooperation =
            buildCooperation(
                donation,
                physicalStore
            );

        const recommendation =
            buildRecommendation(
                donation,
                physicalStore,
                fundraising,
                fullPay
            );

        const confidence =
            calculateConfidence(
                categories,
                donation,
                physicalStore,
                fundraising
            );

        const evidence =
            buildEvidence(
                categories,
                donation,
                physicalStore,
                fundraising,
                fullPay
            );

        return {

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

            evidence
        };

    } catch (error) {

        console.log(
            "⚠️ 網站分析略過：",
            url
        );

        return null;
    }
}

// ============================================================
// Bing 搜尋
// ============================================================

async function searchBing(
    keyword: string
): Promise<string[]> {

    try {

        const searchUrl =
            `https://www.bing.com/search?q=${encodeURIComponent(
                keyword
            )}&count=20&setlang=zh-TW&cc=TW`;

        const response =
            await fetch(
                searchUrl,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

                        "Accept":
                            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                        "Accept-Language":
                            "zh-TW,zh;q=0.9,en;q=0.8"
                    },

                    cache:
                        "no-store",

                    signal:
                        AbortSignal.timeout(
                            8000
                        )
                }
            );

        if (
            !response.ok
        ) {

            console.log(
                `🔎 Bing：${keyword} → HTTP ${response.status}`
            );

            return [];
        }

        const html =
            await response.text();

        const urls: string[] = [];

        const blocks =
            html.match(
                /<li[^>]*class=["'][^"']*b_algo[^"']*["'][^>]*>[\s\S]*?<\/li>/gi
            ) || [];

        for (
            const block
            of blocks
        ) {

            const match =
                block.match(
                    /<a[^>]+href=["']([^"']+)["']/i
                );

            if (
                !match?.[1]
            ) {
                continue;
            }

            const url =
                normalizeUrl(
                    decodeHtml(
                        match[1]
                    )
                );

            if (
                isValidSearchUrl(
                    url
                ) &&
                !urls.includes(
                    url
                )
            ) {

                urls.push(
                    url
                );
            }
        }

        console.log(
            `🔎 Bing：${keyword} → ${urls.length}`
        );

        return urls.slice(
            0,
            20
        );

    } catch {

        console.log(
            `⚠️ Bing timeout：${keyword}`
        );

        return [];
    }
}

// ============================================================
// Google
// ============================================================

async function searchGoogle(
    keyword: string
): Promise<string[]> {

    try {

        const searchUrl =
            `https://www.google.com/search?q=${encodeURIComponent(
                keyword
            )}&num=20&hl=zh-TW&gl=tw`;

        const response =
            await fetch(
                searchUrl,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

                        "Accept-Language":
                            "zh-TW,zh;q=0.9,en;q=0.8"
                    },

                    cache:
                        "no-store",

                    signal:
                        AbortSignal.timeout(
                            8000
                        )
                }
            );

        if (
            !response.ok
        ) {

            console.log(
                `🔎 Google：${keyword} → HTTP ${response.status}`
            );

            return [];
        }

        const html =
            await response.text();

        const urls: string[] = [];

        const matches =
            html.match(
                /<a[^>]+href=["']([^"']+)["']/gi
            ) || [];

        for (
            const match
            of matches
        ) {

            const found =
                match.match(
                    /href=["']([^"']+)["']/i
                );

            if (
                !found?.[1]
            ) {
                continue;
            }

            let value =
                decodeHtml(
                    found[1]
                );

            if (
                value.startsWith(
                    "/url?q="
                )
            ) {

                value =
                    value
                        .replace(
                            "/url?q=",
                            ""
                        )
                        .split(
                            "&"
                        )[0];
            }

            const url =
                normalizeUrl(
                    value
                );

            if (
                isValidSearchUrl(
                    url
                ) &&
                !urls.includes(
                    url
                )
            ) {

                urls.push(
                    url
                );
            }
        }

        console.log(
            `🔎 Google：${keyword} → ${urls.length}`
        );

        return urls.slice(
            0,
            20
        );

    } catch {

        console.log(
            `⚠️ Google timeout：${keyword}`
        );

        return [];
    }
}

// ============================================================
// DuckDuckGo
// ============================================================

async function searchDuckDuckGo(
    keyword: string
): Promise<string[]> {

    try {

        const searchUrl =
            `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
                keyword
            )}`;

        const response =
            await fetch(
                searchUrl,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

                        "Accept":
                            "text/html"
                    },

                    cache:
                        "no-store",

                    signal:
                        AbortSignal.timeout(
                            8000
                        )
                }
            );

        if (
            !response.ok
        ) {

            console.log(
                `🔎 DuckDuckGo：${keyword} → HTTP ${response.status}`
            );

            return [];
        }

        const html =
            await response.text();

        const urls: string[] = [];

        const matches =
            html.match(
                /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["']/gi
            ) || [];

        for (
            const match
            of matches
        ) {

            const found =
                match.match(
                    /href=["']([^"']+)["']/i
                );

            if (
                !found?.[1]
            ) {
                continue;
            }

            let value =
                decodeHtml(
                    found[1]
                );

            if (
                value.includes(
                    "uddg="
                )
            ) {

                try {

                    const parsed =
                        new URL(
                            value
                        );

                    const target =
                        parsed.searchParams.get(
                            "uddg"
                        );

                    if (
                        target
                    ) {
                        value =
                            target;
                    }

                } catch {}
            }

            const url =
                normalizeUrl(
                    value
                );

            if (
                isValidSearchUrl(
                    url
                ) &&
                !urls.includes(
                    url
                )
            ) {

                urls.push(
                    url
                );
            }
        }

        console.log(
            `🔎 DuckDuckGo：${keyword} → ${urls.length}`
        );

        return urls.slice(
            0,
            20
        );

    } catch {

        console.log(
            `⚠️ DuckDuckGo timeout：${keyword}`
        );

        return [];
    }
}

// ============================================================
// 搜尋
// Bing → Google → DDG
//
// 注意：
// 不再使用 Yahoo
// ============================================================

async function searchWeb(
    keyword: string
) {

    const all: string[] = [];

    // Bing
    const bing =
        await searchBing(
            keyword
        );

    for (
        const url
        of bing
    ) {

        if (
            !all.includes(
                url
            )
        ) {

            all.push(
                url
            );
        }
    }

    // Google
    if (
        all.length < 8
    ) {

        console.log(
            "🔄 Bing 結果不足 → Google fallback：",
            keyword
        );

        const google =
            await searchGoogle(
                keyword
            );

        for (
            const url
            of google
        ) {

            if (
                !all.includes(
                    url
                )
            ) {

                all.push(
                    url
                );
            }
        }
    }

    // DDG
    if (
        all.length < 8
    ) {

        console.log(
            "🔄 搜尋結果仍不足 → DuckDuckGo fallback：",
            keyword
        );

        const ddg =
            await searchDuckDuckGo(
                keyword
            );

        for (
            const url
            of ddg
        ) {

            if (
                !all.includes(
                    url
                )
            ) {

                all.push(
                    url
                );
            }
        }
    }

    // 最後再驗證一次
    return all
        .map(
            normalizeUrl
        )
        .filter(
            isValidSearchUrl
        )
        .slice(
            0,
            30
        );
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

        if (
            !keyword
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "請輸入公益類型"
                },
                {
                    status: 400
                }
            );
        }

        console.log(
            "🏛️ 公益搜尋：",
            keyword
        );

        // ========================================================
        // 搜尋詞
        //
        // 動物特別加強
        // ========================================================

        let searchKeywords: string[];

        if (
            keyword.includes(
                "動物"
            ) ||
            keyword.includes(
                "寵物"
            ) ||
            keyword.includes(
                "動保"
            )
        ) {

            searchKeywords = [

                `${keyword} 台灣 動保`,
                `${keyword} 台灣 流浪動物`,
                `${keyword} 台灣 動物保護`,
                `${keyword} 台灣 動物協會`,
                `${keyword} 台灣 動物基金會`,
                `${keyword} 台灣 動物之家`,
                `${keyword} 台灣 狗 貓`,
                `${keyword} 台灣 NGO`,
                `${keyword} 台灣 NPO`,
                `${keyword} 台灣 公益`,
                `${keyword} 台灣 捐款`,
                `${keyword} 台灣 捐贈`

            ];

        } else {

            searchKeywords = [

                `${keyword} 台灣 基金會`,
                `${keyword} 台灣 協會`,
                `${keyword} 台灣 公益`,
                `${keyword} 台灣 公益 捐款`,
                `${keyword} 台灣 慈善`,
                `${keyword} 台灣 NGO`,
                `${keyword} 台灣 NPO`,
                `${keyword} 台灣 社團法人`,
                `${keyword} 台灣 財團法人`,
                `${keyword} 台灣 捐款`

            ];
        }

        console.log(
            "🔎 公益搜尋詞：",
            searchKeywords
        );

        // ========================================================
        // 搜尋 URL
        // ========================================================

        const allUrls: string[] = [];

        // 每次最多跑 8 個搜尋詞
        //
        // 不需要 20 個全部跑。
        // 正式站比較穩。
        for (
            const searchKeyword
            of searchKeywords.slice(
                0,
                8
            )
        ) {

            console.log(
                "搜尋：",
                searchKeyword
            );

            const urls =
                await searchWeb(
                    searchKeyword
                );

            for (
                const url
                of urls
            ) {

                if (
                    !allUrls.includes(
                        url
                    )
                ) {

                    allUrls.push(
                        url
                    );
                }
            }

            // 有足夠候選就停止
            if (
                allUrls.length >= 30
            ) {

                break;
            }
        }

        // ========================================================
        // 加入 Seed
        //
        // 特別是動物搜尋
        // ========================================================

        if (
            keyword.includes(
                "動物"
            ) ||
            keyword.includes(
                "寵物"
            ) ||
            keyword.includes(
                "動保"
            )
        ) {

            for (
                const seed
                of taiwanAnimalSeeds
            ) {

                const normalized =
                    normalizeUrl(
                        seed
                    );

                if (
                    normalized &&
                    !allUrls.includes(
                        normalized
                    )
                ) {

                    allUrls.push(
                        normalized
                    );
                }
            }
        }

        console.log(
            "🔎 原始候選：",
            allUrls.length
        );

        // ========================================================
        // 候選
        // ========================================================

        const candidates =
            allUrls
                .map(
                    normalizeUrl
                )
                .filter(
                    isValidSearchUrl
                )
                .filter(
                    url =>
                        isTaiwanDomain(
                            url
                        ) ||
                        taiwanAnimalSeeds.includes(
                            url
                        )
                )
                .slice(
                    0,
                    30
                );

        console.log(
            "🏛️ 台灣候選網站：",
            candidates.length
        );

        // ========================================================
        // 分析
        //
        // 限制並發數，正式站比較穩
        // ========================================================

        const results: CharityAnalysis[] = [];

        for (
            let i = 0;
            i < candidates.length;
            i += 5
        ) {

            const batch =
                candidates.slice(
                    i,
                    i + 5
                );

            const analyzed =
                await Promise.all(
                    batch.map(
                        url =>
                            analyzeWebsite(
                                url
                            )
                    )
                );

            for (
                const result
                of analyzed
            ) {

                if (
                    result
                ) {

                    results.push(
                        result
                    );
                }
            }
        }

        // ========================================================
        // 去重
        // ========================================================

        const uniqueResults =
            new Map<
                string,
                CharityAnalysis
            >();

        for (
            const result
            of results
        ) {

            try {

                const hostname =
                    new URL(
                        result.url
                    )
                        .hostname
                        .replace(
                            /^www\./,
                            ""
                        )
                        .toLowerCase();

                if (
                    !uniqueResults.has(
                        hostname
                    )
                ) {

                    uniqueResults.set(
                        hostname,
                        result
                    );
                }

            } catch {}
        }

        const finalResults =
            Array.from(
                uniqueResults.values()
            );

        // ========================================================
        // 最終排序
        //
        // 1. 動物分類
        // 2. 金流
        // 3. 實體
        // 4. 信心
        // ========================================================

        finalResults.sort(
            (a, b) => {

                const animalA =
                    a.categories.includes(
                        "動物／流浪動物"
                    )
                        ? 100
                        : 0;

                const animalB =
                    b.categories.includes(
                        "動物／流浪動物"
                    )
                        ? 100
                        : 0;

                const scoreA =
                    animalA +
                    a.paymentScore +
                    a.physicalScore +
                    a.confidence;

                const scoreB =
                    animalB +
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
            finalResults.length
        );

        return NextResponse.json({

            success: true,

            keyword,

            count:
                finalResults.length,

            results:
                finalResults

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
                        : "公益搜尋失敗"
            },
            {
                status: 500
            }
        );
    }
}