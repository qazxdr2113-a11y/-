import { NextResponse } from "next/server";

// ============================================================
// PayLead Finder
// 商戶搜尋 API v2
//
// 核心策略
// 1. Yahoo 搜尋，使用 TW 區域
// 2. 12 組搜尋詞
// 3. 每組搜尋最多抓 20 筆
// 4. 搜尋階段「寬進」
// 5. 候選階段再做相關性 / 垃圾網站 / 大型平台過濾
// 6. 網站實際 Fetch 後再做商戶分析
// 7. 最多分析 80 個候選網站
// 8. 最終輸出 30 筆
// 9. 合作平台優先
// 10. Lead Score + 搜尋相關性共同排序
//
// Yahoo 目前的結果通常以 algo-sr / compTitle / compText
// 結構呈現，因此這裡同時支援多種 HTML 結構。
// ============================================================


// ============================================================
// 合作平台
// ============================================================

const cooperationPlatforms = [
    "qdm",
    "showmore",
    "尚峪",
    "easystore",
    "環匯亞太",
    "開店123",
    "liteshop",
    "gogoshop",
    "waca",
];


// ============================================================
// 平台指紋
// ============================================================

const fingerprints = [
    {
        name: "gogoshop",
        keywords: [
            "gogoshop.cloud",
            "cdn.gogoshop.cloud",
            "img.gogoshop.cloud",
        ],
    },

    {
        name: "qdm",
        keywords: [
            "qdm.cloud",
            "cdn.qdm.cloud",
            "image-cdn.qdm.cloud",
            "image-cdn-flare.qdm.cloud",
            "qdm_user_uuid",
            "QDMPPID",
        ],
    },

    {
        name: "easystore",
        keywords: [
            "easystore.co",
            "store-themes.easystore.co",
            "apps.easystore.co",
            "resources.easystore.co",
            "easystore-section-header",
        ],
    },

    {
        name: "開店123",
        keywords: [
            "shop123.com.tw",
            "fs1.shop123.com.tw",
            "shop123.com",
        ],
    },

    {
        name: "waca",
        keywords: [
            "waca.net",
            "waca.tw",
        ],
    },

    {
        name: "liteshop",
        keywords: [
            "liteshop.tw",
            "liteshop.com.tw",
        ],
    },

    {
        name: "showmore",
        keywords: [
            "showmore.com.tw",
            "showmore.com",
        ],
    },

    {
        name: "尚峪",
        keywords: [
            "尚峪",
        ],
    },

    {
        name: "環匯亞太",
        keywords: [
            "global payments",
            "globalpayments",
        ],
    },

    {
        name: "shopify",
        keywords: [
            "cdn.shopify.com",
            "myshopify.com",
            "shopify.theme",
        ],
    },

    {
        name: "shopline",
        keywords: [
            "shoplineapp.com",
            "shopline.com",
            "shopline.cloud",
        ],
    },

    {
        name: "woocommerce",
        keywords: [
            "woocommerce-layout",
            "woocommerce-js",
            "wc-cart-fragments",
            "wp-content/plugins/woocommerce",
        ],
    },
];


// ============================================================
// 排除 Domain
//
// 注意：
// 這裡是「一定不要當商戶」的網站
// ============================================================

const excludedDomains = [

    // --------------------------------------------------------
    // 社群
    // --------------------------------------------------------

    "facebook.com",
    "instagram.com",
    "youtube.com",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "threads.net",
    "pinterest.com",

    // --------------------------------------------------------
    // 大型電商 / Marketplace
    // --------------------------------------------------------

    "momo.com.tw",
    "momoshop.com.tw",
    "pchome.com.tw",
    "shopee.tw",
    "shopee.com",
    "ruten.com.tw",
    "buy123.com.tw",
    "yahoo.com",
    "yahoo.com.tw",
    "shopping.yahoo.com",
    "tw.buy.yahoo.com",
    "taobao.com",
    "tmall.com",
    "1688.com",
    "jd.com",
    "amazon.com",
    "amazon.com.tw",

    // --------------------------------------------------------
    // 外送 / 聚合平台
    // --------------------------------------------------------

    "ubereats.com",
    "foodpanda.com.tw",
    "foodpanda.com",
    "inline.app",
    "inline.company",
    "eztable.com",
    "shopback.com.tw",
    "shopback.com",

    // --------------------------------------------------------
    // 評價 / 聚合 / 旅遊
    // --------------------------------------------------------

    "tripadvisor.com",
    "tripadvisor.com.tw",
    "google.com",
    "google.com.tw",
    "googleusercontent.com",
    "maps.google.com",

    // --------------------------------------------------------
    // 搜尋引擎
    // --------------------------------------------------------

    "bing.com",

    // --------------------------------------------------------
    // 新聞 / 媒體
    // --------------------------------------------------------

    "vogue.com",
    "vogue.com.tw",
    "gq.com",
    "gq.com.tw",
    "elle.com",
    "elle.com.tw",
    "marieclaire.com",
    "businessweekly.com.tw",
    "cw.com.tw",
    "storm.mg",
    "setn.com",
    "ettoday.net",
    "udn.com",
    "ltn.com.tw",
    "chinatimes.com",
    "tvbs.com.tw",
    "ctee.com.tw",
    "moneydj.com",
    "news.yahoo.com",

    // --------------------------------------------------------
    // Blog / 內容平台
    // --------------------------------------------------------

    "medium.com",
    "substack.com",
    "blogspot.com",
    "wordpress.com",
    "pixnet.net",
    "blog.xuite.net",

    // --------------------------------------------------------
    // Q&A / 知識 / 論壇
    // --------------------------------------------------------

    "wikipedia.org",
    "faq.tw",
    "faqs.tw",
    "ptt.cc",
    "dcard.tw",
    "reddit.com",
    "quora.com",

    // --------------------------------------------------------
    // 求職
    // --------------------------------------------------------

    "104.com.tw",
    "1111.com.tw",
    "518.com.tw",

    // --------------------------------------------------------
    // 政府 / 公共
    // --------------------------------------------------------

    "gov.tw",
];


// ============================================================
// 強制排除 Domain
// ============================================================

const hardExcludedDomains = [

    // --------------------------------------------------------
    // 便利商店
    // --------------------------------------------------------

    "7-11.com.tw",
    "7-11.com",
    "family.com.tw",
    "hilife.com.tw",
    "okmart.com.tw",

    // --------------------------------------------------------
    // 大型零售
    // --------------------------------------------------------

    "pxmart.com.tw",
    "carrefour.com.tw",
    "costco.com.tw",
    "watsons.com.tw",
    "watsons.com",

    // --------------------------------------------------------
    // 大型品牌
    // --------------------------------------------------------

    "uniqlo.com",
    "gu-global.com",
    "giordano.com",

    // --------------------------------------------------------
    // 平台 / SaaS
    // --------------------------------------------------------

    "cyberbiz.io",
    "meepshop.com",
    "supportmeepshop.com",
    "shoplineapp.com",
    "support.shoplineapp.com",

    // --------------------------------------------------------
    // 內容 / SEO 垃圾站
    // --------------------------------------------------------

    "uptogo.com.tw",
    "vibeaico.com",
    "rosy-arts.com",
    "whbydcc.com",

    // --------------------------------------------------------
    // 租車 / 汽車大型服務
    // 避免「短袖」這種完全不相關搜尋跑出 Nissan
    // --------------------------------------------------------

    "nissan-rentacar.com",
    "nissan-rentacar.com.tw",
];


// ============================================================
// 排除 Path
// ============================================================

const excludedPaths = [

    "/news",
    "/article",
    "/articles",
    "/blog",
    "/blogs",
    "/magazine",
    "/forum",
    "/forums",
    "/topic",
    "/topics",
    "/post",
    "/posts",
    "/author",
    "/tag",

    "/help",
    "/support",
    "/docs",
    "/documentation",
    "/tutorial",
    "/tutorials",
    "/guide",
    "/guides",

    "/search",
    "/search/",
    "/query",
];


// ============================================================
// 標題垃圾訊號
// ============================================================

const excludedTitleSignals = [

    // 新聞
    "新聞",
    "新聞網",
    "新聞報導",
    "最新消息",
    "即時新聞",
    "報導",

    // 文章
    "文章",
    "專訪",
    "編輯",
    "媒體",
    "雜誌",

    // 教學
    "教學",
    "操作教學",
    "使用教學",
    "設定教學",
    "教學文件",
    "操作說明",
    "使用說明",

    // 文件
    "docs",
    "documentation",
    "help center",
    "help centre",
    "support",

    // 評論
    "評論",
    "評價",
    "心得",
    "推薦排行",
    "排行榜",

    // 聚合
    "購物中心",
    "優惠推薦",
    "比價",
    "商品比較",

    // SEO 型內容
    "2026",
    "2025",
    "完整整理",
    "懶人包",
    "攻略",
    "推薦",
    "推薦清單",
    "比較",
];


// ============================================================
// 商戶訊號
// ============================================================

const merchantSignals = [

    "購物車",
    "加入購物車",
    "購物袋",
    "cart",
    "add to cart",
    "checkout",
    "結帳",

    "商品",
    "產品",
    "價格",
    "售價",
    "立即購買",
    "立即訂購",
    "訂購",
    "購買",

    "商城",
    "商店",
    "網路商店",
    "線上商店",

    "會員",
    "會員登入",
    "會員中心",
    "登入",
    "註冊",
    "login",
    "register",
    "membership",

    "付款",
    "支付",
    "信用卡",
    "電子支付",
    "行動支付",
    "線上付款",
    "線上支付",
    "payment",
    "pay",

    "預約",
    "線上預約",
    "預約服務",
    "booking",
    "reservation",

    "訂閱",
    "訂閱制",
    "subscription",
    "月費",
    "月租",
    "續費",
    "自動扣款",

    "門市",
    "門店",
    "分店",
    "據點",
    "店面",
    "服務據點",
    "旗艦店",
    "專櫃",
];


// ============================================================
// 金流訊號
// ============================================================

const paymentSignals = [

    "付款",
    "支付",
    "信用卡",
    "電子支付",
    "行動支付",
    "qr code",
    "qr付款",
    "線上付款",
    "線上支付",
    "app付款",
    "app支付",
    "payment",
    "pay",

    "結帳",
    "checkout",

    "訂金",
    "押金",
    "尾款",

    "會員扣款",
    "自動扣款",
    "續費",
    "月費",
    "月租",
    "訂閱",
    "subscription",

    "預約",
    "線上預約",
    "booking",
    "reservation",

    "停車",
    "停車場",
    "停車費",
    "停車繳費",

    "充電",
    "充電樁",
    "充電站",
    "電動車",
    "ev charging",
    "charging station",
    "充電費",

    "租車",
    "租借",
    "共享",
    "共享車",
    "共享機車",
];


// ============================================================
// 產業訊號
// ============================================================

const industrySignals = [

    "停車場",
    "停車",

    "充電樁",
    "充電站",
    "電動車",
    "電動車充電",

    "租車",
    "租賃",
    "共享機車",
    "共享汽車",

    "健身房",
    "健身",
    "瑜珈",

    "美容",
    "美髮",

    "診所",
    "醫美",

    "教育",
    "補習班",
    "課程",

    "展覽",
    "活動",
    "票券",

    "旅遊",
    "飯店",
    "住宿",

    "餐廳",
    "餐飲",

    "百貨",
    "購物中心",
    "服飾",
    "鞋店",
    "家具",
    "家居",
    "家電",
    "3C",

    "寵物",
    "寵物用品",
    "母嬰",

    "食品",
    "零食",
    "烘焙",

    "肉品",
    "肉舖",
    "肉品專賣",
    "食品專賣",

    "短袖",
    "衣服",
    "服裝",
    "男裝",
    "女裝",
    "童裝",
    "運動服",
    "運動用品",
];


// ============================================================
// POS 訊號
// ============================================================

const physicalSignals = [

    "門市",
    "門店",
    "實體店",
    "實體門市",
    "分店",
    "據點",
    "服務據點",
    "營業據點",
    "店面",
    "店址",
    "門市地址",
    "營業時間",
    "旗艦店",
    "專櫃",
    "展售中心",
    "服務中心",

    "store",
    "stores",
    "location",
    "locations",
    "branch",
    "branches",
    "retail",
    "shop",
];


// ============================================================
// 內容網站
// ============================================================

const contentSignals = [

    "新聞",
    "媒體",
    "雜誌",
    "報導",
    "編輯",
    "專訪",
    "評論",
    "文章",
    "最新消息",
    "新聞網",

    "magazine",
    "news",
    "media",
    "article",
    "editor",
    "report",

    "tutorial",
    "documentation",
    "help center",
    "support",

    "懶人包",
    "攻略",
    "排行榜",
    "推薦清單",
];


// ============================================================
// 泛商業詞
// ============================================================

const genericBusinessWords = [
    "公司",
    "企業",
    "品牌",
    "業者",
    "商家",
    "廠商",
];


// ============================================================
// 地區
// ============================================================

const locationWords = [

    "台北市",
    "台北",
    "臺北市",
    "臺北",

    "新北市",
    "新北",

    "桃園市",
    "桃園",

    "台中市",
    "台中",
    "臺中市",
    "臺中",

    "台南市",
    "台南",
    "臺南市",
    "臺南",

    "高雄市",
    "高雄",

    "基隆市",
    "基隆",

    "新竹市",
    "新竹縣",
    "新竹",

    "苗栗縣",
    "苗栗",

    "彰化縣",
    "彰化",

    "南投縣",
    "南投",

    "雲林縣",
    "雲林",

    "嘉義市",
    "嘉義縣",
    "嘉義",

    "屏東縣",
    "屏東",

    "宜蘭縣",
    "宜蘭",

    "花蓮縣",
    "花蓮",

    "台東縣",
    "台東",
    "臺東縣",
    "臺東",

    "澎湖縣",
    "澎湖",

    "金門縣",
    "金門",

    "連江縣",
    "馬祖",

    "台灣",
    "臺灣",
    "Taiwan",
    "Taipei",
];


// ============================================================
// 禁止搜尋平台
// ============================================================

const forbiddenPlatformWords = [

    "qdm",
    "easystore",
    "waca",
    "gogoshop",
    "liteshop",
    "showmore",
    "開店123",
    "尚峪",
    "shopify",
    "shopline",
    "woocommerce",
    "cyberbiz",
    "meepshop",
];


// ============================================================
// Query 清理
// ============================================================

function sanitizeQuery(query: string) {

    let result = query.trim();

    for (const word of locationWords) {

        result = result.replace(
            new RegExp(
                word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "gi"
            ),
            " "
        );
    }

    for (const word of genericBusinessWords) {

        result = result.replace(
            new RegExp(
                word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "gi"
            ),
            " "
        );
    }

    return result
        .replace(/\s+/g, " ")
        .trim();
}


// ============================================================
// Query Token
// ============================================================

function tokenize(value: string) {

    return value
        .toLowerCase()
        .replace(/[，。！？、,.!?/\\|()[\]{}"'：:；;]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}


// ============================================================
// Query 相關性
// ============================================================

function calculateQueryRelevance(
    keyword: string,
    query: string,
    title: string,
    description: string
) {

    const keywordTokens =
        tokenize(keyword);

    const queryTokens =
        tokenize(query);

    const resultText =
        tokenize(
            `${title} ${description}`
        );

    let score = 0;

    for (const token of keywordTokens) {

        if (token.length < 2) {
            continue;
        }

        if (
            queryTokens.includes(token)
        ) {
            score += 20;
        }

        if (
            resultText.includes(token)
        ) {
            score += 25;
        }
    }

    // 原始搜尋詞有直接出現在標題
    const lowerTitle =
        title.toLowerCase();

    if (
        keyword.trim().length >= 2 &&
        lowerTitle.includes(
            keyword.toLowerCase()
        )
    ) {

        score += 30;
    }

    return Math.min(
        100,
        score
    );
}


// ============================================================
// URL Normalize
// ============================================================

function normalizeUrl(
    rawUrl: string
) {

    try {

        let value =
            rawUrl.trim();

        if (
            !/^https?:\/\//i.test(value)
        ) {

            value =
                `https://${value}`;
        }

        const parsed =
            new URL(value);

        return `${parsed.protocol}//${parsed.hostname}`;

    } catch {

        return rawUrl;
    }
}


// ============================================================
// Hostname
// ============================================================

function getHostname(
    url: string
) {

    try {

        return new URL(url)
            .hostname
            .toLowerCase()
            .replace(/^www\./, "");

    } catch {

        return "";
    }
}


// ============================================================
// Domain 是否被排除
// ============================================================

function isExcludedDomain(
    url: string
) {

    const hostname =
        getHostname(url);

    if (!hostname) {
        return true;
    }

    const allExcluded = [
        ...excludedDomains,
        ...hardExcludedDomains,
    ];

    return allExcluded.some(
        (domain) =>
            hostname === domain ||
            hostname.endsWith(
                `.${domain}`
            )
    );
}


// ============================================================
// Path 是否被排除
// ============================================================

function isExcludedPath(
    url: string
) {

    try {

        const pathname =
            new URL(url)
                .pathname
                .toLowerCase();

        return excludedPaths.some(
            (path) =>
                pathname === path ||
                pathname.startsWith(
                    `${path}/`
                )
        );

    } catch {

        return false;
    }
}


// ============================================================
// HTML Clean
// ============================================================

function cleanHtml(
    html: string
) {

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
            /<[^>]+>/g,
            " "
        )

        .replace(
            /&nbsp;/gi,
            " "
        )

        .replace(
            /&amp;/gi,
            "&"
        )

        .replace(
            /&quot;/gi,
            '"'
        )

        .replace(
            /&#39;/gi,
            "'"
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();
}


// ============================================================
// 找訊號
// ============================================================

function findSignals(
    text: string,
    signals: string[]
) {

    const lower =
        text.toLowerCase();

    return signals.filter(
        (signal) =>
            lower.includes(
                signal.toLowerCase()
            )
    );
}


// ============================================================
// Website Fetch
// ============================================================

async function fetchWebsite(
    url: string
) {

    try {

        const response =
            await fetch(
                url,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

                        Accept:
                            "text/html,application/xhtml+xml",
                    },

                    redirect:
                        "follow",

                    signal:
                        AbortSignal.timeout(
                            7000
                        ),
                }
            );

        if (!response.ok) {
            return "";
        }

        return await response.text();

    } catch {

        return "";
    }
}


// ============================================================
// Website 分析
// ============================================================

function analyzeContent(
    title: string,
    description: string,
    websiteText: string
) {

    const text =
        `${title} ${description} ${websiteText}`;

    const merchantFound =
        findSignals(
            text,
            merchantSignals
        );

    const paymentFound =
        findSignals(
            text,
            paymentSignals
        );

    const physicalFound =
        findSignals(
            text,
            physicalSignals
        );

    const industryFound =
        findSignals(
            text,
            industrySignals
        );

    const contentFound =
        findSignals(
            text,
            contentSignals
        );


    // --------------------------------------------------------
    // Merchant
    // --------------------------------------------------------

    let merchantScore =
        merchantFound.length * 5;

    if (
        websiteText.length > 500
    ) {

        merchantScore += 10;
    }


    // --------------------------------------------------------
    // Payment
    // --------------------------------------------------------

    let paymentScore =
        paymentFound.length * 7;

    paymentScore +=
        industryFound.length * 3;


    // --------------------------------------------------------
    // Physical
    // --------------------------------------------------------

    let physicalScore =
        physicalFound.length * 7;


    // --------------------------------------------------------
    // 強金流訊號
    // --------------------------------------------------------

    const strongPaymentSignals = [

        "購物車",
        "加入購物車",
        "checkout",
        "結帳",
        "付款",
        "支付",
        "線上付款",
        "停車繳費",
        "充電費",
        "自動扣款",
        "會員扣款",
        "訂閱",
    ];

    const hasStrongPayment =
        paymentFound.some(
            (signal) =>
                strongPaymentSignals.includes(
                    signal
                )
        );

    if (
        hasStrongPayment
    ) {

        paymentScore += 20;
    }


    merchantScore =
        Math.min(
            100,
            merchantScore
        );

    paymentScore =
        Math.min(
            100,
            paymentScore
        );

    physicalScore =
        Math.min(
            100,
            physicalScore
        );


    // --------------------------------------------------------
    // Content penalty
    // --------------------------------------------------------

    const contentPenalty =
        contentFound.length * 3;


    // --------------------------------------------------------
    // Lead Score
    // --------------------------------------------------------

    let leadScore =
        merchantScore * 0.35 +
        paymentScore * 0.40 +
        physicalScore * 0.25 -
        contentPenalty;

    leadScore =
        Math.max(
            0,
            Math.min(
                100,
                leadScore
            )
        );


    return {

        merchantScore,

        paymentScore,

        physicalScore,

        leadScore:
            Math.round(
                leadScore
            ),

        merchantSignals:
            merchantFound.slice(0, 15),

        paymentSignals:
            paymentFound.slice(0, 15),

        physicalSignals:
            physicalFound.slice(0, 15),

        industrySignals:
            industryFound.slice(0, 15),

        contentSignals:
            contentFound.slice(0, 10),

        hasPhysicalStore:
            physicalFound.length >= 2,

        hasPaymentNeed:
            paymentScore >= 20,
    };
}


// ============================================================
// 平台辨識
// ============================================================

function detectPlatform(
    html: string
) {

    const lowerHtml =
        html.toLowerCase();

    const results =
        fingerprints
            .map(
                (fingerprint) => {

                    const found =
                        fingerprint.keywords.filter(
                            (keyword) =>
                                lowerHtml.includes(
                                    keyword.toLowerCase()
                                )
                        );

                    return {

                        name:
                            fingerprint.name,

                        found,

                        score:
                            found.length,
                    };
                }
            )
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            );

    const best =
        results[0];

    if (
        !best ||
        best.score === 0
    ) {

        return {

            platform:
                "Unknown",

            evidence:
                [],
        };
    }

    return {

        platform:
            best.name,

        evidence:
            best.found,
    };
}


// ============================================================
// 品牌辨識
// ============================================================

function detectBrand(
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

        return ogSiteName[1]
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    const title =
        html.match(
            /<title[^>]*>([\s\S]*?)<\/title>/i
        );

    if (
        title?.[1]
    ) {

        return title[1]

            .replace(
                /&amp;/g,
                "&"
            )

            .replace(
                /\s+/g,
                " "
            )

            .replace(
                /\s*[|｜]\s*.*$/g,
                ""
            )

            .trim();
    }

    return (
        getHostname(url)
            .split(".")[0] ||
        "未知品牌"
    );
}


// ============================================================
// 固定搜尋策略
//
// 重點：
// 不要只搜尋「購物車」這種高度競爭詞
// 增加比較偏商戶 / 官網 / 服務型的搜尋詞
// ============================================================

function getFallbackQueries(
    keyword: string
) {

    const cleanKeyword =
        sanitizeQuery(
            keyword
        );

    const queries = [

        `${cleanKeyword} 官網`,

        `${cleanKeyword} 線上購物`,

        `${cleanKeyword} 線上訂購`,

        `${cleanKeyword} 線上預約`,

        `${cleanKeyword} 官方網站`,

        `${cleanKeyword} 商品 售價`,

        `${cleanKeyword} 會員`,

        `${cleanKeyword} 門市`,

        `${cleanKeyword} 分店`,

        `${cleanKeyword} 訂購 付款`,

        `${cleanKeyword} 收費 預約`,

        `${cleanKeyword} 品牌 商店`,
    ];

    return queries

        .map(
            (query) =>
                sanitizeQuery(
                    query
                )
        )

        .filter(Boolean)

        .filter(
            (
                query,
                index,
                array
            ) =>
                array.indexOf(
                    query
                ) === index
        )

        .slice(
            0,
            12
        );
}


// ============================================================
// AI Query
// ============================================================

async function generateAIQueries(
    keyword: string
) {

    const fallback =
        getFallbackQueries(
            keyword
        );

    const apiKey =
        process.env.OPENAI_API_KEY;

    if (!apiKey) {

        return fallback;
    }


    const prompt = `
你是 B2B 支付商務開發搜尋專家。

使用者輸入：
${keyword}

目標：
找到「真正的商戶官方網站」，而不是文章、新聞、論壇、購物平台或內容網站。

請產生最多 12 組搜尋詞。

搜尋策略：

第一類：
產業 + 官網
產業 + 官方網站
產業 + 品牌

第二類：
產業 + 線上購物
產業 + 線上訂購
產業 + 商品
產業 + 售價

第三類：
產業 + 線上預約
產業 + 收費
產業 + 會員
產業 + 訂閱

第四類：
產業 + 門市
產業 + 分店
產業 + 店面

第五類：
產業 + 付款
產業 + 結帳
產業 + 購物車

不要使用任何開店平台名稱。

禁止：
QDM
EasyStore
WACA
GoGoShop
LiteShop
ShowMore
開店123
尚峪
Shopify
Shopline
WooCommerce
Cyberbiz
meepShop

不要加入地區。

不要使用：
新聞
媒體
文章
論壇
評論
教學
攻略
懶人包
排行榜
比價
優惠推薦
購物中心

請只輸出 JSON array。
`;

    try {

        const response =
            await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${apiKey}`,
                    },

                    body:
                        JSON.stringify({

                            model:
                                process.env.OPENAI_MODEL ||
                                "gpt-4o-mini",

                            temperature:
                                0.5,

                            messages: [

                                {
                                    role:
                                        "system",

                                    content:
                                        "只產生 B2B 商戶搜尋詞，不得使用平台名稱。",
                                },

                                {
                                    role:
                                        "user",

                                    content:
                                        prompt,
                                },
                            ],
                        }),
                }
            );

        if (!response.ok) {
            throw new Error(
                `OpenAI ${response.status}`
            );
        }

        const data =
            await response.json();

        const content =
            data?.choices?.[0]
                ?.message
                ?.content;

        if (
            typeof content !==
            "string"
        ) {

            throw new Error(
                "OpenAI 沒有回傳內容"
            );
        }

        const parsed =
            JSON.parse(
                content
                    .replace(
                        /```json/gi,
                        ""
                    )
                    .replace(
                        /```/g,
                        ""
                    )
                    .trim()
            );

        if (
            !Array.isArray(parsed)
        ) {

            throw new Error(
                "OpenAI 格式錯誤"
            );
        }

        const aiQueries =
            parsed

                .filter(
                    (item) =>
                        typeof item ===
                        "string"
                )

                .map(
                    (item) =>
                        sanitizeQuery(
                            item
                        )
                )

                .filter(Boolean)

                .filter(
                    (query) => {

                        const lower =
                            query.toLowerCase();

                        return !forbiddenPlatformWords.some(
                            (word) =>
                                lower.includes(
                                    word.toLowerCase()
                                )
                        );
                    }
                )

                .filter(
                    (
                        query,
                        index,
                        array
                    ) =>
                        array.indexOf(
                            query
                        ) === index
                )

                .slice(
                    0,
                    12
                );

        return aiQueries.length >= 5
            ? aiQueries
            : fallback;

    } catch (error) {

        console.error(
            "AI 搜尋策略失敗：",
            error
        );

        return fallback;
    }
}


// ============================================================
// Bad Title
// ============================================================

function isBadTitle(
    title: string
) {

    const lower =
        title.toLowerCase();

    return excludedTitleSignals.some(
        (signal) =>
            lower.includes(
                signal.toLowerCase()
            )
    );
}


// ============================================================
// 商戶搜尋結果判斷
//
// 這裡故意「不要太嚴格」
// 真正商戶資格交給網站 Fetch 後判斷
// ============================================================

function shouldKeepSearchResult(
    result: {
        title: string;
        url: string;
        description: string;
        query?: string;
        keyword?: string;
    }
) {

    if (
        !result?.url
    ) {
        return false;
    }

    if (
        isExcludedDomain(
            result.url
        )
    ) {
        return false;
    }

    if (
        isExcludedPath(
            result.url
        )
    ) {
        return false;
    }

    if (
        isBadTitle(
            result.title
        )
    ) {
        return false;
    }

    const text =
        `${result.title} ${result.description}`
            .toLowerCase();


    // --------------------------------------------------------
    // 明確內容網站
    // --------------------------------------------------------

    const contentHits =
        findSignals(
            text,
            contentSignals
        );

    if (
        contentHits.length >= 4
    ) {
        return false;
    }


    // --------------------------------------------------------
    // 大型平台名稱直接排除
    // --------------------------------------------------------

    const platformNoise = [

        "momo",
        "pchome",
        "shopee",
        "蝦皮",
        "露天",
        "yahoo購物",
        "yahoo shopping",
        "uber eats",
        "foodpanda",
        "tripadvisor",
        "uptogo",
        "pixnet",
        "痞客邦",
    ];

    if (
        platformNoise.some(
            (word) =>
                text.includes(
                    word.toLowerCase()
                )
        )
    ) {

        return false;
    }


    // --------------------------------------------------------
    // 商戶訊號
    // --------------------------------------------------------

    const merchantHits =
        findSignals(
            text,
            merchantSignals
        );

    const paymentHits =
        findSignals(
            text,
            paymentSignals
        );

    const industryHits =
        findSignals(
            text,
            industrySignals
        );


    return (

        merchantHits.length > 0 ||

        paymentHits.length > 0 ||

        industryHits.length > 0

    );
}


// ============================================================
// Recommendation
// ============================================================

function getRecommendation(
    paymentScore: number,
    hasPhysicalStore: boolean,
    platform: string
) {

    const isCooperationPlatform =
        cooperationPlatforms.includes(
            platform
        );

    if (
        isCooperationPlatform &&
        paymentScore >= 40 &&
        hasPhysicalStore
    ) {

        return "已辨識為可合作開店平台，且具明確交易與實體據點需求，建議同步評估線上金流與 POS。";
    }

    if (
        isCooperationPlatform &&
        paymentScore >= 40
    ) {

        return "已辨識為可合作開店平台，且具有明確交易或付款需求，建議優先評估線上金流合作。";
    }

    if (
        paymentScore >= 50 &&
        hasPhysicalStore
    ) {

        return "具明確交易／金流需求，且有實體門市或據點線索，建議同步評估線上金流與 POS。";
    }

    if (
        paymentScore >= 50
    ) {

        return "具明確線上交易或付款需求，建議優先評估全支付線上金流。";
    }

    if (
        hasPhysicalStore
    ) {

        return "網站具有實體門市或據點線索，可進一步確認是否有 POS 金流需求。";
    }

    return "具有一定商業交易潛力，可進一步確認付款、會員、預約或收費流程。";
}


// ============================================================
// Candidate 分析
// ============================================================

async function analyzeCandidate(
    candidate: {
        title: string;
        url: string;
        description: string;
        relevanceScore?: number;
    }
) {

    try {

        // 二次 Domain 防呆
        if (
            isExcludedDomain(
                candidate.url
            )
        ) {
            return null;
        }

        const html =
            await fetchWebsite(
                candidate.url
            );

        if (!html) {
            return null;
        }

        const websiteText =
            cleanHtml(
                html
            );

        const analysis =
            analyzeContent(
                candidate.title,
                candidate.description,
                websiteText
            );

        const platform =
            detectPlatform(
                html
            );

        const brand =
            detectBrand(
                html,
                candidate.url
            );


        // ----------------------------------------------------
        // 搜尋相關性
        // ----------------------------------------------------

        const relevance =
            candidate.relevanceScore ||
            0;


        // ----------------------------------------------------
        // 明顯內容站
        // ----------------------------------------------------

        const contentRatio =
            websiteText.length > 0
                ? findSignals(
                    websiteText,
                    contentSignals
                ).length
                : 0;

        if (
            contentRatio >= 8 &&
            analysis.paymentScore < 30 &&
            analysis.merchantScore < 30
        ) {

            return null;
        }


        // ----------------------------------------------------
        // Lead Score
        // ----------------------------------------------------

        let leadScore =
            analysis.leadScore;

        // 搜尋相關性加權
        leadScore +=
            relevance * 0.20;

        // 官網通常比純搜尋頁重要
        if (
            websiteText.length > 1000
        ) {

            leadScore += 5;
        }

        // 有商品 + 金流
        if (
            analysis.merchantScore >= 30 &&
            analysis.paymentScore >= 30
        ) {

            leadScore += 8;
        }

        // 有實體據點
        if (
            analysis.hasPhysicalStore
        ) {

            leadScore += 5;
        }

        // 合作平台
        if (
            cooperationPlatforms.includes(
                platform.platform
            )
        ) {

            leadScore += 12;
        }

        leadScore =
            Math.round(
                Math.max(
                    0,
                    Math.min(
                        100,
                        leadScore
                    )
                )
            );


        // ----------------------------------------------------
        // 分數太低
        // ----------------------------------------------------

        if (
            leadScore < 18
        ) {

            return null;
        }


        const cooperation =
            cooperationPlatforms.includes(
                platform.platform
            )
                ? "可合作"
                : "暫不可合作";


        return {

            success:
                true,

            title:
                candidate.title,

            url:
                candidate.url,

            description:
                candidate.description,

            brand,

            platform:
                platform.platform,

            cooperation,

            recommendation:
                getRecommendation(
                    analysis.paymentScore,
                    analysis.hasPhysicalStore,
                    platform.platform
                ),

            physicalStore: {

                hasPhysicalStore:
                    analysis.hasPhysicalStore,

                signals:
                    analysis.physicalSignals,
            },

            evidence:
                platform.evidence,

            merchantScore:
                analysis.merchantScore,

            paymentScore:
                analysis.paymentScore,

            physicalScore:
                analysis.physicalScore,

            relevanceScore:
                relevance,

            leadScore,

            merchantSignals:
                analysis.merchantSignals,

            paymentSignals:
                analysis.paymentSignals,

            industrySignals:
                analysis.industrySignals,

            contentSignals:
                analysis.contentSignals,

            hasPaymentNeed:
                analysis.hasPaymentNeed,
        };

    } catch (error) {

        console.error(
            "分析網站失敗：",
            candidate.url,
            error
        );

        return null;
    }
}


// ============================================================
// Yahoo URL 解碼
// ============================================================

function decodeYahooUrl(
    url: string
) {

    try {

        let decoded =
            decodeURIComponent(
                url
            );

        // Yahoo /RU=
        const ruIndex =
            decoded.indexOf(
                "/RU="
            );

        if (
            ruIndex >= 0
        ) {

            const start =
                decoded.indexOf(
                    "http",
                    ruIndex + 4
                );

            if (
                start >= 0
            ) {

                const endings = [
                    "/RS",
                    "/RK",
                ];

                const positions =
                    endings
                        .map(
                            (ending) =>
                                decoded.lastIndexOf(
                                    ending
                                )
                        )
                        .filter(
                            (position) =>
                                position >= start
                        );

                if (
                    positions.length
                ) {

                    return decoded.substring(
                        start,
                        Math.min(
                            ...positions
                        )
                    );
                }

                return decoded.substring(
                    start
                );
            }
        }

        // URL=
        const match =
            decoded.match(
                /(?:RU|URL)=([^&]+)/i
            );

        if (
            match?.[1]
        ) {

            return decodeURIComponent(
                match[1]
            );
        }

        return decoded;

    } catch {

        return url;
    }
}


// ============================================================
// 搜尋結果 HTML 解析
// ============================================================

function parseYahooResults(
    html: string,
    query: string
) {

    const results: {
        title: string;
        url: string;
        description: string;
        query: string;
    }[] = [];


    // ========================================================
    // 方案一
    // Yahoo 新版 algo-sr
    // ========================================================

    const blocks =
        html.match(
            /<div[^>]+class=["'][^"']*\balgo-sr\b[^"']*["'][\s\S]*?<\/div>\s*<\/div>/gi
        ) || [];


    for (
        const block of blocks
    ) {

        // h3 a
        const h3Match =
            block.match(
                /<h3[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i
            );

        // aria-label fallback
        const ariaMatch =
            block.match(
                /<a[^>]+aria-label=["']([^"']+)["'][^>]*>/i
            );

        if (
            !h3Match &&
            !ariaMatch
        ) {
            continue;
        }

        let href =
            h3Match?.[1] ||
            "";

        let title =
            h3Match
                ? cleanSearchText(
                    h3Match[2]
                )
                : ariaMatch?.[1] || "";

        if (!href) {

            const anyHref =
                block.match(
                    /<a[^>]+href=["']([^"']+)["']/i
                );

            href =
                anyHref?.[1] ||
                "";
        }

        if (!href || !title) {
            continue;
        }

        href =
            decodeYahooUrl(
                href
            );

        if (
            !/^https?:\/\//i.test(
                href
            )
        ) {
            continue;
        }

        const descriptionMatch =
            block.match(
                /<div[^>]+class=["'][^"']*\bcompText\b[^"']*["'][\s\S]*?<\/div>/i
            );

        const description =
            descriptionMatch
                ? cleanSearchText(
                    descriptionMatch[0]
                )
                : "";

        results.push({

            title,

            url:
                normalizeUrl(
                    href
                ),

            description,

            query,
        });
    }


    // ========================================================
    // 方案二
    // dd algo
    // ========================================================

    if (
        results.length === 0
    ) {

        const blocks2 =
            html.match(
                /<div[^>]+class=["'][^"']*\balgo\b[^"']*["'][\s\S]*?<\/div>\s*<\/div>/gi
            ) || [];

        for (
            const block of blocks2
        ) {

            const linkMatch =
                block.match(
                    /<h3[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i
                );

            if (!linkMatch) {
                continue;
            }

            let href =
                linkMatch[1];

            href =
                decodeYahooUrl(
                    href
                );

            if (
                !/^https?:\/\//i.test(
                    href
                )
            ) {
                continue;
            }

            const title =
                cleanSearchText(
                    linkMatch[2]
                );

            const descriptionMatch =
                block.match(
                    /<div[^>]+class=["'][^"']*\bcompText\b[^"']*["'][\s\S]*?<\/div>/i
                );

            const description =
                descriptionMatch
                    ? cleanSearchText(
                        descriptionMatch[0]
                    )
                    : "";

            if (!title) {
                continue;
            }

            results.push({

                title,

                url:
                    normalizeUrl(
                        href
                    ),

                description,

                query,
            });
        }
    }


    // ========================================================
    // 方案三
    // 通用 h3
    // ========================================================

    if (
        results.length === 0
    ) {

        const matches =
            Array.from(
                html.matchAll(
                    /<h3[^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/gi
                )
            );

        for (
            const match of matches
        ) {

            let href =
                match[1];

            const title =
                cleanSearchText(
                    match[2]
                );

            href =
                decodeYahooUrl(
                    href
                );

            if (
                !title ||
                !/^https?:\/\//i.test(
                    href
                )
            ) {
                continue;
            }

            results.push({

                title,

                url:
                    normalizeUrl(
                        href
                    ),

                description:
                    "",

                query,
            });
        }
    }


    // ========================================================
    // 去重
    // ========================================================

    const unique =
        new Map<
            string,
            {
                title: string;
                url: string;
                description: string;
                query: string;
            }
        >();

    for (
        const result of results
    ) {

        if (
            !result.url
        ) {
            continue;
        }

        if (
            isExcludedDomain(
                result.url
            )
        ) {
            continue;
        }

        if (
            !unique.has(
                result.url
            )
        ) {

            unique.set(
                result.url,
                result
            );
        }
    }

    return Array.from(
        unique.values()
    );
}


// ============================================================
// Yahoo 搜尋
//
// b = 1 / 21 / 41...
// 每個 query 最多抓 20 筆
// ============================================================

async function searchQuery(
    query: string
) {

    const allResults: {
        title: string;
        url: string;
        description: string;
        query: string;
    }[] = [];


    // ========================================================
    // 搜尋第 1 頁
    // ========================================================

    for (
        const offset of [1, 21]
    ) {

        try {

            console.log(
                "Yahoo 搜尋：",
                query,
                "offset:",
                offset
            );

            const searchUrl =
                `https://tw.search.yahoo.com/search?p=${encodeURIComponent(query)}&b=${offset}&n=20`;

            const response =
                await fetch(
                    searchUrl,
                    {
                        headers: {

                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36",

                            Accept:
                                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                            "Accept-Language":
                                "zh-TW,zh;q=0.9,en;q=0.8",
                        },

                        redirect:
                            "follow",

                        signal:
                            AbortSignal.timeout(
                                12000
                            ),
                    }
                );

            if (
                !response.ok
            ) {

                console.error(
                    "Yahoo HTTP Error:",
                    response.status
                );

                continue;
            }

            const html =
                await response.text();

            const parsed =
                parseYahooResults(
                    html,
                    query
                );

            allResults.push(
                ...parsed
            );

            // Yahoo 被擋 / 沒有結果
            if (
                parsed.length === 0
            ) {
                break;
            }

            await sleep(
                500
            );

        } catch (error) {

            console.error(
                "Yahoo 搜尋失敗：",
                query,
                error
            );
        }
    }


    // ========================================================
    // 去重
    // ========================================================

    const unique =
        new Map<
            string,
            {
                title: string;
                url: string;
                description: string;
                query: string;
            }
        >();

    for (
        const result of allResults
    ) {

        if (
            !result.url
        ) {
            continue;
        }

        if (
            !unique.has(
                result.url
            )
        ) {

            unique.set(
                result.url,
                result
            );
        }
    }

    return Array.from(
        unique.values()
    );
}


// ============================================================
// 搜尋結果文字清理
// ============================================================

function cleanSearchText(
    value: string
) {

    return value

        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )

        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )

        .replace(
            /<[^>]+>/g,
            " "
        )

        .replace(
            /&nbsp;/gi,
            " "
        )

        .replace(
            /&amp;/gi,
            "&"
        )

        .replace(
            /&quot;/gi,
            '"'
        )

        .replace(
            /&#39;/gi,
            "'"
        )

        .replace(
            /&#x27;/gi,
            "'"
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();
}


// ============================================================
// Delay
// ============================================================

function sleep(
    ms: number
) {

    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                ms
            )
    );
}


// ============================================================
// POST
// ============================================================

export async function POST(
    req: Request
) {

    try {

        const body =
            await req.json();

        const keyword =
            String(
                body?.keyword || ""
            ).trim();

        if (!keyword) {

            return NextResponse.json({

                success:
                    false,

                error:
                    "請輸入搜尋關鍵字",
            });
        }


        console.log(
            "===================================="
        );

        console.log(
            "PayLead Finder v2"
        );

        console.log(
            "搜尋產業：",
            keyword
        );


        // ====================================================
        // Query
        // ====================================================

        const allQueries =
            await generateAIQueries(
                keyword
            );

        const queries =
            allQueries
                .filter(Boolean)
                .filter(
                    (
                        query,
                        index,
                        array
                    ) =>
                        array.indexOf(
                            query
                        ) === index
                )
                .slice(
                    0,
                    12
                );

        console.log(
            "搜尋詞：",
            queries
        );


        // ====================================================
        // 搜尋
        // ====================================================

        const rawResults: any[] =
            [];

        for (
            const query of queries
        ) {

            const results =
                await searchQuery(
                    query
                );

            rawResults.push(
                ...results
            );

            // 搜尋引擎保護
            await sleep(
                1200
            );
        }


        console.log(
            "原始搜尋結果：",
            rawResults.length
        );


        // ====================================================
        // 候選池
        //
        // 先不要太早砍
        // ====================================================

        const candidateMap =
            new Map<
                string,
                {
                    title: string;
                    url: string;
                    description: string;
                    query: string;
                    relevanceScore: number;
                }
            >();

        for (
            const result of rawResults
        ) {

            if (
                !result?.url
            ) {
                continue;
            }

            if (
                !shouldKeepSearchResult(
                    result
                )
            ) {

                continue;
            }

            const normalized =
                normalizeUrl(
                    result.url
                );

            if (
                isExcludedDomain(
                    normalized
                )
            ) {
                continue;
            }

            const relevance =
                calculateQueryRelevance(
                    keyword,
                    result.query || "",
                    result.title || "",
                    result.description || ""
                );


            // 完全無關的結果直接淘汰
            if (
                relevance < 10
            ) {
                continue;
            }


            const existing =
                candidateMap.get(
                    normalized
                );

            if (!existing) {

                candidateMap.set(
                    normalized,
                    {

                        ...result,

                        url:
                            normalized,

                        relevanceScore:
                            relevance,
                    }
                );

            } else {

                // 同一網站如果被不同搜尋詞找到
                // 保留最高相關性
                existing.relevanceScore =
                    Math.max(
                        existing.relevanceScore,
                        relevance
                    );
            }
        }


        // ====================================================
        // 候選排序
        //
        // 搜尋相關性高的先分析
        // ====================================================

        const candidates =
            Array.from(
                candidateMap.values()
            )
                .sort(
                    (a, b) =>
                        b.relevanceScore -
                        a.relevanceScore
                )
                .slice(
                    0,
                    80
                );


        console.log(
            "候選網站：",
            candidates.length
        );


        // ====================================================
        // 分析網站
        //
        // 每批 5 筆
        // ====================================================

        const results: any[] =
            [];

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

            const batchResults =
                await Promise.all(
                    batch.map(
                        (
                            candidate
                        ) =>
                            analyzeCandidate(
                                candidate
                            )
                    )
                );

            results.push(
                ...batchResults.filter(
                    Boolean
                )
            );

            await sleep(
                250
            );
        }


        // ====================================================
        // 最終排序
        //
        // 1. 合作平台
        // 2. Lead Score
        // 3. 搜尋相關性
        // ====================================================

        results.sort(
            (a, b) => {

                const aPlatform =
                    cooperationPlatforms.includes(
                        a.platform
                    )
                        ? 1
                        : 0;

                const bPlatform =
                    cooperationPlatforms.includes(
                        b.platform
                    )
                        ? 1
                        : 0;

                if (
                    aPlatform !==
                    bPlatform
                ) {

                    return (
                        bPlatform -
                        aPlatform
                    );
                }

                if (
                    b.leadScore !==
                    a.leadScore
                ) {

                    return (
                        b.leadScore -
                        a.leadScore
                    );
                }

                return (
                    (b.relevanceScore || 0) -
                    (a.relevanceScore || 0)
                );
            }
        );


        // ====================================================
        // 最終 30
        // ====================================================

        const finalResults =
            results.slice(
                0,
                30
            );


        console.log(
            "最終結果：",
            finalResults.length
        );

        console.log(
            "合作平台結果：",
            finalResults.filter(
                (item) =>
                    item.cooperation ===
                    "可合作"
            ).length
        );

        console.log(
            "===================================="
        );


        // ====================================================
        // Response
        // ====================================================

        return NextResponse.json({

            success:
                true,

            keyword,

            queryCount:
                queries.length,

            searchedQueries:
                queries,

            rawCount:
                rawResults.length,

            candidateCount:
                candidates.length,

            analyzedCount:
                results.length,

            count:
                finalResults.length,

            results:
                finalResults,
        });

    } catch (error) {

        console.error(
            "Search API Error:",
            error
        );

        return NextResponse.json(

            {

                success:
                    false,

                error:
                    error instanceof Error
                        ? error.message
                        : "搜尋發生錯誤",
            },

            {
                status:
                    500,
            }
        );
    }
}