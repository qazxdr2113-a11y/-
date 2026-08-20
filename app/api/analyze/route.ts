import { NextResponse } from "next/server";

// ============================================================
// PayLead Finder - Website Analyzer
// 版本：強化 POS / APP / EC 串接需求辨識
// ============================================================

// ============================================================
// 可合作電商平台
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
// 平台標準化
// ============================================================

function normalizePlatformName(name: string): string {
    const value = String(name || "")
        .trim()
        .toLowerCase();

    const aliases: Record<string, string> = {
        qdm: "qdm",

        showmore: "showmore",

        尚峪: "尚峪",

        easystore: "easystore",
        "easy store": "easystore",

        環匯亞太: "環匯亞太",

        開店123: "開店123",
        shop123: "開店123",
        "shop 123": "開店123",
        "shop123.com.tw": "開店123",
        "shop123.com": "開店123",

        liteshop: "liteshop",

        gogoshop: "gogoshop",

        waca: "waca",

        shopify: "shopify",

        shopline: "shopline",

        woocommerce: "woocommerce",

        "91app": "91app",
        "91 app": "91app",

        sysfeather: "sysfeather",
        "sys feather": "sysfeather",

        cyberbiz: "cyberbiz",

        meepshop: "meepshop",
        "meep shop": "meepshop",
    };

    return aliases[value] || value;
}

// ============================================================
// 平台顯示名稱
// ============================================================

function formatPlatformName(name: string): string {
    const normalized = normalizePlatformName(name);

    const displayNames: Record<string, string> = {
        qdm: "QDM",
        showmore: "showmore",
        尚峪: "尚峪",
        easystore: "Easystore",
        環匯亞太: "環匯亞太",
        開店123: "開店123",
        liteshop: "Liteshop",
        gogoshop: "gogoshop",
        waca: "WACA",

        shopify: "Shopify",
        shopline: "SHOPLINE",
        woocommerce: "WooCommerce",

        "91app": "91APP",
        sysfeather: "Sysfeather",
        cyberbiz: "CYBERBIZ",
        meepshop: "meepShop",
    };

    return displayNames[normalized] || name || "Unknown";
}

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
        weight: 10,
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
        weight: 10,
    },

    {
        name: "easystore",
        keywords: [
            "easystore.co",
            "store-themes.easystore.co",
            "apps.easystore.co",
            "resources.easystore.co",
            "easystore-section-header",
            "easystore-section-header-hidden",
        ],
        weight: 10,
    },

    {
        name: "開店123",
        keywords: [
            "shop123.com.tw",
            "fs1.shop123.com.tw",
            "shop123.com",
            "shop123_",
            "shop123/",
            "shop123.",
        ],
        weight: 10,
    },

    {
        name: "waca",
        keywords: [
            "waca.net",
            "waca.tw",
        ],
        weight: 10,
    },

    {
        name: "liteshop",
        keywords: [
            "liteshop.tw",
            "liteshop.com.tw",
        ],
        weight: 10,
    },

    {
        name: "showmore",
        keywords: [
            "showmore.com.tw",
            "showmore.com",
        ],
        weight: 10,
    },

    {
        name: "尚峪",
        keywords: [
            "尚峪",
        ],
        weight: 10,
    },

    {
        name: "環匯亞太",
        keywords: [
            "環匯亞太",
            "global payments",
            "globalpayments",
        ],
        weight: 10,
    },

    {
        name: "shopify",
        keywords: [
            "cdn.shopify.com",
            "myshopify.com",
            "shopify.theme",
            "shopify.shop",
        ],
        weight: 10,
    },

    {
        name: "shopline",
        keywords: [
            "shoplineapp.com",
            "shopline.com",
            "shopline.cloud",
        ],
        weight: 10,
    },

    {
        name: "91app",
        keywords: [
            "static.91app.com",
            "static.91app.com/design-cloud",
            "design-cloud/static/usersite",
            "usersite/resource/prod/latest/bootstrap.js",
            "usersite/resource/prod/latest/vendors.js",
            "91app.com",
        ],
        weight: 10,
    },

    {
        name: "sysfeather",
        keywords: [
            "sysfeather",
            "plsysfeather",
            "'agent':'plsysfeather'",
            "\"agent\":\"plsysfeather\"",
            "facebook.com/sysfeather",
        ],
        weight: 10,
    },

    {
        name: "cyberbiz",
        keywords: [
            "cyberbiz.io",
            "cyberbiz.co",
            "store.cyberbiz.co",
            "cyberbiz google tag manager",
            "window.cyberbiz_pagecontext",
            "cyberbiz_pagecontext",
            "window.cyberbiz_appscriptsettings",
            "cyberbiz_appscriptsettings",
            "window.cyberbiz",
            "eticket_term_of_service",
            "cyberbiz 电子票券服务使用说明",
            "cyberbiz 電子票券服務使用說明",
        ],
        weight: 10,
    },

    {
        name: "meepshop",
        keywords: [
            "meepshop.com",
            "meepcloud.com",
            "cdn.meepshop.com",
            "img.meepshop.com",
            "meepshop-meep-ui",
            "meepshop-meep-ui__image",
            "meepshop-meep-ui__image-img-index__root",
            "data-testid=\"/products/",
            "data-testid='/products/",
        ],
        weight: 10,
    },

    {
        name: "woocommerce",
        keywords: [
            "woocommerce-layout",
            "woocommerce-js",
            "wc-cart-fragments",
            "wp-content/plugins/woocommerce",
        ],
        weight: 10,
    },
];

// ============================================================
// 排除大型平台 / 媒體 / 社群
// ============================================================

const excludedDomains = [
    "facebook.com",
    "instagram.com",
    "youtube.com",
    "tiktok.com",

    "shopee.tw",
    "shopee.com",

    "momo.com.tw",
    "pchome.com.tw",

    "ruten.com.tw",

    "linkedin.com",
    "wikipedia.org",

    "google.com",
    "google.com.tw",

    "bing.com",
    "yahoo.com",

    "vogue.com",
    "vogue.com.tw",

    "gq.com",
    "gq.com.tw",

    "ettoday.net",
    "setn.com",
    "ltn.com.tw",
    "udn.com",
    "storm.mg",
    "businessweekly.com.tw",
];

// ============================================================
// 內容型網站關鍵字
// ============================================================

const contentWebsiteKeywords = [
    "新聞",
    "媒體",
    "雜誌",
    "專題",
    "報導",
    "娛樂",
    "時尚",
    "文章",
    "部落格",
    "blog",
    "magazine",
    "news",
    "editorial",
    "article",
    "fashion",
    "lifestyle",
    "celebrity",
];

// ============================================================
// EC / APP 串接需求關鍵字
// ============================================================

const commerceKeywords = [
    // 商品
    "商品",
    "產品",
    "商品分類",
    "商品詳情",
    "商品列表",
    "產品列表",

    // 購物
    "購物車",
    "購物袋",
    "加入購物車",
    "加入購物袋",
    "立即購買",
    "立即下單",
    "立即結帳",
    "線上購物",
    "線上商店",
    "網路商店",
    "官方商城",
    "商城",

    // 交易
    "結帳",
    "付款",
    "支付",
    "信用卡",
    "線上付款",
    "線上支付",
    "訂單",
    "訂購",
    "購買",

    // 會員
    "會員",
    "會員登入",
    "會員中心",
    "登入",
    "註冊",
    "我的帳戶",

    // 英文
    "checkout",
    "cart",
    "add to cart",
    "buy now",
    "shop now",
    "order",
    "payment",
    "shopping cart",
    "product",
    "products",
    "store",
];

// ============================================================
// APP 串接關鍵字
// ============================================================

const appKeywords = [
    "app",
    "mobile app",
    "application",
    "ios",
    "android",
    "app store",
    "google play",
    "下載app",
    "下載 app",
    "手機app",
    "手機 app",
    "行動app",
    "行動 app",
    "行動應用",
    "會員app",
    "會員 app",
    "app下載",
    "app 下載",
];

// ============================================================
// 特殊金流 / 交易場景
// ============================================================

const paymentIndustryKeywords = [
    // 停車
    "停車場",
    "停車",
    "停車費",
    "停車繳費",
    "停車付款",
    "車位",
    "parking",
    "parking fee",

    // 電動車
    "充電樁",
    "充電站",
    "電動車充電",
    "充電服務",
    "充電費",
    "充電付款",
    "ev charging",
    "charging station",
    "charging",

    // 票券
    "票券",
    "門票",
    "電子票",
    "線上購票",
    "預約購票",
    "booking",
    "ticket",

    // 預約
    "線上預約",
    "預約",
    "預約服務",
    "預約付款",
    "線上訂位",
    "訂位",
    "reservation",

    // 交通
    "租車",
    "共享汽車",
    "共享機車",
    "租借",
    "租賃",
    "叫車",
    "車隊",
    "交通服務",

    // 生活服務
    "洗衣",
    "清潔服務",
    "家事服務",
    "到府服務",
    "維修服務",
    "美容預約",
    "健身房",
    "課程報名",
];

// ============================================================
// POS / 實體店面關鍵字
//
// 不再只看「門市」。
// 增加地址、電話、營業時間、地圖、分店、店鋪等。
// ============================================================

const physicalStrongKeywords = [
    "門市",
    "實體門市",
    "實體店",
    "門店",
    "分店",
    "分公司",
    "據點",
    "服務據點",
    "營業據點",
    "店面",
    "店址",
    "門市地址",
    "分店地址",
    "營業地址",
    "展售中心",
    "旗艦店",
    "專櫃",
    "服務中心",
    "門市資訊",
    "門市據點",
    "店鋪",
    "店舖",
    "實體據點",
    "銷售據點",
    "經銷據點",
    "服務門市",
    "門市列表",
    "分店列表",
    "店家資訊",
];

const physicalLocationKeywords = [
    "地址",
    "聯絡地址",
    "營業時間",
    "營業日期",
    "電話",
    "聯絡電話",
    "客服電話",
    "店家電話",
    "map",
    "maps",
    "google maps",
    "googlemap",
    "location",
    "locations",
    "store locator",
    "store location",
    "find a store",
    "find us",
    "branch",
    "branches",
    "retail store",
    "retail stores",
    "store",
    "stores",
];

const physicalNavKeywords = [
    "門市",
    "分店",
    "據點",
    "店鋪",
    "店舖",
    "location",
    "locations",
    "store locator",
    "stores",
    "branches",
    "find a store",
];

// ============================================================
// HTML 清理
// ============================================================

function cleanText(text: string): string {
    return text
        .replace(/\s+/g, " ")
        .replace(/[\r\n\t]+/g, " ")
        .trim();
}

// ============================================================
// HTML Entity
// ============================================================

function decodeHtml(text: string): string {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

// ============================================================
// HTML → 純文字
// ============================================================

function htmlToText(html: string): string {
    return cleanText(
        html
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
    );
}

// ============================================================
// URL 標準化
// ============================================================

function normalizeUrl(url: string): string {
    try {
        let value = String(url || "").trim();

        if (!value) {
            return "";
        }

        // 防止錯誤訊息、非網址文字被當成 URL
        const invalidTextSignals = [
            "網站無法讀取",
            "HTTP 403",
            "HTTP 404",
            "HTTP 500",
            "fetch failed",
            "Failed to fetch",
            "ERR_INVALID_URL",
            "Invalid URL",
        ];

        if (
            invalidTextSignals.some((signal) =>
                value.toLowerCase().includes(signal.toLowerCase())
            )
        ) {
            return "";
        }

        if (!/^https?:\/\//i.test(value)) {
            value = `https://${value}`;
        }

        const parsed = new URL(value);

        if (
            parsed.protocol !== "http:" &&
            parsed.protocol !== "https:"
        ) {
            return "";
        }

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
// 排除網站
// ============================================================

function isExcluded(url: string): boolean {
    try {
        const hostname = new URL(url)
            .hostname
            .toLowerCase()
            .replace(/^www\./, "");

        return excludedDomains.some(
            (domain) =>
                hostname === domain ||
                hostname.endsWith(`.${domain}`)
        );
    } catch {
        return false;
    }
}

// ============================================================
// 偵測內容型網站
// ============================================================

function detectContentWebsite(
    html: string,
    url: string
) {
    let hostname = "";

    try {
        hostname =
            new URL(url)
                .hostname
                .toLowerCase();
    } catch {}

    const text =
        htmlToText(html)
            .toLowerCase();

    const found =
        contentWebsiteKeywords.filter(
            (keyword) =>
                text.includes(
                    keyword.toLowerCase()
                )
        );

    const domainMedia =
        excludedDomains.some(
            (domain) =>
                hostname === domain ||
                hostname.endsWith(
                    `.${domain}`
                )
        );

    return {
        isContentWebsite:
            domainMedia ||
            found.length >= 4,

        signals:
            found.slice(0, 10),
    };
}

// ============================================================
// 偵測 EC / APP 串接需求
// ============================================================

function detectCommerceSignals(
    html: string
) {
    const text =
        htmlToText(html)
            .toLowerCase();

    // --------------------------------------------------------
    // 一般 EC
    // --------------------------------------------------------

    const commerceSignals =
        commerceKeywords.filter(
            (keyword) =>
                text.includes(
                    keyword.toLowerCase()
                )
        );

    // --------------------------------------------------------
    // APP
    // --------------------------------------------------------

    const appSignals =
        appKeywords.filter(
            (keyword) =>
                text.includes(
                    keyword.toLowerCase()
                )
        );

    // --------------------------------------------------------
    // 特殊支付場景
    // --------------------------------------------------------

    const paymentIndustrySignals =
        paymentIndustryKeywords.filter(
            (keyword) =>
                text.includes(
                    keyword.toLowerCase()
                )
        );

    // --------------------------------------------------------
    // HTML 結構訊號
    // --------------------------------------------------------

    const htmlSignals: string[] = [];

    if (
        /add[-_ ]?to[-_ ]?cart/i.test(
            html
        )
    ) {
        htmlSignals.push(
            "add-to-cart"
        );
    }

    if (
        /shopping[-_ ]?cart/i.test(
            html
        )
    ) {
        htmlSignals.push(
            "shopping-cart"
        );
    }

    if (
        /checkout/i.test(
            html
        )
    ) {
        htmlSignals.push(
            "checkout"
        );
    }

    if (
        /payment|paynow|pay-now/i.test(
            html
        )
    ) {
        htmlSignals.push(
            "payment"
        );
    }

    if (
        /login|sign[-_ ]?in|member/i.test(
            html
        )
    ) {
        htmlSignals.push(
            "login/member"
        );
    }

    if (
        /app-store|play\.google\.com|apps.apple.com/i.test(
            html
        )
    ) {
        htmlSignals.push(
            "app-store/google-play"
        );
    }

    // --------------------------------------------------------
    // Score
    // --------------------------------------------------------

    const commerceScore =
        commerceSignals.length +
        htmlSignals.length * 2;

    const paymentIndustryScore =
        paymentIndustrySignals.length;

    const appScore =
        appSignals.length +
        (
            htmlSignals.includes(
                "app-store/google-play"
            )
                ? 4
                : 0
        );

    // --------------------------------------------------------
    // APP / EC 串接需求
    // --------------------------------------------------------

    let paymentScore = 0;

    paymentScore +=
        Math.min(
            35,
            commerceSignals.length * 4
        );

    paymentScore +=
        Math.min(
            20,
            htmlSignals.length * 5
        );

    paymentScore +=
        Math.min(
            25,
            paymentIndustrySignals.length * 8
        );

    paymentScore +=
        Math.min(
            20,
            appScore * 5
        );

    paymentScore =
        Math.min(
            100,
            paymentScore
        );

    const hasPaymentNeed =
        paymentScore >= 40 ||
        commerceScore >= 5 ||
        paymentIndustryScore >= 2 ||
        appScore >= 2;

    return {
        commerceScore,

        commerceSignals:
            [
                ...commerceSignals,
                ...htmlSignals,
            ].slice(0, 30),

        paymentIndustryScore,

        paymentIndustrySignals:
            paymentIndustrySignals.slice(
                0,
                20
            ),

        appScore,

        appSignals:
            [
                ...appSignals,
                ...(
                    htmlSignals.includes(
                        "app-store/google-play"
                    )
                        ? [
                            "App Store / Google Play"
                        ]
                        : []
                ),
            ].slice(0, 20),

        paymentScore,

        hasPaymentNeed,
    };
}

// ============================================================
// 品牌名稱
// ============================================================

function detectBrand(
    html: string,
    url: string
): string {

    // --------------------------------------------------------
    // og:site_name
    // --------------------------------------------------------

    const ogSiteName =
        html.match(
            /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
        );

    if (ogSiteName?.[1]) {
        const brand =
            cleanText(
                decodeHtml(
                    ogSiteName[1]
                )
            );

        if (
            brand.length >= 2 &&
            brand.length <= 80
        ) {
            return brand;
        }
    }

    // --------------------------------------------------------
    // application-name
    // --------------------------------------------------------

    const applicationName =
        html.match(
            /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i
        );

    if (applicationName?.[1]) {
        const brand =
            cleanText(
                decodeHtml(
                    applicationName[1]
                )
            );

        if (
            brand.length >= 2 &&
            brand.length <= 80
        ) {
            return brand;
        }
    }

    // --------------------------------------------------------
    // JSON-LD
    // --------------------------------------------------------

    const jsonLdMatches =
        html.match(
            /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        );

    if (jsonLdMatches) {
        for (
            const block of jsonLdMatches
        ) {
            try {
                const jsonText =
                    block
                        .replace(
                            /<script[^>]*>/i,
                            ""
                        )
                        .replace(
                            /<\/script>$/i,
                            ""
                        );

                const data =
                    JSON.parse(
                        jsonText
                    );

                const objects =
                    Array.isArray(data)
                        ? data
                        : [data];

                for (
                    const obj of objects
                ) {
                    if (
                        obj?.name &&
                        (
                            obj["@type"] ===
                                "Organization" ||
                            obj["@type"] ===
                                "LocalBusiness" ||
                            obj["@type"] ===
                                "Store" ||
                            obj["@type"] ===
                                "Corporation"
                        )
                    ) {
                        const brand =
                            cleanText(
                                String(
                                    obj.name
                                )
                            );

                        if (
                            brand.length >= 2 &&
                            brand.length <= 80
                        ) {
                            return brand;
                        }
                    }
                }
            } catch {}
        }
    }

    // --------------------------------------------------------
    // Title
    // --------------------------------------------------------

    const title =
        html.match(
            /<title[^>]*>([\s\S]*?)<\/title>/i
        );

    if (title?.[1]) {
        let titleText =
            cleanText(
                decodeHtml(
                    title[1]
                )
            );

        titleText =
            titleText
                .replace(
                    /\s*[|｜]\s*.*$/g,
                    ""
                )
                .replace(
                    /\s*[-－—]\s*.*$/g,
                    ""
                )
                .trim();

        if (
            titleText.length >= 2 &&
            titleText.length <= 80
        ) {
            return titleText;
        }
    }

    // --------------------------------------------------------
    // Domain
    // --------------------------------------------------------

    try {
        const hostname =
            new URL(url)
                .hostname
                .replace(
                    /^www\./,
                    ""
                );

        return hostname
            .split(".")[0]
            .replace(
                /[-_]/g,
                " "
            );
    } catch {}

    return "未知品牌";
}

// ============================================================
// JSON-LD 實體店偵測
//
// 很多網站不會在首頁文字寫「門市」
// 但 Schema.org 裡會有 LocalBusiness / Store
// ============================================================

function detectJsonLdPhysicalStore(
    html: string
) {
    let found = false;
    const signals: string[] = [];

    const jsonLdMatches =
        html.match(
            /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        );

    if (!jsonLdMatches) {
        return {
            found,
            signals,
        };
    }

    for (
        const block of jsonLdMatches
    ) {
        try {
            const jsonText =
                block
                    .replace(
                        /<script[^>]*>/i,
                        ""
                    )
                    .replace(
                        /<\/script>$/i,
                        ""
                    );

            const data =
                JSON.parse(
                    jsonText
                );

            const objects: any[] =
                Array.isArray(data)
                    ? data
                    : [data];

            for (
                const obj of objects
            ) {
                const type =
                    String(
                        obj?.["@type"] ||
                        ""
                    ).toLowerCase();

                if (
                    type.includes(
                        "localbusiness"
                    ) ||
                    type === "store" ||
                    type === "restaurant" ||
                    type === "cafeorcoffeeshop" ||
                    type === "shoppingcenter"
                ) {
                    found = true;
                    signals.push(
                        `Schema:${obj?.["@type"] || "LocalBusiness"}`
                    );
                }

                if (
                    obj?.address
                ) {
                    found = true;
                    signals.push(
                        "Schema:address"
                    );
                }

                if (
                    obj?.telephone
                ) {
                    found = true;
                    signals.push(
                        "Schema:telephone"
                    );
                }

                if (
                    obj?.openingHours ||
                    obj?.openingHoursSpecification
                ) {
                    found = true;
                    signals.push(
                        "Schema:openingHours"
                    );
                }

                if (
                    obj?.geo ||
                    obj?.hasMap
                ) {
                    found = true;
                    signals.push(
                        "Schema:map/location"
                    );
                }
            }
        } catch {}
    }

    return {
        found,
        signals: Array.from(
            new Set(signals)
        ).slice(0, 20),
    };
}

// ============================================================
// POS / 實體店面
//
// 新版邏輯：
// 1. 強關鍵字直接加分
// 2. 地址 + 電話 + 營業時間組合判斷
// 3. Google Maps / location 判斷
// 4. JSON-LD LocalBusiness 判斷
// 5. 導覽列出現門市 / location
//
// 避免只因為出現一次 store 就誤判。
// ============================================================

function detectPhysicalStore(
    html: string
) {
    const text =
        htmlToText(html)
            .toLowerCase();

    // --------------------------------------------------------
    // 強實體店訊號
    // --------------------------------------------------------

    const strongSignals =
        physicalStrongKeywords.filter(
            (signal) =>
                text.includes(
                    signal.toLowerCase()
                )
        );

    // --------------------------------------------------------
    // 地址類
    // --------------------------------------------------------

    const locationSignals =
        physicalLocationKeywords.filter(
            (signal) =>
                text.includes(
                    signal.toLowerCase()
                )
        );

    // --------------------------------------------------------
    // 導覽列
    // --------------------------------------------------------

    const navSignals =
        physicalNavKeywords.filter(
            (signal) =>
                text.includes(
                    signal.toLowerCase()
                )
        );

    // --------------------------------------------------------
    // 電話
    // --------------------------------------------------------

    const hasPhone =
        /(?:tel|phone|電話|聯絡電話|客服)[\s:=：\-+()0-9\s]{2,}/i.test(
            text
        ) ||
        /0\d-\d{7,8}/.test(
            text
        ) ||
        /09\d{8}/.test(
            text
        );

    // --------------------------------------------------------
    // 地址
    // --------------------------------------------------------

    const hasTaiwanAddress =
        /(?:台北市|新北市|桃園市|台中市|台南市|高雄市|基隆市|新竹市|嘉義市|新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|嘉義縣|屏東縣|宜蘭縣|花蓮縣|台東縣|澎湖縣|金門縣|連江縣)[^，,。]{2,40}(?:路|街|巷|弄|號)/i.test(
            text
        );

    // --------------------------------------------------------
    // 營業時間
    // --------------------------------------------------------

    const hasBusinessHours =
        text.includes(
            "營業時間"
        ) ||
        text.includes(
            "opening hours"
        ) ||
        text.includes(
            "business hours"
        );

    // --------------------------------------------------------
    // Google Maps / 地圖
    // --------------------------------------------------------

    const hasMap =
        /google\.(?:com|com\.tw)\/maps/i.test(
            html
        ) ||
        /maps\.google/i.test(
            html
        ) ||
        text.includes(
            "google maps"
        ) ||
        text.includes(
            "googlemap"
        );

    // --------------------------------------------------------
    // JSON-LD
    // --------------------------------------------------------

    const jsonLd =
        detectJsonLdPhysicalStore(
            html
        );

    // --------------------------------------------------------
    // 地址 + 電話
    // --------------------------------------------------------

    const addressPhone =
        hasTaiwanAddress &&
        hasPhone;

    // --------------------------------------------------------
    // 地址 + 營業時間
    // --------------------------------------------------------

    const addressHours =
        hasTaiwanAddress &&
        hasBusinessHours;

    // --------------------------------------------------------
    // 多個實體訊號
    // --------------------------------------------------------

    let score = 0;

    score +=
        Math.min(
            40,
            strongSignals.length * 12
        );

    score +=
        Math.min(
            20,
            locationSignals.length * 4
        );

    score +=
        Math.min(
            15,
            navSignals.length * 5
        );

    if (hasPhone) {
        score += 8;
    }

    if (hasTaiwanAddress) {
        score += 12;
    }

    if (hasBusinessHours) {
        score += 8;
    }

    if (hasMap) {
        score += 12;
    }

    if (jsonLd.found) {
        score += 25;
    }

    if (addressPhone) {
        score += 15;
    }

    if (addressHours) {
        score += 15;
    }

    score =
        Math.min(
            100,
            score
        );

    // --------------------------------------------------------
    // 最終判斷
    //
    // 只出現 store 不會直接判斷。
    // 但 LocalBusiness / address / map 等強訊號可以直接成立。
    // --------------------------------------------------------

    const hasPhysicalStore =
        jsonLd.found ||
        score >= 35 ||
        strongSignals.length >= 1 ||
        (
            hasTaiwanAddress &&
            (
                hasPhone ||
                hasBusinessHours ||
                hasMap
            )
        );

    const allSignals = [
        ...strongSignals.map(
            (signal) =>
                `門市:${signal}`
        ),

        ...locationSignals
            .slice(0, 10)
            .map(
                (signal) =>
                    `地點:${signal}`
            ),

        ...navSignals
            .slice(0, 8)
            .map(
                (signal) =>
                    `導覽:${signal}`
            ),

        ...(hasPhone
            ? ["電話"]
            : []),

        ...(hasTaiwanAddress
            ? ["台灣地址"]
            : []),

        ...(hasBusinessHours
            ? ["營業時間"]
            : []),

        ...(hasMap
            ? ["Google Maps / 地圖"]
            : []),

        ...jsonLd.signals,
    ];

    return {
        hasPhysicalStore,

        score,

        signals:
            Array.from(
                new Set(
                    allSignals
                )
            ).slice(0, 25),
    };
}

// ============================================================
// 平台合作判斷
// ============================================================

function isCooperationPlatform(
    platform: string
): boolean {
    const normalized =
        normalizePlatformName(
            platform
        );

    return cooperationPlatforms.some(
        (item) =>
            normalizePlatformName(
                item
            ) === normalized
    );
}

// ============================================================
// 合作狀態
// ============================================================

function getCooperation(
    platform: string,
    commerceScore: number,
    paymentIndustryScore: number,
    isContentWebsite: boolean
): string {

    if (isContentWebsite) {
        return "暫不建議";
    }

    if (
        isCooperationPlatform(
            platform
        )
    ) {
        return "可合作";
    }

    if (
        commerceScore >= 3
    ) {
        return "可開發";
    }

    if (
        paymentIndustryScore >= 2
    ) {
        return "可開發";
    }

    return "暫不建議";
}

// ============================================================
// 優先度
// ============================================================

function getPriority(
    cooperation: string,
    confidence: number,
    hasPhysicalStore: boolean,
    commerceScore: number,
    paymentIndustryScore: number,
    paymentScore: number
): string {

    if (
        cooperation ===
        "暫不建議"
    ) {
        return "暫不建議";
    }

    if (
        cooperation ===
        "可合作"
    ) {
        return "高優先";
    }

    if (
        hasPhysicalStore &&
        paymentIndustryScore >= 2
    ) {
        return "高優先";
    }

    if (
        paymentScore >= 70
    ) {
        return "高優先";
    }

    if (
        commerceScore >= 5
    ) {
        return "高優先";
    }

    if (
        confidence >= 60
    ) {
        return "中優先";
    }

    return "低優先";
}

// ============================================================
// APP / EC 串接需求狀態
// ============================================================

function getPaymentStatus(
    paymentScore: number,
    hasPaymentNeed: boolean,
    commerceScore: number,
    appScore: number,
    paymentIndustryScore: number
): string {

    if (
        paymentScore >= 70 ||
        paymentIndustryScore >= 3 ||
        commerceScore >= 7 ||
        appScore >= 3
    ) {
        return "明確需求";
    }

    if (
        hasPaymentNeed ||
        paymentScore >= 35 ||
        commerceScore >= 3 ||
        appScore >= 1 ||
        paymentIndustryScore >= 1
    ) {
        return "有機會";
    }

    return "待確認";
}

// ============================================================
// 開發類型
// ============================================================

function getDevelopmentType(
    paymentStatus: string,
    hasPhysicalStore: boolean
): string {

    const hasPayment =
        paymentStatus ===
            "明確需求" ||
        paymentStatus ===
            "有機會";

    if (
        hasPayment &&
        hasPhysicalStore
    ) {
        return "線上＋線下";
    }

    if (hasPayment) {
        return "APP / EC 串接";
    }

    if (hasPhysicalStore) {
        return "線下 POS";
    }

    return "待觀察";
}

// ============================================================
// 開發建議
// ============================================================

function getRecommendation(
    cooperation: string,
    paymentStatus: string,
    hasPhysicalStore: boolean,
    commerceScore: number,
    appScore: number,
    paymentIndustryScore: number
): string {

    if (
        cooperation ===
        "暫不建議"
    ) {
        if (hasPhysicalStore) {
            return "網站目前未發現明確 APP / EC 串接需求，但已有實體門市／據點線索，可進一步確認 POS 收款需求。";
        }

        return "目前尚未發現明確 APP / EC 串接或 POS 需求，暫不建議投入開發。";
    }

    if (
        paymentStatus ===
        "明確需求" &&
        hasPhysicalStore
    ) {
        return "網站已有明確 APP / EC 交易或串接需求，且具實體門市／據點線索，建議同步洽談全支付線上串接與 POS。";
    }

    if (
        paymentStatus ===
        "明確需求"
    ) {
        return "網站已有明確商品、交易、付款、APP 或線上服務場景，具高度 APP / EC 串接機會，建議優先接洽。";
    }

    if (
        paymentStatus ===
        "有機會" &&
        hasPhysicalStore
    ) {
        return "網站已有線上交易／服務訊號，並具實體門市或據點，可進一步評估 APP / EC 串接與 POS 合作。";
    }

    if (
        paymentIndustryScore >= 2
    ) {
        return "網站具停車、充電、預約、票券或租賃等交易場景，建議確認線上付款及 APP / EC 串接需求。";
    }

    if (
        appScore >= 1
    ) {
        return "網站出現 APP 相關訊號，可進一步確認是否有會員、支付、訂單或 APP 金流串接需求。";
    }

    if (
        commerceScore >= 3
    ) {
        return "網站具商品、購物車、會員、訂單或結帳流程，可進一步確認 APP / EC 串接需求。";
    }

    if (hasPhysicalStore) {
        return "網站目前較偏實體經營，已有門市／據點線索，可進一步確認 POS 收款需求。";
    }

    return "建議人工確認網站實際交易流程與 APP / EC 串接需求。";
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

        const rawUrl =
            String(body?.url || "").trim();

        if (!rawUrl) {

            return NextResponse.json({

                success: false,

                error:
                    "請輸入網址",

            });

        }

        const url =
            normalizeUrl(
                rawUrl
            );

        // ====================================================
        // URL 防呆
        // ====================================================

        if (!url) {
            return NextResponse.json(
                {
                    success: false,
                    error: "網址格式不正確，請輸入有效的 http / https 網址。",
                    input: rawUrl,
                },
                {
                    status: 400,
                }
            );
        }

        // ====================================================
        // 排除大型網站
        // ====================================================

        if (
            isExcluded(url)
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error: "此網站屬於排除網站，不進行分析。",
                    url,
                },
                {
                    status: 400,
                }
            );

        }

        console.log(
            "🔎 開始分析：",
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
                            "text/html,application/xhtml+xml",

                    },

                    redirect:
                        "follow",

                    signal:
                        AbortSignal.timeout(
                            15000
                        ),

                }
            );

        if (!response.ok) {
            console.warn(
                "⚠️ 網站讀取失敗：",
                url,
                `HTTP ${response.status}`
            );

            return NextResponse.json(
                {
                    success: false,
                    error: `網站無法讀取 HTTP ${response.status}`,
                    url,
                    fetchError: `HTTP ${response.status}`,
                    websiteFetchSuccess: false,
                },
                {
                    status: response.status === 403 ? 200 : 400,
                }
            );
        }

        const html =
            await response.text();

        const lowerHtml =
            html.toLowerCase();

        console.log(
            "📄 HTML 長度：",
            html.length
        );

        // ====================================================
        // 平台辨識
        // ====================================================

        const platformResults =
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

                            score:
                                found.length *
                                fingerprint.weight,

                            found,

                        };

                    }
                )
                .sort(
                    (a, b) =>
                        b.score -
                        a.score
                );

        const best =
            platformResults[0];

        let platform =
            "Unknown";

        let confidence =
            30;

        let evidence: string[] =
            [];

        if (
            best &&
            best.score > 0
        ) {

            platform =
                formatPlatformName(
                    best.name
                );

            evidence =
                best.found;

            confidence =
                Math.min(
                    98,
                    50 +
                    best.found.length *
                    15
                );

        }

        // ====================================================
        // 品牌
        // ====================================================

        const brand =
            detectBrand(
                html,
                url
            );

        // ====================================================
        // 內容網站
        // ====================================================

        const contentWebsite =
            detectContentWebsite(
                html,
                url
            );

        // ====================================================
        // EC / APP / 金流
        // ====================================================

        const commerce =
            detectCommerceSignals(
                html
            );

        // ====================================================
        // POS
        // ====================================================

        const physicalStore =
            detectPhysicalStore(
                html
            );

        // ====================================================
        // APP / EC 串接需求
        // ====================================================

        const paymentStatus =
            getPaymentStatus(
                commerce.paymentScore,
                commerce.hasPaymentNeed,
                commerce.commerceScore,
                commerce.appScore,
                commerce.paymentIndustryScore
            );

        // ====================================================
        // 合作狀態
        // ====================================================

        const cooperation =
            getCooperation(
                platform,
                commerce.commerceScore,
                commerce.paymentIndustryScore,
                contentWebsite.isContentWebsite
            );

        // ====================================================
        // 優先度
        // ====================================================

        const priority =
            getPriority(
                cooperation,
                confidence,
                physicalStore.hasPhysicalStore,
                commerce.commerceScore,
                commerce.paymentIndustryScore,
                commerce.paymentScore
            );

        // ====================================================
        // 開發類型
        // ====================================================

        const developmentType =
            getDevelopmentType(
                paymentStatus,
                physicalStore.hasPhysicalStore
            );

        // ====================================================
        // 開發建議
        // ====================================================

        const recommendation =
            getRecommendation(
                cooperation,
                paymentStatus,
                physicalStore.hasPhysicalStore,
                commerce.commerceScore,
                commerce.appScore,
                commerce.paymentIndustryScore
            );

        // ====================================================
        // Evidence
        // ====================================================

        const finalEvidence = [
            ...evidence,

            ...commerce.commerceSignals.map(
                (signal) =>
                    `EC:${signal}`
            ),

            ...commerce.appSignals.map(
                (signal) =>
                    `APP:${signal}`
            ),

            ...commerce.paymentIndustrySignals.map(
                (signal) =>
                    `交易場景:${signal}`
            ),

            ...physicalStore.signals.map(
                (signal) =>
                    `POS:${signal}`
            ),

            ...contentWebsite.signals.map(
                (signal) =>
                    `內容網站:${signal}`
            ),
        ].slice(0, 50);

        // ====================================================
        // 最終結果
        //
        // 注意：
        // 已移除 leadScore
        // 新增 paymentScore / hasPaymentNeed
        // 新增 appScore / appSignals
        // 新增 developmentType
        // ====================================================

        const result = {

            success: true,

            url,

            websiteFetchSuccess: true,
            fetchError: "",

            brand,

            platform,

            confidence,

            cooperation,

            priority,

            developmentType,

            recommendation,

            // ------------------------------------------------
            // APP / EC 串接需求
            // ------------------------------------------------

            paymentStatus,

            hasPaymentNeed:
                commerce.hasPaymentNeed,

            paymentScore:
                commerce.paymentScore,

            paymentSignals:
                commerce.commerceSignals,

            // ------------------------------------------------
            // APP
            // ------------------------------------------------

            appScore:
                commerce.appScore,

            appSignals:
                commerce.appSignals,

            // ------------------------------------------------
            // EC
            // ------------------------------------------------

            commerceScore:
                commerce.commerceScore,

            commerceSignals:
                commerce.commerceSignals,

            // ------------------------------------------------
            // 特殊交易場景
            // ------------------------------------------------

            paymentIndustryScore:
                commerce.paymentIndustryScore,

            paymentIndustrySignals:
                commerce.paymentIndustrySignals,

            // ------------------------------------------------
            // POS
            // ------------------------------------------------

            physicalStore: {

                hasPhysicalStore:
                    physicalStore.hasPhysicalStore,

                score:
                    physicalStore.score,

                signals:
                    physicalStore.signals,

            },

            // ------------------------------------------------
            // 平台辨識
            // ------------------------------------------------

            evidence:
                finalEvidence,

            isContentWebsite:
                contentWebsite.isContentWebsite,

        };

        console.log(
            "✅ 分析完成：",
            result
        );

        return NextResponse.json(
            result
        );

    } catch (error) {

        console.error(
            "❌ Analyze API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "網站分析發生錯誤",
            },
            {
                status: 500,
            }
        );

    }
}