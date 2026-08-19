import { NextResponse } from "next/server";

// ============================================================
// PayLead Finder
// 一般商戶搜尋 API
//
// 搜尋引擎：Yahoo Search HTML
//
// 核心邏輯
// 1. 最多 8 組搜尋詞
// 2. 搜尋「產業 + 商業行為」，不搜尋開店平台名稱
// 3. 開店平台只負責網站分析 / 辨識
// 4. 排除便利商店、電商平台、新聞、教學、論壇等
// 5. 最多分析 40 個候選網站
// 6. 最終輸出 30 筆
// 7. 合作平台優先排序
// 8. 搜尋請求循序執行，避免搜尋引擎 Ratelimit
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
//
// 注意：
// 這裡只負責「辨識網站」
// 不拿平台名稱去搜尋
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
// 排除網域
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

    // --------------------------------------------------------
    // 電商平台 / 大型平台
    // --------------------------------------------------------

    "shopee.tw",
    "shopee.com",
    "momo.com.tw",
    "pchome.com.tw",
    "ruten.com.tw",
    "taobao.com",
    "tmall.com",
    "jd.com",
    "1688.com",
    "amazon.com",
    "amazon.com.tw",

    "yahoo.com",
    "shopping.yahoo.com",
    "tw.buy.yahoo.com",

    // --------------------------------------------------------
    // 搜尋引擎
    // --------------------------------------------------------

    "google.com",
    "google.com.tw",
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

    // --------------------------------------------------------
    // Blog / 發文
    // --------------------------------------------------------

    "medium.com",
    "substack.com",
    "blogspot.com",
    "wordpress.com",

    // --------------------------------------------------------
    // 評論 / 旅遊
    // --------------------------------------------------------

    "tripadvisor.com",
    "tripadvisor.com.tw",

    // --------------------------------------------------------
    // 求職
    // --------------------------------------------------------

    "104.com.tw",
    "1111.com.tw",
    "518.com.tw",

    // --------------------------------------------------------
    // 知識
    // --------------------------------------------------------

    "wikipedia.org",

    // --------------------------------------------------------
    // 聚合 / CDN
    // --------------------------------------------------------

    "googleusercontent.com",
];


// ============================================================
// 明確排除的網域
// ============================================================

const hardExcludedDomains = [

    // 便利商店
    "7-11.com.tw",
    "7-11.com",
    "family.com.tw",
    "hilife.com.tw",
    "okmart.com.tw",

    // 超商 / 大型零售
    "pxmart.com.tw",
    "carrefour.com.tw",
    "costco.com.tw",

    // 大型服飾品牌
    "uniqlo.com",
    "gu-global.com",
    "giordano.com",

    // 平台 / SaaS 教學
    "cyberbiz.io",
    "supportmeepshop.com",
    "support.shoplineapp.com",

    // 政府 / 公共
    "gov.tw",

    // 部分大型品牌搜尋雜訊
    "yahoo.com.tw",
];


// ============================================================
// 排除路徑
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

    // 教學
    "/help",
    "/support",
    "/docs",
    "/documentation",
    "/tutorial",
    "/tutorials",
    "/guide",
    "/guides",

    // 搜尋結果
    "/search",
    "/search/",
    "/query",
];


// ============================================================
// 排除標題關鍵字
// ============================================================

const excludedTitleSignals = [

    // 新聞
    "新聞",
    "新聞網",
    "新聞報導",
    "最新消息",
    "即時新聞",
    "報導",

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

    // 購物聚合
    "購物中心",
    "優惠推薦",
    "比價",
    "商品比較",
];


// ============================================================
// 商戶訊號
// ============================================================

const merchantSignals = [

    // 電商
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

    // 會員
    "會員",
    "會員登入",
    "會員中心",
    "登入",
    "註冊",
    "login",
    "register",
    "membership",

    // 金流
    "付款",
    "支付",
    "信用卡",
    "電子支付",
    "行動支付",
    "線上付款",
    "線上支付",
    "payment",
    "pay",

    // 預約
    "預約",
    "線上預約",
    "預約服務",
    "booking",
    "reservation",

    // 訂閱
    "訂閱",
    "訂閱制",
    "subscription",
    "月費",
    "月租",
    "續費",
    "自動扣款",

    // 實體
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

    "健身",
    "瑜珈",
    "美容",
    "美髮",
    "按摩",
    "清潔",
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
// Query 清理
// ============================================================

function sanitizeQuery(query: string) {

    let result =
        query.trim();

    for (
        const word of locationWords
    ) {

        result =
            result.replace(
                new RegExp(
                    word,
                    "gi"
                ),
                " "
            );
    }

    for (
        const word of genericBusinessWords
    ) {

        result =
            result.replace(
                new RegExp(
                    word,
                    "gi"
                ),
                " "
            );
    }

    return result
        .replace(
            /\s+/g,
            " "
        )
        .trim();
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
            !/^https?:\/\//i.test(
                value
            )
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
            .replace(
                /^www\./,
                ""
            );

    } catch {

        return "";
    }
}


// ============================================================
// 排除 Domain
// ============================================================

function isExcludedDomain(
    url: string
) {

    const hostname =
        getHostname(url);

    if (!hostname) {
        return true;
    }

    const normalExcluded =
        excludedDomains.some(
            (domain) =>
                hostname === domain ||
                hostname.endsWith(
                    `.${domain}`
                )
        );

    if (normalExcluded) {
        return true;
    }

    const hardExcluded =
        hardExcludedDomains.some(
            (domain) =>
                hostname === domain ||
                hostname.endsWith(
                    `.${domain}`
                )
        );

    if (hardExcluded) {
        return true;
    }

    return false;
}


// ============================================================
// 排除 Path
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
                            6000
                        ),
                }
            );

        if (
            !response.ok
        ) {
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
    // Merchant Score
    // --------------------------------------------------------

    let merchantScore =
        merchantFound.length * 6;

    if (
        websiteText.length > 500
    ) {
        merchantScore += 10;
    }


    // --------------------------------------------------------
    // Payment Score
    // --------------------------------------------------------

    let paymentScore =
        paymentFound.length * 7;

    paymentScore +=
        industryFound.length * 4;


    // --------------------------------------------------------
    // Physical / POS Score
    // --------------------------------------------------------

    let physicalScore =
        physicalFound.length * 8;


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
    // 內容網站扣分
    // --------------------------------------------------------

    const contentPenalty =
        contentFound.length * 4;


    // --------------------------------------------------------
    // Lead Score
    // --------------------------------------------------------

    let leadScore =
        merchantScore * 0.35 +
        paymentScore * 0.4 +
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
            merchantFound.slice(
                0,
                15
            ),

        paymentSignals:
            paymentFound.slice(
                0,
                15
            ),

        physicalSignals:
            physicalFound.slice(
                0,
                15
            ),

        industrySignals:
            industryFound.slice(
                0,
                15
            ),

        contentSignals:
            contentFound.slice(
                0,
                10
            ),

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
// ============================================================

function getFallbackQueries(
    keyword: string
) {

    const cleanKeyword =
        sanitizeQuery(
            keyword
        );

    const queries = [

        `${cleanKeyword} 線上購物 商品`,

        `${cleanKeyword} 線上訂購 付款`,

        `${cleanKeyword} 購物車 結帳`,

        `${cleanKeyword} 線上付款`,

        `${cleanKeyword} 線上預約 收費`,

        `${cleanKeyword} 會員 註冊 收費`,

        `${cleanKeyword} 門市 分店`,

        `${cleanKeyword} 商品 售價`,
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
            8
        );
}


// ============================================================
// AI 搜尋策略
//
// 沒有 OPENAI_API_KEY 時直接使用固定搜尋策略
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

        console.log(
            "沒有 OPENAI_API_KEY，使用固定搜尋策略"
        );

        return fallback;
    }


    const prompt = `
你是 B2B 支付商務開發搜尋專家。

使用者輸入的產業：
${keyword}

請產生最多 8 組搜尋詞。

目標：
找到「真正有自己網站、具有交易或付款需求的商戶」。

搜尋詞只能使用：
「產業 + 商業行為」

不要搜尋任何開店平台名稱。

禁止出現：
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

可以使用的商業行為：

線上購物
線上訂購
商品
商品購買
商品售價
購物車
結帳
付款
線上付款
預約
收費
會員
會員註冊
訂閱
月費
門市
分店
租借
票券

不要搜尋：

新聞
媒體
文章
論壇
評論
教學
操作說明
Help
Docs
Support
購物中心
比價
優惠推薦

不要加入地區名稱。

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
                                0.4,

                            messages: [

                                {
                                    role:
                                        "system",

                                    content:
                                        "你只負責產生 B2B 商戶搜尋詞，而且不得使用任何開店平台名稱。",
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

        if (
            !response.ok
        ) {

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
            !Array.isArray(
                parsed
            )
        ) {

            throw new Error(
                "OpenAI 格式錯誤"
            );
        }

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
                    8
                );

        if (
            aiQueries.length ===
            0
        ) {

            return fallback;
        }

        return aiQueries;

    } catch (error) {

        console.error(
            "AI 搜尋策略失敗，改用固定策略：",
            error
        );

        return fallback;
    }
}


// ============================================================
// 搜尋結果標題是否為垃圾結果
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
// 搜尋結果是否值得保留
// ============================================================

function shouldKeepSearchResult(
    result: {
        title: string;
        url: string;
        description: string;
    }
) {

    // --------------------------------------------------------
    // Domain
    // --------------------------------------------------------

    if (
        isExcludedDomain(
            result.url
        )
    ) {

        return false;
    }


    // --------------------------------------------------------
    // Path
    // --------------------------------------------------------

    if (
        isExcludedPath(
            result.url
        )
    ) {

        return false;
    }


    // --------------------------------------------------------
    // 標題
    // --------------------------------------------------------

    if (
        isBadTitle(
            result.title
        )
    ) {

        return false;
    }


    // --------------------------------------------------------
    // 內容
    // --------------------------------------------------------

    const text =
        `${result.title} ${result.description}`
            .toLowerCase();


    // --------------------------------------------------------
    // 內容型網站
    // --------------------------------------------------------

    const contentHits =
        contentSignals.filter(
            (signal) =>
                text.includes(
                    signal.toLowerCase()
                )
        );

    if (
        contentHits.length >= 3
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


    // --------------------------------------------------------
    // 沒有任何商業訊號
    // --------------------------------------------------------

    return (

        merchantHits.length > 0 ||

        paymentHits.length > 0 ||

        industryHits.length > 0

    );
}


// ============================================================
// 開發建議
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
// 分析 Candidate
// ============================================================

async function analyzeCandidate(
    candidate: {
        title: string;
        url: string;
        description: string;
    }
) {

    try {

        const html =
            await fetchWebsite(
                candidate.url
            );

        const websiteText =
            html
                ? cleanHtml(html)
                : "";

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
            html

                ? detectBrand(
                    html,
                    candidate.url
                )

                : candidate.title;


        // ----------------------------------------------------
        // 分數太低不保留
        // ----------------------------------------------------

        if (
            analysis.leadScore < 10
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

            leadScore:
                analysis.leadScore,

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
// Yahoo 搜尋
//
// 不需要 API Key
// 不需要付費
// ============================================================

async function searchQuery(
    query: string
) {

    try {

        console.log(
            "Yahoo 搜尋：",
            query
        );

        const searchUrl =
            `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;

        const response =
            await fetch(
                searchUrl,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36",

                        "Accept":
                            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                        "Accept-Language":
                            "zh-TW,zh;q=0.9,en;q=0.8",
                    },

                    redirect:
                        "follow",

                    signal:
                        AbortSignal.timeout(
                            10000
                        ),
                }
            );

        if (
            !response.ok
        ) {

            console.error(
                "Yahoo 搜尋 HTTP Error：",
                response.status
            );

            return [];
        }

        const html =
            await response.text();

        const results: {
            title: string;
            url: string;
            description: string;
            query: string;
        }[] = [];


        // ----------------------------------------------------
        // Yahoo 一般搜尋結果
        // ----------------------------------------------------

        const blocks =
            html.match(
                /<div[^>]+class=["'][^"']*\balgo\b[^"']*["'][\s\S]*?<\/div>\s*<\/div>/gi
            ) || [];


        for (
            const block of blocks
        ) {

            const linkMatch =
                block.match(
                    /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i
                );

            if (
                !linkMatch
            ) {
                continue;
            }

            let href =
                linkMatch[1];

            const title =
                cleanSearchText(
                    linkMatch[2]
                );

            if (
                !href ||
                !title
            ) {
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
                    /<p[^>]*>([\s\S]*?)<\/p>/i
                );

            const description =
                descriptionMatch
                    ? cleanSearchText(
                        descriptionMatch[1]
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


        // ----------------------------------------------------
        // Yahoo HTML 結構 fallback
        // ----------------------------------------------------

        if (
            results.length === 0
        ) {

            const linkMatches =
                Array.from(
                    html.matchAll(
                        /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
                    )
                );

            for (
                const match of linkMatches
            ) {

                const href =
                    match[1];

                const title =
                    cleanSearchText(
                        match[2]
                    );

                if (
                    !title ||
                    !href
                ) {
                    continue;
                }

                if (
                    isExcludedDomain(
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

                if (
                    results.length >= 10
                ) {
                    break;
                }
            }
        }


        // ----------------------------------------------------
        // URL 去重
        // ----------------------------------------------------

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
        ).slice(
            0,
            10
        );

    } catch (error) {

        console.error(
            "Yahoo 搜尋失敗：",
            query,
            error
        );

        return [];
    }
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
// Yahoo Redirect URL 解碼
// ============================================================

function decodeYahooUrl(
    url: string
) {

    try {

        const decoded =
            decodeURIComponent(
                url
            );

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
            "PayLead Finder"
        );

        console.log(
            "搜尋產業：",
            keyword
        );


        // ====================================================
        // 產生搜尋詞
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
                    8
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

            // 搜尋引擎 Ratelimit 保護
            await sleep(
                800
            );
        }


        console.log(
            "原始搜尋結果：",
            rawResults.length
        );


        // ====================================================
        // URL 去重
        // ====================================================

        const uniqueMap =
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
                !uniqueMap.has(
                    normalized
                )
            ) {

                uniqueMap.set(
                    normalized,
                    {
                        ...result,
                        url:
                            normalized,
                    }
                );
            }
        }


        // ====================================================
        // 候選網站
        //
        // 40 筆
        // ====================================================

        const candidates =
            Array.from(
                uniqueMap.values()
            ).slice(
                0,
                40
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
                200
            );
        }


        // ====================================================
        // 排序
        //
        // 1. 合作平台優先
        // 2. Lead Score 高優先
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

                return (
                    b.leadScore -
                    a.leadScore
                );
            }
        );


        // ====================================================
        // 最終 30 筆
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
        // API Response
        // ====================================================

        return NextResponse.json({

            success:
                true,

            keyword,

            queryCount:
                queries.length,

            searchedQueries:
                queries,

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