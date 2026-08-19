import { NextResponse } from "next/server";
import { DDGS } from "@phukon/duckduckgo-search";

export const dynamic = "force-dynamic";

// ============================================================
// PayLead Finder v5
//
// 核心策略
//
// 1. 不使用 OpenAI
// 2. 不使用 Yahoo
// 3. 不直接解析 Bing / Google HTML
// 4. DuckDuckGo Search library 為主搜尋層
// 5. 搜尋詞依產業自動擴展
// 6. 搜尋階段寬進
// 7. Domain / Path / Title / SEO 多層排除
// 8. Website Fetch 後再次確認商戶資格
// 9. 台灣商戶優先
// 10. 合作平台優先
// 11. 搜尋快取
// 12. 最多分析 60 個網站
// 13. 最終輸出 30 筆
//
// 完全不使用 OPENAI
// ============================================================


// ============================================================
// Type
// ============================================================

type SearchResult = {
    title: string;
    url: string;
    description: string;
    query: string;
    source: string;
};

type Candidate = SearchResult & {
    relevanceScore: number;
    appearanceCount: number;
};

type PlatformResult = {
    platform: string;
    evidence: string[];
};


// ============================================================
// Cooperation Platforms
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
// Platform Fingerprints
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
            "qdmppid",
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
            "shopify-section",
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

    {
        name: "cyberbiz",
        keywords: [
            "cyberbiz",
            "cyberbiz.io",
        ],
    },

    {
        name: "meepshop",
        keywords: [
            "meepshop",
            "meepcloud",
        ],
    },
];


// ============================================================
// Excluded Domains
// ============================================================

const excludedDomains = [

    // ========================================================
    // Search
    // ========================================================

    "google.com",
    "google.com.tw",
    "bing.com",
    "yahoo.com",
    "yahoo.com.tw",
    "duckduckgo.com",

    // ========================================================
    // Social
    // ========================================================

    "facebook.com",
    "instagram.com",
    "youtube.com",
    "youtu.be",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "threads.net",
    "pinterest.com",

    // ========================================================
    // Marketplace
    // ========================================================

    "momo.com.tw",
    "momoshop.com.tw",

    "pchome.com.tw",

    "shopee.tw",
    "shopee.com",

    "ruten.com.tw",

    "buy123.com.tw",

    "taobao.com",
    "tmall.com",
    "1688.com",
    "jd.com",

    "amazon.com",
    "amazon.com.tw",

    // ========================================================
    // Delivery / Aggregator
    // ========================================================

    "ubereats.com",

    "foodpanda.com",
    "foodpanda.com.tw",

    "inline.app",
    "inline.company",

    "eztable.com",

    "shopback.com",
    "shopback.com.tw",

    // ========================================================
    // Travel / Review
    // ========================================================

    "tripadvisor.com",
    "tripadvisor.com.tw",

    // ========================================================
    // Media
    // ========================================================

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
    "cna.com.tw",

    // ========================================================
    // Blog / Content
    // ========================================================

    "medium.com",
    "substack.com",
    "blogspot.com",
    "wordpress.com",
    "pixnet.net",
    "xuite.net",

    // ========================================================
    // Forum / Q&A
    // ========================================================

    "wikipedia.org",

    "faq.tw",
    "faqs.tw",

    "ptt.cc",
    "dcard.tw",

    "reddit.com",
    "quora.com",

    // ========================================================
    // Jobs
    // ========================================================

    "104.com.tw",
    "1111.com.tw",
    "518.com.tw",

    // ========================================================
    // Government
    // ========================================================

    "gov.tw",
];


// ============================================================
// Hard Excluded Domains
// ============================================================

const hardExcludedDomains = [

    // ========================================================
    // Convenience
    // ========================================================

    "7-11.com.tw",
    "7-11.com",

    "family.com.tw",

    "hilife.com.tw",

    "okmart.com.tw",

    // ========================================================
    // Large Retail
    // ========================================================

    "pxmart.com.tw",

    "carrefour.com.tw",

    "costco.com.tw",

    // ========================================================
    // Large Brands
    // ========================================================

    "uniqlo.com",

    "gu-global.com",

    "giordano.com",

    // ========================================================
    // SaaS Company Itself
    // ========================================================

    "cyberbiz.io",

    "meepshop.com",

    "supportmeepshop.com",

    "shoplineapp.com",

    "support.shoplineapp.com",

    // ========================================================
    // Known SEO Noise
    // ========================================================

    "uptogo.com.tw",

    "vibeaico.com",

    "rosy-arts.com",

    "whbydcc.com",

    // ========================================================
    // Known Irrelevant
    // ========================================================

    "nissan-rentacar.com",
    "nissan-rentacar.com.tw",
];


// ============================================================
// Foreign Domains
//
// 明確不是台灣市場的先砍
// .com / .org 保留，因為很多台灣品牌使用
// ============================================================

const foreignTlds = [
    ".jp",
    ".co.jp",

    ".hk",
    ".com.hk",

    ".cn",
    ".com.cn",

    ".kr",

    ".sg",

    ".my",

    ".ph",

    ".in",

    ".de",

    ".fr",

    ".co.uk",
];


// ============================================================
// Excluded Paths
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
    "/tags",

    "/help",
    "/support",

    "/docs",
    "/documentation",

    "/tutorial",
    "/tutorials",

    "/guide",
    "/guides",

    "/search",
    "/query",
];


// ============================================================
// Bad Titles
// ============================================================

const excludedTitleSignals = [

    "新聞",
    "新聞網",
    "即時新聞",

    "懶人包",

    "攻略",

    "排行榜",

    "推薦排行",

    "推薦清單",

    "完整整理",

    "評論",

    "心得",

    "評價",

    "比較",

    "比價",

    "教學",

    "操作說明",

    "使用說明",

    "痞客邦",

    "pixnet",

    "網路開店",

    "開店平台",

    "架站平台",
];


// ============================================================
// Search Result Noise
// ============================================================

const platformNoise = [

    "momo",

    "pchome",

    "shopee",
    "蝦皮",

    "露天",

    "yahoo購物",

    "uber eats",
    "ubereats",

    "foodpanda",

    "tripadvisor",

    "uptogo",

    "pixnet",
    "痞客邦",

    "shop2000",

    "網路開店平台",

    "如何開店",

    "開店教學",
];


// ============================================================
// Merchant Strong Signals
// ============================================================

const strongMerchantSignals = [

    "加入購物車",

    "購物車",

    "立即購買",

    "立即訂購",

    "checkout",

    "add to cart",

    "線上訂購",

    "線上購物",

    "線上預約",

    "立即預約",

    "會員登入",

    "會員中心",

    "門市資訊",

    "門市據點",

    "分店資訊",

    "線上付款",

    "信用卡付款",
];


// ============================================================
// Merchant Signals
// ============================================================

const merchantSignals = [

    "商品",

    "產品",

    "價格",

    "售價",

    "購物車",

    "加入購物車",

    "立即購買",

    "立即訂購",

    "訂購",

    "購買",

    "商城",

    "商店",

    "網路商店",

    "線上商店",

    "cart",

    "checkout",

    "會員",

    "會員登入",

    "會員中心",

    "登入",

    "註冊",

    "login",

    "register",

    "付款",

    "支付",

    "信用卡",

    "預約",

    "線上預約",

    "訂閱",

    "月費",

    "門市",

    "門店",

    "分店",

    "據點",

    "店面",

    "專櫃",
];


// ============================================================
// Payment Signals
// ============================================================

const paymentSignals = [

    "付款",

    "支付",

    "信用卡",

    "信用卡付款",

    "電子支付",

    "行動支付",

    "線上付款",

    "線上支付",

    "結帳",

    "checkout",

    "payment",

    "訂金",

    "押金",

    "尾款",

    "自動扣款",

    "定期扣款",

    "會員扣款",

    "續費",

    "月費",

    "月租",

    "訂閱",

    "subscription",

    "預約付款",

    "停車繳費",

    "停車費",

    "充電費",
];


// ============================================================
// Physical Signals
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

    "門市地址",

    "營業時間",

    "店址",

    "旗艦店",

    "專櫃",

    "展售中心",

    "服務中心",

    "stores",

    "locations",

    "branch",

    "retail",
];


// ============================================================
// Content Signals
// ============================================================

const contentSignals = [

    "新聞",

    "媒體",

    "雜誌",

    "報導",

    "文章",

    "作者",

    "編輯",

    "專訪",

    "評論",

    "心得",

    "news",

    "media",

    "magazine",

    "article",

    "editor",

    "懶人包",

    "攻略",

    "排行榜",

    "推薦清單",
];


// ============================================================
// Taiwan Signals
// ============================================================

const taiwanSignals = [

    "台灣",
    "臺灣",

    "台北",
    "臺北",

    "新北",

    "桃園",

    "新竹",

    "苗栗",

    "台中",
    "臺中",

    "彰化",

    "南投",

    "雲林",

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

    "taiwan",

    "taipei",

    "kaohsiung",
];


// ============================================================
// Search Cache
// ============================================================

const searchCache =
    new Map<
        string,
        {
            time: number;
            results: SearchResult[];
        }
    >();

const CACHE_TTL =
    10 * 60 * 1000;


// ============================================================
// Sleep
// ============================================================

function sleep(ms: number) {

    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                ms
            )
    );
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
// Root URL
// ============================================================

function getRootUrl(
    url: string
) {

    try {

        const parsed =
            new URL(url);

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
// Normalize URL
// ============================================================

function normalizeUrl(
    rawUrl: string
) {

    try {

        let value =
            rawUrl.trim();

        if (!value) {
            return "";
        }

        if (
            value.startsWith("//")
        ) {

            value =
                `https:${value}`;
        }

        if (
            !/^https?:\/\//i.test(
                value
            )
        ) {

            return "";
        }

        const parsed =
            new URL(value);

        parsed.hash = "";

        const pathname =
            parsed.pathname === "/"
                ? ""
                : parsed.pathname
                    .replace(
                        /\/+$/,
                        ""
                    );

        return (
            parsed.protocol +
            "//" +
            parsed.hostname +
            pathname
        );

    } catch {

        return "";
    }
}


// ============================================================
// Domain Filter
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

    if (
        allExcluded.some(
            (domain) =>
                hostname === domain ||
                hostname.endsWith(
                    `.${domain}`
                )
        )
    ) {

        return true;
    }


    if (
        foreignTlds.some(
            (tld) =>
                hostname.endsWith(
                    tld
                )
        )
    ) {

        return true;
    }

    return false;
}


// ============================================================
// Path Filter
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

        return true;
    }
}


// ============================================================
// URL Firewall
// ============================================================

function shouldExcludeUrl(
    url: string
) {

    if (!url) {
        return true;
    }

    if (
        isExcludedDomain(
            url
        )
    ) {

        return true;
    }

    if (
        isExcludedPath(
            url
        )
    ) {

        return true;
    }

    return false;
}


// ============================================================
// Search Text Clean
// ============================================================

function cleanSearchText(
    value: string
) {

    return String(
        value || ""
    )

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
            /<iframe[\s\S]*?<\/iframe>/gi,
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
// Signals
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
// Industry Expansion
//
// 這裡解決：
// 使用者輸入過度廣泛詞時搜尋品質低
// ============================================================

function expandIndustryKeyword(
    keyword: string
) {

    const lower =
        keyword
            .trim()
            .toLowerCase();


    if (
        lower.includes("百貨")
    ) {

        return [
            keyword,
            "百貨公司",
            "購物中心",
            "商場",
        ];
    }


    if (
        lower.includes("手搖") ||
        lower.includes("茶飲")
    ) {

        return [
            keyword,
            "手搖飲料",
            "茶飲品牌",
            "飲料店",
        ];
    }


    if (
        lower.includes("短袖") ||
        lower.includes("t恤") ||
        lower.includes("t-shirt")
    ) {

        return [
            keyword,
            "服飾",
            "T恤",
            "上衣",
            "服裝品牌",
        ];
    }


    if (
        lower.includes("健身")
    ) {

        return [
            keyword,
            "健身房",
            "運動中心",
            "健身品牌",
        ];
    }


    if (
        lower.includes("活動票券") ||
        lower.includes("票券")
    ) {

        return [
            keyword,
            "售票",
            "活動售票",
            "展演票券",
            "表演票券",
        ];
    }


    if (
        lower.includes("餐廳") ||
        lower.includes("餐飲")
    ) {

        return [
            keyword,
            "餐廳",
            "餐飲品牌",
        ];
    }


    if (
        lower.includes("寵物")
    ) {

        return [
            keyword,
            "寵物用品",
            "寵物品牌",
            "寵物商店",
        ];
    }


    if (
        lower.includes("美容")
    ) {

        return [
            keyword,
            "美容",
            "美容工作室",
            "美容品牌",
        ];
    }


    return [
        keyword,
    ];
}


// ============================================================
// Search Queries
//
// 不要 12~20 組亂轟
// 精準 6~8 組效果反而比較好
// ============================================================

function getSearchQueries(
    keyword: string
) {

    const variants =
        expandIndustryKeyword(
            keyword
        );


    const primary =
        variants[0];


    const queries = [

        `${primary} 台灣 官網`,

        `${primary} 台灣 官方網站`,

        `${primary} 台灣 品牌`,

        `${primary} 台灣 門市`,

        `${primary} 台灣 線上購物`,

        `${primary} 台灣 線上訂購`,
    ];


    for (
        const variant
        of variants.slice(
            1,
            4
        )
    ) {

        queries.push(
            `${variant} 台灣 官網`
        );
    }


    return queries

        .map(
            (item) =>
                item
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim()
        )

        .filter(Boolean)

        .filter(
            (
                item,
                index,
                array
            ) =>
                array.indexOf(
                    item
                ) === index
        )

        .slice(
            0,
            8
        );
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
// Relevance
// ============================================================

function calculateRelevance(
    keyword: string,
    title: string,
    description: string
) {

    const keywordLower =
        keyword
            .trim()
            .toLowerCase();

    const titleLower =
        title
            .toLowerCase();

    const descriptionLower =
        description
            .toLowerCase();


    let score = 0;


    // ========================================================
    // Exact Keyword
    // ========================================================

    if (
        titleLower.includes(
            keywordLower
        )
    ) {

        score += 45;
    }


    if (
        descriptionLower.includes(
            keywordLower
        )
    ) {

        score += 25;
    }


    // ========================================================
    // Industry Expansion
    // ========================================================

    const variants =
        expandIndustryKeyword(
            keyword
        );


    for (
        const variant
        of variants
    ) {

        const lower =
            variant.toLowerCase();

        if (
            titleLower.includes(
                lower
            )
        ) {

            score += 18;
        }

        if (
            descriptionLower.includes(
                lower
            )
        ) {

            score += 8;
        }
    }


    // ========================================================
    // Chinese Bigram
    // ========================================================

    if (
        keywordLower.length >= 2
    ) {

        for (
            let i = 0;
            i <
            keywordLower.length - 1;
            i++
        ) {

            const token =
                keywordLower.slice(
                    i,
                    i + 2
                );


            if (
                titleLower.includes(
                    token
                )
            ) {

                score += 6;
            }


            if (
                descriptionLower.includes(
                    token
                )
            ) {

                score += 3;
            }
        }
    }


    // ========================================================
    // Official Site Signals
    // ========================================================

    if (
        titleLower.includes(
            "官網"
        ) ||
        titleLower.includes(
            "官方"
        )
    ) {

        score += 10;
    }


    return Math.min(
        100,
        score
    );
}


// ============================================================
// Search Result Qualification
// ============================================================

function shouldKeepSearchResult(
    result: SearchResult,
    keyword: string
) {

    if (
        shouldExcludeUrl(
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


    // ========================================================
    // Marketplace / Noise
    // ========================================================

    if (
        platformNoise.some(
            (signal) =>
                text.includes(
                    signal.toLowerCase()
                )
        )
    ) {

        return false;
    }


    // ========================================================
    // Content Site
    // ========================================================

    const contentHits =
        findSignals(
            text,
            contentSignals
        );


    if (
        contentHits.length >= 3
    ) {

        return false;
    }


    // ========================================================
    // Relevance
    // ========================================================

    const relevance =
        calculateRelevance(
            keyword,
            result.title,
            result.description
        );


    if (
        relevance < 15
    ) {

        return false;
    }


    return true;
}


// ============================================================
// DDG Search
// ============================================================

async function searchDuckDuckGo(
    query: string
): Promise<SearchResult[]> {

    // ========================================================
    // Cache
    // ========================================================

    const cache =
        searchCache.get(
            query
        );


    if (
        cache &&
        Date.now() -
        cache.time <
        CACHE_TTL
    ) {

        console.log(
            "🟢 Search Cache：",
            query,
            cache.results.length
        );

        return cache.results;
    }


    const ddgs =
        new DDGS({
            timeout:
                12000,
        });


    // ========================================================
    // 第一輪
    // backend auto
    // ========================================================

    try {

        console.log(
            "🔎 DDG Search：",
            query
        );


        const results =
            await ddgs.text({

                keywords:
                    query,

                region:
                    "wt-wt",

                safesearch:
                    "moderate",

                backend:
                    "auto",

                maxResults:
                    15,
            });


        const parsed:
            SearchResult[] =
            (Array.isArray(results)
                ? results
                : []
            )

                .map(
                    (item: any) => {

                        const url =
                            normalizeUrl(
                                String(
                                    item?.href ||
                                    item?.url ||
                                    ""
                                )
                            );


                        return {

                            title:
                                cleanSearchText(
                                    String(
                                        item?.title ||
                                        ""
                                    )
                                ),

                            url,

                            description:
                                cleanSearchText(
                                    String(
                                        item?.body ||
                                        item?.description ||
                                        ""
                                    )
                                ),

                            query,

                            source:
                                "DuckDuckGo",
                        };
                    }
                )

                .filter(
                    (item) =>
                        item.url &&
                        item.title
                );


        if (
            parsed.length > 0
        ) {

            searchCache.set(
                query,
                {
                    time:
                        Date.now(),

                    results:
                        parsed,
                }
            );


            console.log(
                "✅ DDG Results：",
                query,
                parsed.length
            );


            return parsed;
        }

    } catch (error) {

        console.log(
            "⚠️ DDG auto failed：",
            query
        );
    }


    // ========================================================
    // 第二輪
    // HTML backend fallback
    // ========================================================

    try {

        await sleep(
            900
        );


        console.log(
            "🔄 DDG HTML fallback：",
            query
        );


        const results =
            await ddgs.text({

                keywords:
                    query,

                region:
                    "wt-wt",

                safesearch:
                    "moderate",

                backend:
                    "html",

                maxResults:
                    15,
            });


        const parsed:
            SearchResult[] =
            (Array.isArray(results)
                ? results
                : []
            )

                .map(
                    (item: any) => {

                        const url =
                            normalizeUrl(
                                String(
                                    item?.href ||
                                    item?.url ||
                                    ""
                                )
                            );


                        return {

                            title:
                                cleanSearchText(
                                    String(
                                        item?.title ||
                                        ""
                                    )
                                ),

                            url,

                            description:
                                cleanSearchText(
                                    String(
                                        item?.body ||
                                        item?.description ||
                                        ""
                                    )
                                ),

                            query,

                            source:
                                "DuckDuckGo HTML",
                        };
                    }
                )

                .filter(
                    (item) =>
                        item.url &&
                        item.title
                );


        if (
            parsed.length > 0
        ) {

            searchCache.set(
                query,
                {
                    time:
                        Date.now(),

                    results:
                        parsed,
                }
            );
        }


        console.log(
            "✅ DDG HTML Results：",
            query,
            parsed.length
        );


        return parsed;

    } catch {

        console.log(
            "❌ DDG 搜尋失敗：",
            query
        );


        return [];
    }
}


// ============================================================
// Search Query
//
// 每組只打 DDG
// 不再浪費時間打 Yahoo 500
// ============================================================

async function searchQuery(
    query: string
) {

    return await searchDuckDuckGo(
        query
    );
}


// ============================================================
// Fetch Website Headers
// ============================================================

const browserHeaders = {

    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

    Accept:
        "text/html,application/xhtml+xml",

    "Accept-Language":
        "zh-TW,zh;q=0.9,en;q=0.8",
};


// ============================================================
// Fetch Website
// ============================================================

async function fetchWebsite(
    url: string
) {

    try {

        const response =
            await fetch(
                url,
                {

                    headers:
                        browserHeaders,

                    redirect:
                        "follow",

                    cache:
                        "no-store",

                    signal:
                        AbortSignal.timeout(
                            8000
                        ),
                }
            );


        if (
            !response.ok
        ) {

            return "";
        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "text/html"
            )
        ) {

            return "";
        }


        const html =
            await response.text();


        // 避免網站超大
        return html.slice(
            0,
            2_000_000
        );

    } catch {

        return "";
    }
}


// ============================================================
// Taiwan Score
// ============================================================

function calculateTaiwanScore(
    url: string,
    text: string
) {

    let score = 0;


    const hostname =
        getHostname(
            url
        );


    if (
        hostname.endsWith(
            ".tw"
        )
    ) {

        score += 35;
    }


    const lower =
        text.toLowerCase();


    const hits =
        taiwanSignals.filter(
            (signal) =>
                lower.includes(
                    signal.toLowerCase()
                )
        );


    score +=
        Math.min(
            40,
            hits.length * 8
        );


    // 台灣電話
    if (
        /(?:02|03|04|05|06|07|08)[-\s]?\d{6,8}/.test(
            text
        )
    ) {

        score += 10;
    }


    // 台灣統編常見文字
    if (
        lower.includes(
            "統一編號"
        )
    ) {

        score += 10;
    }


    return Math.min(
        100,
        score
    );
}


// ============================================================
// Website Analysis
// ============================================================

function analyzeContent(
    text: string
) {

    const merchantFound =
        findSignals(
            text,
            merchantSignals
        );


    const strongFound =
        findSignals(
            text,
            strongMerchantSignals
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


    const contentFound =
        findSignals(
            text,
            contentSignals
        );


    // ========================================================
    // Merchant Score
    // ========================================================

    let merchantScore =
        merchantFound.length * 5;


    merchantScore +=
        strongFound.length * 10;


    // ========================================================
    // Payment Score
    // ========================================================

    let paymentScore =
        paymentFound.length * 8;


    // ========================================================
    // Physical Score
    // ========================================================

    let physicalScore =
        physicalFound.length * 8;


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


    // ========================================================
    // Merchant Qualification
    // ========================================================

    const isMerchant =

        strongFound.length >= 1 ||

        merchantFound.length >= 4 ||

        (
            merchantFound.length >= 2 &&
            paymentFound.length >= 1
        ) ||

        (
            merchantFound.length >= 2 &&
            physicalFound.length >= 2
        );


    // ========================================================
    // Content Site Qualification
    // ========================================================

    const isContentSite =

        (
            contentFound.length >= 7 &&
            strongFound.length === 0
        )

        ||

        (
            contentFound.length >= 5 &&
            merchantFound.length <= 2
        );


    // ========================================================
    // Lead
    // ========================================================

    let leadScore =

        merchantScore *
        0.45 +

        paymentScore *
        0.35 +

        physicalScore *
        0.20;


    leadScore -=
        contentFound.length * 2;


    if (
        strongFound.length >= 2
    ) {

        leadScore += 8;
    }


    leadScore =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    leadScore
                )
            )
        );


    return {

        merchantScore,

        paymentScore,

        physicalScore,

        leadScore,

        merchantSignals:
            merchantFound.slice(
                0,
                15
            ),

        strongMerchantSignals:
            strongFound.slice(
                0,
                10
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

        contentSignals:
            contentFound.slice(
                0,
                10
            ),

        hasPhysicalStore:
            physicalFound.length >= 2,

        hasPaymentNeed:
            paymentFound.length >= 1,

        isMerchant,

        isContentSite,
    };
}


// ============================================================
// Detect Platform
// ============================================================

function detectPlatform(
    html: string
): PlatformResult {

    const lower =
        html.toLowerCase();


    const ranked =
        fingerprints

            .map(
                (fingerprint) => {

                    const evidence =
                        fingerprint
                            .keywords
                            .filter(
                                (keyword) =>
                                    lower.includes(
                                        keyword.toLowerCase()
                                    )
                            );


                    return {

                        platform:
                            fingerprint.name,

                        evidence,

                        score:
                            evidence.length,
                    };
                }
            )

            .sort(
                (a, b) =>
                    b.score -
                    a.score
            );


    const best =
        ranked[0];


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
            best.platform,

        evidence:
            best.evidence,
    };
}


// ============================================================
// Detect Brand
// ============================================================

function detectBrand(
    html: string,
    url: string
) {

    const og =
        html.match(
            /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
        );


    if (
        og?.[1]
    ) {

        return cleanSearchText(
            og[1]
        );
    }


    const title =
        html.match(
            /<title[^>]*>([\s\S]*?)<\/title>/i
        );


    if (
        title?.[1]
    ) {

        return cleanSearchText(
            title[1]
        )

            .replace(
                /\s*[|｜]\s*.*$/,
                ""
            )

            .trim();
    }


    return (
        getHostname(
            url
        )
            .split(
                "."
            )[0]
        ||
        "未知品牌"
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

    const cooperative =
        cooperationPlatforms.includes(
            platform
        );


    if (
        cooperative &&
        paymentScore >= 35 &&
        hasPhysicalStore
    ) {

        return "已辨識為可合作開店平台，且具有線上交易與實體據點訊號，建議優先評估 EC＋POS。";
    }


    if (
        cooperative
    ) {

        return "已辨識為可合作開店平台，建議優先確認目前金流狀況與全支付導入機會。";
    }


    if (
        paymentScore >= 45 &&
        hasPhysicalStore
    ) {

        return "同時具有線上交易及實體據點需求，建議評估 EC 金流與 POS 合作。";
    }


    if (
        paymentScore >= 35
    ) {

        return "網站具有明確線上交易／付款需求，可優先評估全支付線上金流。";
    }


    if (
        hasPhysicalStore
    ) {

        return "具有實體門市／據點，可進一步確認 POS 或門市支付需求。";
    }


    return "具有商戶特徵，可進一步確認付款、會員、預約或交易流程。";
}


// ============================================================
// Candidate Analysis
// ============================================================

async function analyzeCandidate(
    candidate: Candidate,
    keyword: string
) {

    try {

        const rootUrl =
            getRootUrl(
                candidate.url
            );


        if (
            !rootUrl ||
            isExcludedDomain(
                rootUrl
            )
        ) {

            return null;
        }


        const html =
            await fetchWebsite(
                rootUrl
            );


        if (!html) {

            return null;
        }


        const websiteText =
            cleanHtml(
                html
            );


        if (
            websiteText.length < 150
        ) {

            return null;
        }


        // ====================================================
        // Taiwan
        // ====================================================

        const taiwanScore =
            calculateTaiwanScore(
                rootUrl,
                websiteText
            );


        // 明確海外網站不要
        const hostname =
            getHostname(
                rootUrl
            );


        if (
            foreignTlds.some(
                (tld) =>
                    hostname.endsWith(
                        tld
                    )
            )
        ) {

            return null;
        }


        // ====================================================
        // Website Analysis
        // ====================================================

        const analysis =
            analyzeContent(
                websiteText
            );


        if (
            !analysis.isMerchant
        ) {

            return null;
        }


        if (
            analysis.isContentSite
        ) {

            return null;
        }


        // ====================================================
        // Website Keyword Relevance
        // ====================================================

        const websiteLower =
            websiteText.toLowerCase();


        const variants =
            expandIndustryKeyword(
                keyword
            );


        let websiteRelevance =
            0;


        for (
            const variant
            of variants
        ) {

            if (
                websiteLower.includes(
                    variant.toLowerCase()
                )
            ) {

                websiteRelevance += 12;
            }
        }


        websiteRelevance =
            Math.min(
                40,
                websiteRelevance
            );


        // 搜尋結果 + 官網都完全無關
        if (
            candidate.relevanceScore < 20 &&
            websiteRelevance === 0
        ) {

            return null;
        }


        // ====================================================
        // Platform
        // ====================================================

        const platform =
            detectPlatform(
                html
            );


        const brand =
            detectBrand(
                html,
                rootUrl
            );


        // ====================================================
        // Final Lead
        // ====================================================

        let leadScore =
            analysis.leadScore;


        // 搜尋相關
        leadScore +=
            candidate.relevanceScore *
            0.18;


        // 官網產業相關
        leadScore +=
            websiteRelevance *
            0.30;


        // 多組搜尋詞都找到
        leadScore +=
            Math.min(
                10,
                candidate.appearanceCount *
                2
            );


        // 台灣
        leadScore +=
            taiwanScore *
            0.08;


        // 合作平台
        if (
            cooperationPlatforms.includes(
                platform.platform
            )
        ) {

            leadScore += 15;
        }


        // POS
        if (
            analysis.hasPhysicalStore
        ) {

            leadScore += 5;
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


        if (
            leadScore < 25
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

            brand,

            url:
                rootUrl,

            description:
                candidate.description,

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
                candidate.relevanceScore,

            appearanceCount:
                candidate.appearanceCount,

            taiwanScore,

            websiteRelevance,

            leadScore,

            merchantSignals:
                analysis.merchantSignals,

            strongMerchantSignals:
                analysis.strongMerchantSignals,

            paymentSignals:
                analysis.paymentSignals,

            contentSignals:
                analysis.contentSignals,

            hasPaymentNeed:
                analysis.hasPaymentNeed,
        };

    } catch {

        return null;
    }
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
                body?.keyword ||
                ""
            )
                .trim();


        if (!keyword) {

            return NextResponse.json(
                {

                    success:
                        false,

                    error:
                        "請輸入搜尋關鍵字",

                    results:
                        [],
                },
                {
                    status:
                        400,
                }
            );
        }


        console.log(
            "===================================="
        );


        console.log(
            "PayLead Finder v5"
        );


        console.log(
            "搜尋產業：",
            keyword
        );


        console.log(
            "搜尋引擎：DuckDuckGo Search"
        );


        console.log(
            "OpenAI：停用"
        );


        // ====================================================
        // Queries
        // ====================================================

        const queries =
            getSearchQueries(
                keyword
            );


        console.log(
            "搜尋詞：",
            queries
        );


        // ====================================================
        // Search
        //
        // 循序
        // 避免 DDG rate limit
        // ====================================================

        const rawResults:
            SearchResult[] =
            [];


        for (
            const query
            of queries
        ) {

            const results =
                await searchQuery(
                    query
                );


            console.log(
                "Query：",
                query,
                "→",
                results.length
            );


            rawResults.push(
                ...results
            );


            // 已經很多就不再打
            if (
                rawResults.length >= 100
            ) {

                break;
            }


            await sleep(
                650
            );
        }


        console.log(
            "原始搜尋結果：",
            rawResults.length
        );


        // ====================================================
        // Search Filter
        // ====================================================

        const filtered =
            rawResults.filter(
                (result) =>
                    shouldKeepSearchResult(
                        result,
                        keyword
                    )
            );


        console.log(
            "Search Filter 後：",
            filtered.length
        );


        // ====================================================
        // Candidate Map
        //
        // 同 domain 整合
        // appearanceCount 很重要
        //
        // 同網站被不同 query 找到
        // 代表它更可能是真的相關商戶
        // ====================================================

        const candidateMap =
            new Map<
                string,
                Candidate
            >();


        for (
            const result
            of filtered
        ) {

            const rootUrl =
                getRootUrl(
                    result.url
                );


            if (
                !rootUrl ||
                isExcludedDomain(
                    rootUrl
                )
            ) {

                continue;
            }


            const hostname =
                getHostname(
                    rootUrl
                );


            if (!hostname) {

                continue;
            }


            const relevance =
                calculateRelevance(
                    keyword,
                    result.title,
                    result.description
                );


            const existing =
                candidateMap.get(
                    hostname
                );


            if (!existing) {

                candidateMap.set(
                    hostname,
                    {

                        ...result,

                        url:
                            rootUrl,

                        relevanceScore:
                            relevance,

                        appearanceCount:
                            1,
                    }
                );

                continue;
            }


            existing.appearanceCount +=
                1;


            // 保留相關性最高的 title / description
            if (
                relevance >
                existing.relevanceScore
            ) {

                existing.title =
                    result.title;

                existing.description =
                    result.description;

                existing.query =
                    result.query;

                existing.relevanceScore =
                    relevance;
            }
        }


        // ====================================================
        // Candidate Sort
        // ====================================================

        const candidates =
            Array.from(
                candidateMap.values()
            )

                .sort(
                    (
                        a,
                        b
                    ) => {

                        const scoreA =

                            a.relevanceScore +

                            Math.min(
                                20,
                                a.appearanceCount *
                                4
                            );


                        const scoreB =

                            b.relevanceScore +

                            Math.min(
                                20,
                                b.appearanceCount *
                                4
                            );


                        return (
                            scoreB -
                            scoreA
                        );
                    }
                )

                .slice(
                    0,
                    60
                );


        console.log(
            "候選網站：",
            candidates.length
        );


        // ====================================================
        // Analyze
        //
        // 每批 5 筆
        // ====================================================

        const results:
            any[] =
            [];


        for (
            let i = 0;
            i <
            candidates.length;
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
                        (candidate) =>
                            analyzeCandidate(
                                candidate,
                                keyword
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


            console.log(
                "目前有效商戶：",
                results.length
            );


            // 已經足夠
            if (
                results.length >= 35
            ) {

                break;
            }


            await sleep(
                150
            );
        }


        // ====================================================
        // Final Sort
        //
        // 1. Cooperation
        // 2. Lead
        // 3. Appearance
        // 4. Relevance
        // ====================================================

        results.sort(
            (
                a,
                b
            ) => {

                const cooperationA =
                    a.cooperation ===
                    "可合作"
                        ? 1
                        : 0;


                const cooperationB =
                    b.cooperation ===
                    "可合作"
                        ? 1
                        : 0;


                if (
                    cooperationA !==
                    cooperationB
                ) {

                    return (
                        cooperationB -
                        cooperationA
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


                if (
                    b.appearanceCount !==
                    a.appearanceCount
                ) {

                    return (
                        b.appearanceCount -
                        a.appearanceCount
                    );
                }


                return (
                    b.relevanceScore -
                    a.relevanceScore
                );
            }
        );


        // ====================================================
        // Final 30
        // ====================================================

        const finalResults =
            results.slice(
                0,
                30
            );


        console.log(
            "===================================="
        );


        console.log(
            "最終結果：",
            finalResults.length
        );


        console.log(
            "合作平台：",
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

            searchEngine:
                "DuckDuckGo",

            openAI:
                false,

            queryCount:
                queries.length,

            searchedQueries:
                queries,

            rawCount:
                rawResults.length,

            filteredCount:
                filtered.length,

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

                results:
                    [],
            },
            {

                status:
                    500,
            }
        );
    }
}