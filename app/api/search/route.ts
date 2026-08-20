import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// ============================================================
// PayLead Finder v13
// Taiwan Merchant Discovery - Tavily + OpenStreetMap Structured Discovery
//
// Goals
// 1. OpenAI completely removed.
// 2. Find many Taiwan-local merchants, not merely websites with payment words.
// 3. Broad industries use many diverse Tavily queries with dynamic stop.
// 4. Industry-specific gates remove cross-industry noise.
// 5. Department-store search distinguishes mall/operator from tenant brands.
// 6. Website fetch failure does not automatically remove a strong candidate.
// 7. OpenStreetMap structured POIs add real merchant/operator entities for supported physical industries.
// 8. Site-role classifier rejects media/directories/research/jobs/travel pages even if they mention the target industry.
// 9. Preserve legacy response fields used by the frontend.
// ============================================================

type SearchResult = {
    title: string;
    url: string;
    description: string;
    query: string;
    source: "Tavily" | "OpenStreetMap";
    searchScore: number;
    structuredIndustry?: boolean;
    structuredSignals?: string[];
};

type Candidate = SearchResult & {
    domainKey: string;
    relevanceScore: number;
    appearanceCount: number;
    sourceUrls: string[];
};

type IndustryProfile = {
    id: string;
    keys: string[];
    aliases: string[];
    strongSignals: string[];
    signals: string[];
    searchTerms: string[];
    operatorSignals?: string[];
    negativeSearchSignals?: string[];
    broad?: boolean;
};

type PlatformResult = {
    platform: string;
    evidence: string[];
};

type TavilySearchResponse = {
    results: SearchResult[];
    credits: number;
    error?: string;
};

type IndustryAnalysis = {
    score: number;
    tier: "A" | "B" | "C" | "D";
    passes: boolean;
    profileGatePassed: boolean;
    searchIndustryScore: number;
    strongSignals: string[];
    aliases: string[];
    signals: string[];
    operatorSignals: string[];
    negativeSearchSignals: string[];
};

// ============================================================
// Tunables
// ============================================================

const SEARCH_BATCH_SIZE = 2;
const MAX_TAVILY_RESULTS = 20;
const MAX_QUERY_COUNT_DEFAULT = 10;
const MAX_QUERY_COUNT_BROAD = 14;
const MIN_QUERIES_BEFORE_STOP_DEFAULT = 4;
const MIN_QUERIES_BEFORE_STOP_BROAD = 6;
const TARGET_CANDIDATES_DEFAULT = 55;
const TARGET_CANDIDATES_BROAD = 78;
const MAX_CANDIDATES_TO_ANALYZE = 96;
const ANALYZE_BATCH_SIZE = 12;
const MAX_ANALYZED_RESULTS = 42;
const FINAL_RESULT_LIMIT = 30;
const SEARCH_CACHE_TTL = 10 * 60 * 1000;
const PAGE_CACHE_TTL = 30 * 60 * 1000;
const OSM_CACHE_TTL = 6 * 60 * 60 * 1000;
const MAX_OSM_RESULTS = 140;
const OVERPASS_TIMEOUT_MS = 22000;

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
        keywords: ["waca.net", "waca.tw"],
    },
    {
        name: "liteshop",
        keywords: ["liteshop.tw", "liteshop.com.tw"],
    },
    {
        name: "showmore",
        keywords: ["showmore.com.tw", "showmore.com"],
    },
    {
        name: "尚峪",
        keywords: ["尚峪"],
    },
    {
        name: "環匯亞太",
        keywords: ["global payments", "globalpayments"],
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
            "cyberbiz.io",
            "cyberbiz.co",
            "store.cyberbiz.co",
        ],
    },
    {
        name: "meepshop",
        keywords: [
            "meepshop.com",
            "meepcloud.com",
            "cdn.meepshop.com",
        ],
    },
];

// ============================================================
// Industry Profiles
// ============================================================

const industryProfiles: IndustryProfile[] = [
    {
        id: "department-store",
        broad: true,
        keys: ["百貨", "百貨公司", "購物中心", "商場", "outlet"],
        aliases: [
            "百貨",
            "百貨公司",
            "購物中心",
            "購物商場",
            "商場",
            "購物廣場",
            "時尚廣場",
            "shopping mall",
            "department store",
            "outlet",
            "outlet mall",
        ],
        strongSignals: [
            "百貨公司",
            "購物中心",
            "購物商場",
            "shopping mall",
            "department store",
            "outlet mall",
            "購物廣場",
            "時尚廣場",
        ],
        signals: [
            "百貨",
            "商場",
            "專櫃",
            "館別",
            "樓層",
            "櫃位",
            "品牌樓層",
            "mall",
            "outlet",
        ],
        operatorSignals: [
            "樓層導覽",
            "樓層指南",
            "樓層介紹",
            "品牌導覽",
            "品牌樓層",
            "櫃位查詢",
            "館別介紹",
            "樓層資訊",
            "停車資訊",
            "停車優惠",
            "顧客服務",
            "服務台",
            "會員卡",
            "聯名卡",
            "週年慶",
            "樓層平面圖",
            "店櫃導覽",
            "館內服務",
        ],
        // Only used on title/snippet. These are not global blacklists.
        negativeSearchSignals: [
            "電視台",
            "新聞網",
            "新聞媒體",
            "人力銀行",
            "求職",
            "職缺",
            "履歷",
            "旅行社",
            "旅遊",
            "機票",
            "跟團",
            "自由行",
            "香氛",
            "沐浴",
            "美妝",
            "化妝品",
            "保養品",
            "精品品牌",
            "品牌官網",
            "官方購物網站",
        ],
        searchTerms: [
            "百貨公司",
            "購物中心",
            "shopping mall",
            "outlet mall",
            "時尚廣場",
            "購物廣場",
            "大型購物中心",
            "地方百貨",
            "百貨商場",
            "百貨集團",
        ],
    },
    {
        id: "furniture",
        broad: true,
        keys: ["家具", "傢俱", "家居", "沙發", "床墊", "系統家具"],
        aliases: [
            "家具",
            "傢俱",
            "家居",
            "系統家具",
            "系統傢俱",
            "設計家具",
            "沙發",
            "床墊",
            "居家家具",
            "home furniture",
            "furniture",
        ],
        strongSignals: [
            "家具品牌",
            "傢俱品牌",
            "家具門市",
            "傢俱門市",
            "系統家具",
            "系統傢俱",
            "家具館",
            "家居館",
            "沙發品牌",
            "床墊品牌",
            "furniture",
        ],
        signals: [
            "家具",
            "傢俱",
            "家居",
            "沙發",
            "床墊",
            "餐桌",
            "餐椅",
            "衣櫃",
            "床架",
            "茶几",
            "電視櫃",
            "系統櫃",
            "收納櫃",
            "居家",
            "sofa",
            "mattress",
        ],
        searchTerms: [
            "家具品牌",
            "連鎖家具店",
            "家居品牌",
            "系統家具",
            "沙發品牌",
            "床墊品牌",
            "設計家具",
            "家具門市",
            "家具集團",
            "居家家具",
        ],
    },
    {
        id: "fitness",
        broad: true,
        keys: ["健身", "健身房", "健身俱樂部", "運動中心"],
        aliases: ["健身", "健身房", "健身俱樂部", "運動中心", "fitness", "gym"],
        strongSignals: [
            "健身房",
            "健身中心",
            "健身俱樂部",
            "健身會館",
            "fitness center",
            "fitness club",
            "gym",
        ],
        signals: [
            "健身",
            "fitness",
            "gym",
            "私人教練",
            "教練課",
            "團體課程",
            "團課",
            "重訓",
            "重量訓練",
            "健身教練",
            "健身會員",
            "會籍",
            "personal training",
        ],
        searchTerms: [
            "健身房",
            "健身俱樂部",
            "連鎖健身房",
            "fitness gym",
            "健身會館",
            "私人教練健身房",
            "運動中心健身",
        ],
    },
    {
        id: "pet",
        broad: true,
        keys: ["寵物", "寵物用品", "寵物商店"],
        aliases: ["寵物", "寵物用品", "寵物商店", "寵物品牌", "寵物用品店"],
        strongSignals: ["寵物用品", "寵物商店", "寵物用品店", "寵物商城"],
        signals: ["寵物", "毛孩", "狗狗", "貓咪", "犬用", "貓用", "飼料", "寵物食品", "寵物美容"],
        searchTerms: ["寵物用品品牌", "寵物商店", "連鎖寵物用品店", "寵物品牌", "寵物商城", "寵物門市"],
    },
    {
        id: "restaurant",
        broad: true,
        keys: ["餐飲", "餐廳", "餐飲品牌"],
        aliases: ["餐飲", "餐廳", "餐飲品牌", "連鎖餐廳", "餐飲集團", "restaurant"],
        strongSignals: ["餐廳", "餐飲品牌", "餐飲集團", "restaurant"],
        signals: ["餐飲", "菜單", "menu", "訂位", "訂餐", "外帶", "內用", "美食", "套餐"],
        searchTerms: ["餐飲品牌", "連鎖餐廳", "餐飲集團", "餐廳品牌", "連鎖餐飲", "餐廳門市"],
    },
    {
        id: "beverage",
        keys: ["手搖", "手搖飲", "茶飲", "飲料店"],
        aliases: ["手搖飲", "手搖飲料", "茶飲", "茶飲品牌", "飲料店"],
        strongSignals: ["手搖飲", "手搖飲料", "茶飲品牌", "飲料店"],
        signals: ["茶飲", "飲料", "珍珠奶茶", "奶茶", "茶品", "飲品", "門市菜單"],
        searchTerms: ["手搖飲品牌", "茶飲品牌", "連鎖飲料店", "飲料品牌", "手搖飲門市"],
    },
    {
        id: "fashion",
        broad: true,
        keys: ["服飾", "服裝", "短袖", "T恤", "男裝", "女裝"],
        aliases: ["服飾", "服裝", "服飾品牌", "服裝品牌", "男裝", "女裝", "T恤", "t-shirt"],
        strongSignals: ["服飾品牌", "服裝品牌", "男裝品牌", "女裝品牌"],
        signals: ["服飾", "服裝", "上衣", "短袖", "T恤", "男裝", "女裝", "童裝", "外套", "褲款", "穿搭", "尺寸表"],
        searchTerms: ["服飾品牌", "服裝品牌", "台灣服飾品牌", "男裝品牌", "女裝品牌", "服飾門市", "服飾電商"],
    },
    {
        id: "beauty",
        keys: ["美容", "美髮", "髮廊", "美容院"],
        aliases: ["美容", "美髮", "美容沙龍", "美髮沙龍", "髮廊", "salon"],
        strongSignals: ["美容工作室", "美容中心", "美容沙龍", "美髮沙龍", "髮廊"],
        signals: ["美容", "美髮", "沙龍", "salon", "護膚", "保養", "做臉", "剪髮", "染髮", "燙髮", "美容師", "設計師"],
        searchTerms: ["美容品牌", "美容沙龍", "連鎖美容", "美髮沙龍", "連鎖髮廊", "美容門市"],
    },
    {
        id: "medical-beauty",
        keys: ["醫美", "醫美診所"],
        aliases: ["醫美", "醫美診所", "醫學美容", "醫療美容"],
        strongSignals: ["醫美診所", "醫學美容", "醫療美容"],
        signals: ["醫美", "皮秒", "雷射", "玻尿酸", "肉毒", "音波", "電波", "微整"],
        searchTerms: ["醫美診所", "醫學美容診所", "醫美連鎖", "醫美品牌", "醫美中心"],
    },
    {
        id: "hotel",
        keys: ["飯店", "住宿", "旅館", "酒店"],
        aliases: ["飯店", "住宿", "旅館", "酒店", "hotel"],
        strongSignals: ["飯店", "旅館", "住宿", "hotel"],
        signals: ["客房", "房型", "住房", "入住", "退房", "訂房", "booking"],
        searchTerms: ["飯店品牌", "連鎖飯店", "旅館品牌", "住宿品牌", "飯店集團", "商務旅館"],
    },
    {
        id: "parking",
        keys: ["停車", "停車場"],
        aliases: ["停車", "停車場", "停車服務", "停車管理", "parking"],
        strongSignals: ["停車場", "停車服務", "停車管理"],
        signals: ["停車", "停車費", "停車繳費", "月租停車", "車位", "停車位", "parking"],
        searchTerms: ["停車場公司", "停車服務", "停車管理公司", "智慧停車", "停車場營運商"],
    },
    {
        id: "ev-charging",
        keys: ["充電", "充電樁", "充電站", "電動車充電"],
        aliases: ["充電樁", "充電站", "電動車充電", "EV charging"],
        strongSignals: ["充電樁", "充電站", "電動車充電", "ev charging"],
        signals: ["充電", "電動車", "EV", "充電費", "充電服務", "charging station"],
        searchTerms: ["電動車充電品牌", "充電樁公司", "EV charging", "充電站營運商", "電動車充電平台"],
    },
    {
        id: "education",
        keys: ["補習班", "教育", "課程", "才藝班"],
        aliases: ["補習班", "教育中心", "學習中心", "才藝班", "課程"],
        strongSignals: ["補習班", "教育中心", "學習中心", "才藝班"],
        signals: ["課程", "招生", "學生", "學員", "上課", "班級", "學費", "報名"],
        searchTerms: ["補習班品牌", "連鎖補習班", "教育中心", "學習中心", "才藝班", "課程平台"],
    },
    {
        id: "ticketing",
        keys: ["票券", "售票", "展演", "活動票券"],
        aliases: ["售票", "票券", "活動票券", "展演售票", "ticket"],
        strongSignals: ["售票平台", "線上售票", "活動售票", "展演售票"],
        signals: ["售票", "購票", "票券", "門票", "演唱會", "展覽", "表演", "活動票", "ticket"],
        searchTerms: ["售票平台", "活動售票", "展演售票", "票券平台", "線上購票"],
    },
    {
        id: "car-rental",
        keys: ["租車", "汽車租賃"],
        aliases: ["租車", "汽車租賃", "租車服務", "car rental"],
        strongSignals: ["租車", "汽車租賃", "租車服務"],
        signals: ["租賃", "車輛租借", "取車", "還車", "日租", "短租", "car rental"],
        searchTerms: ["租車公司", "汽車租賃", "租車品牌", "連鎖租車", "租車服務"],
    },
];

// ============================================================
// Merchant / Payment / Physical Signals
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

const merchantSignals = [
    "購物車",
    "加入購物車",
    "購物袋",
    "cart",
    "checkout",
    "add to cart",
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

const paymentSignals = [
    "付款",
    "支付",
    "信用卡",
    "信用卡付款",
    "電子支付",
    "行動支付",
    "qr code",
    "qr付款",
    "線上付款",
    "線上支付",
    "app付款",
    "app支付",
    "payment",
    "結帳",
    "checkout",
    "訂金",
    "押金",
    "尾款",
    "會員扣款",
    "自動扣款",
    "定期扣款",
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
];

const institutionalSignals = [
    "資訊網",
    "資訊平台",
    "產業資訊",
    "產業價值鏈",
    "研究平台",
    "研究報告",
    "產業報告",
    "統計資料",
    "統計資訊",
    "資料庫",
    "公開資料",
    "公開資訊",
    "政府資訊",
    "政策資訊",
    "主管機關",
    "觀光資訊",
    "產業研究",
    "市場研究",
    "法人說明會",
    "證券櫃檯",
    "證券交易",
    "交易所",
    "學術研究",
    "研究中心",
    "協會",
    "公會",
    "學會",
    "社團法人",
];

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
    "最新消息",
    "news",
    "media",
    "magazine",
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
    "情報站",
    "資訊站",
    "黃頁",
    "百科",
    "知識百科",
    "詢價平台",
    "店家地圖",
    "樂趣地圖",
    "產業分析",
    "研究報告",
    "論文",
    "seo",
    "架站",
];


const taiwanSignals = [
    "台灣",
    "臺灣",
    "taiwan",
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
];

// ============================================================
// Exclusions
// ============================================================

const excludedDomains = [
    "google.com",
    "google.com.tw",
    "bing.com",
    "yahoo.com",
    "yahoo.com.tw",
    "duckduckgo.com",
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
    "momo.com.tw",
    "momoshop.com.tw",
    "pchome.com.tw",
    "shopee.tw",
    "shopee.com",
    "ruten.com.tw",
    "buy123.com.tw",
    "shopping.yahoo.com",
    "tw.buy.yahoo.com",
    "taobao.com",
    "tmall.com",
    "1688.com",
    "jd.com",
    "amazon.com",
    "amazon.com.tw",
    "ubereats.com",
    "foodpanda.com",
    "foodpanda.com.tw",
    "inline.app",
    "inline.company",
    "eztable.com",
    "shopback.com",
    "shopback.com.tw",
    "tripadvisor.com",
    "tripadvisor.com.tw",
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
    "medium.com",
    "substack.com",
    "blogspot.com",
    "wordpress.com",
    "pixnet.net",
    "xuite.net",
    "wikipedia.org",
    "faq.tw",
    "faqs.tw",
    "ptt.cc",
    "dcard.tw",
    "reddit.com",
    "quora.com",
    "104.com.tw",
    "1111.com.tw",
    "1111job.com.tw",
    "518.com.tw",
    "gov.tw",
];

const hardExcludedDomains = [
    "7-11.com.tw",
    "7-11.com",
    "family.com.tw",
    "hilife.com.tw",
    "okmart.com.tw",
    "pxmart.com.tw",
    "carrefour.com.tw",
    "costco.com.tw",
    "uniqlo.com",
    "gu-global.com",
    "giordano.com",
    "cyberbiz.io",
    "meepshop.com",
    "supportmeepshop.com",
    "shoplineapp.com",
    "support.shoplineapp.com",
    "uptogo.com.tw",
    "vibeaico.com",
    "rosy-arts.com",
    "whbydcc.com",
];

const tavilyExcludedDomains = [
    "facebook.com",
    "instagram.com",
    "youtube.com",
    "tiktok.com",
    "linkedin.com",
    "momo.com.tw",
    "momoshop.com.tw",
    "pchome.com.tw",
    "shopee.tw",
    "ruten.com.tw",
    "ubereats.com",
    "foodpanda.com.tw",
    "inline.app",
    "tripadvisor.com",
    "businessweekly.com.tw",
    "cw.com.tw",
    "storm.mg",
    "setn.com",
    "ettoday.net",
    "udn.com",
    "ltn.com.tw",
    "chinatimes.com",
    "tvbs.com.tw",
    "cna.com.tw",
    "medium.com",
    "pixnet.net",
    "wikipedia.org",
    "ptt.cc",
    "dcard.tw",
    "104.com.tw",
    "1111.com.tw",
    "1111job.com.tw",
    "web66.com.tw",
    "poi.zhupiter.com",
    "jendow.com.tw",
];


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

const excludedTitleSignals = [
    "新聞網",
    "即時新聞",
    "新聞報導",
    "懶人包",
    "排行榜",
    "推薦排行",
    "推薦清單",
    "比價",
    "操作教學",
    "使用教學",
    "痞客邦",
    "網路開店平台",
    "架站平台",
];

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
    "如何開店",
    "開店教學",
];

const foreignTlds = [
    ".co.jp",
    ".jp",
    ".com.hk",
    ".hk",
    ".com.cn",
    ".cn",
    ".co.kr",
    ".kr",
    ".com.sg",
    ".sg",
    ".com.my",
    ".my",
    ".ph",
    ".in",
    ".de",
    ".fr",
    ".co.uk",
    ".uk",
];


// ============================================================
// Cross-Industry Search Noise
//
// 不是固定網址黑名單。
// 只有「搜尋目標不是該類別」且標題/摘要明確屬其他類別時才排除。
// ============================================================

const crossIndustrySearchGroups = [
    {
        id: "media",
        signals: [
            "電視台",
            "新聞網",
            "新聞媒體",
            "即時新聞",
            "新聞頻道",
            "媒體集團",
        ],
        targetKeys: [
            "新聞",
            "媒體",
            "電視",
            "電視台",
        ],
    },
    {
        id: "jobs",
        signals: [
            "人力銀行",
            "求職",
            "職缺",
            "履歷",
            "找工作",
            "徵才",
            "就業網",
        ],
        targetKeys: [
            "人力",
            "求職",
            "招聘",
            "徵才",
            "職缺",
        ],
    },
    {
        id: "travel",
        signals: [
            "旅行社",
            "團體旅遊",
            "自由行",
            "機票",
            "旅遊行程",
            "國外旅遊",
            "國內旅遊",
        ],
        targetKeys: [
            "旅遊",
            "旅行",
            "旅行社",
            "機票",
            "自由行",
        ],
    },
    {
        id: "content-directory",
        signals: [
            "情報站",
            "資訊站",
            "入口網站",
            "懶人包",
            "推薦排行",
            "排行榜",
            "比較網",
            "評比",
            "攻略",
        ],
        targetKeys: [
            "媒體",
            "資訊",
            "內容",
            "新聞",
        ],
    },
    {
        id: "beauty-brand",
        signals: [
            "香氛",
            "香水",
            "沐浴",
            "美妝",
            "化妝品",
            "保養品",
        ],
        targetKeys: [
            "美容",
            "美妝",
            "香氛",
            "香水",
            "保養",
            "化妝品",
        ],
    },
];


// ============================================================
// Non-merchant / Site-role classifier
//
// This prevents "an article about a mall" from becoming a mall lead.
// Title evidence is weighted much more heavily than generic homepage words.
// ============================================================

const nonMerchantSiteRoleGroups = [
    {
        id: "media",
        titleSignals: [
            "新聞",
            "媒體",
            "電視台",
            "雜誌",
            "新聞網",
            "foodnext",
            "tatler",
        ],
        bodySignals: [
            "記者",
            "編輯",
            "最新文章",
            "熱門文章",
            "新聞中心",
            "即時新聞",
            "發布日期",
            "作者",
        ],
    },
    {
        id: "directory",
        titleSignals: [
            "情報站",
            "資訊站",
            "黃頁",
            "百科",
            "知識百科",
            "地圖",
            "詢價平台",
            "店家搜尋",
            "店家資訊",
            "推薦",
            "攻略",
            "排行榜",
        ],
        bodySignals: [
            "分類目錄",
            "店家列表",
            "商家列表",
            "附近店家",
            "店家搜尋",
            "景點搜尋",
            "地圖搜尋",
            "百科全書",
        ],
    },
    {
        id: "jobs",
        titleSignals: [
            "人力銀行",
            "求職",
            "職缺",
            "徵才",
            "就業網",
        ],
        bodySignals: [
            "履歷",
            "找工作",
            "應徵",
            "職缺",
            "徵才",
        ],
    },
    {
        id: "research",
        titleSignals: [
            "研究",
            "協會",
            "學會",
            "公會",
            "產業分析",
            "產業資訊",
            "研究中心",
            "研究院",
        ],
        bodySignals: [
            "研究報告",
            "論文",
            "統計資料",
            "產業報告",
            "會員名錄",
            "學術",
            "研討會",
        ],
    },
    {
        id: "travel",
        titleSignals: [
            "旅行社",
            "旅遊",
            "自由行",
            "機票",
        ],
        bodySignals: [
            "旅遊行程",
            "團體旅遊",
            "出國",
            "機票",
            "自由行",
        ],
    },
    {
        id: "software-content",
        titleSignals: [
            "seo",
            "架站",
            "軟體",
            "社群經營",
            "行銷",
        ],
        bodySignals: [
            "網站架設",
            "SEO",
            "數位行銷",
            "社群經營",
            "教學文章",
        ],
    },
];

function getStrongTargetTitleSignals(
    keyword: string,
    title: string
) {
    const profile = getIndustryProfile(keyword);

    return uniqueStrings([
        ...findSignals(title, profile.strongSignals),
        ...findSignals(title, profile.aliases),
    ]);
}

function getNonMerchantSiteRole(
    keyword: string,
    title: string,
    description: string,
    websiteText: string
) {
    const titleText = cleanSearchText(title);
    const searchText = `${titleText} ${description}`;
    const body = websiteText.slice(0, 60000);
    const targetTitleSignals = getStrongTargetTitleSignals(
        keyword,
        titleText
    );

    let best = {
        id: "",
        score: 0,
        signals: [] as string[],
    };

    for (const group of nonMerchantSiteRoleGroups) {
        const titleHits = findSignals(
            searchText,
            group.titleSignals
        );
        const bodyHits = findSignals(
            body,
            group.bodySignals
        );

        let score = titleHits.length * 45 + bodyHits.length * 14;

        // A title that clearly identifies the requested industry gets protection.
        if (targetTitleSignals.length > 0) {
            score -= 32;
        }

        if (score > best.score) {
            best = {
                id: group.id,
                score,
                signals: uniqueStrings([
                    ...titleHits,
                    ...bodyHits,
                ]).slice(0, 12),
            };
        }
    }

    return {
        ...best,
        reject:
            best.score >= 45 &&
            targetTitleSignals.length === 0,
    };
}

// ============================================================
// Caches
// ============================================================

const searchCache = new Map<
    string,
    {
        timestamp: number;
        results: SearchResult[];
    }
>();

const pageCache = new Map<
    string,
    {
        timestamp: number;
        html: string;
    }
>();

const osmCache = new Map<
    string,
    {
        timestamp: number;
        results: SearchResult[];
    }
>();

// ============================================================
// Helpers
// ============================================================

function clamp(value: number, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}

function uniqueStrings(values: string[]) {
    return Array.from(
        new Set(
            values
                .map((value) => value.trim())
                .filter(Boolean)
        )
    );
}

function decodeHtmlEntities(value: string) {
    return value
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
            const code = Number.parseInt(hex, 16);
            return Number.isFinite(code)
                ? String.fromCodePoint(code)
                : " ";
        })
        .replace(/&#([0-9]+);/g, (_, decimal) => {
            const code = Number.parseInt(decimal, 10);
            return Number.isFinite(code)
                ? String.fromCodePoint(code)
                : " ";
        })
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
}

function cleanSearchText(value: string) {
    return decodeHtmlEntities(String(value || ""))
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function cleanHtml(html: string) {
    return decodeHtmlEntities(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
            .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
            .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
            .replace(/<[^>]+>/g, " ")
    )
        .replace(/\s+/g, " ")
        .trim();
}

function findSignals(text: string, signals: string[]) {
    const lower = text.toLowerCase();

    return signals.filter((signal) =>
        lower.includes(signal.toLowerCase())
    );
}

function getHostname(url: string) {
    try {
        return new URL(url)
            .hostname
            .toLowerCase()
            .replace(/^www\./, "");
    } catch {
        return "";
    }
}

function getOrigin(url: string) {
    try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.hostname}`;
    } catch {
        return "";
    }
}

function normalizeUrl(rawUrl: string) {
    try {
        const parsed = new URL(rawUrl.trim());
        parsed.hash = "";
        parsed.search = "";

        if (parsed.pathname !== "/") {
            parsed.pathname = parsed.pathname.replace(/\/+$/, "");
        }

        return parsed.toString().replace(/\/$/, "");
    } catch {
        return "";
    }
}


function normalizeExternalUrl(rawUrl: string) {
    const value = String(rawUrl || "").trim();

    if (!value) {
        return "";
    }

    if (/^https?:\/\//i.test(value)) {
        return normalizeUrl(value);
    }

    if (
        value.startsWith("www.") ||
        /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(value)
    ) {
        return normalizeUrl(`https://${value}`);
    }

    return "";
}


function getDomainKey(url: string) {
    const host = getHostname(url);

    if (!host) {
        return "";
    }

    const parts = host.split(".").filter(Boolean);

    if (parts.length <= 2) {
        return host;
    }

    const multiPartSuffixes = [
        "com.tw",
        "net.tw",
        "org.tw",
        "edu.tw",
        "gov.tw",
        "co.jp",
        "com.hk",
        "com.cn",
        "co.kr",
        "com.sg",
        "com.my",
        "co.uk",
    ];

    const lastTwo = parts.slice(-2).join(".");

    if (multiPartSuffixes.includes(lastTwo) && parts.length >= 3) {
        return parts.slice(-3).join(".");
    }

    return parts.slice(-2).join(".");
}

function isExcludedDomain(url: string) {
    const host = getHostname(url);

    if (!host) {
        return true;
    }

    return [...excludedDomains, ...hardExcludedDomains].some(
        (domain) => host === domain || host.endsWith(`.${domain}`)
    );
}

function isExcludedPath(url: string) {
    try {
        const path = new URL(url).pathname.toLowerCase();

        return excludedPaths.some(
            (excluded) =>
                path === excluded || path.startsWith(`${excluded}/`)
        );
    } catch {
        return true;
    }
}

function shouldExcludeUrl(url: string) {
    return !url || isExcludedDomain(url) || isExcludedPath(url);
}

function isForeignTld(url: string) {
    const host = getHostname(url);
    return foreignTlds.some((tld) => host.endsWith(tld));
}

// ============================================================
// Industry Resolution
// ============================================================

function getIndustryProfile(keyword: string): IndustryProfile {
    const lower = keyword.toLowerCase().trim();

    for (const profile of industryProfiles) {
        const matched = profile.keys.some((key) => {
            const keyLower = key.toLowerCase();
            return lower.includes(keyLower) || keyLower.includes(lower);
        });

        if (matched) {
            return profile;
        }
    }

    return {
        id: "generic",
        keys: [keyword],
        aliases: [keyword],
        strongSignals: [keyword],
        signals: [keyword],
        searchTerms: [keyword],
        broad: false,
    };
}

// ============================================================
// Query Generation
// ============================================================

function getDepartmentStoreQueries() {
    return [
        "台灣 百貨公司",
        "台灣 購物中心",
        "台灣 shopping mall",
        "台灣 outlet mall",
        "台北 新北 百貨公司 購物中心",
        "桃園 新竹 百貨公司 購物中心",
        "台中 彰化 百貨公司 購物中心",
        "嘉義 台南 百貨公司 購物中心",
        "高雄 屏東 百貨公司 購物中心",
        "宜蘭 花蓮 百貨公司 購物中心",
        "台灣 時尚廣場 購物廣場",
        "台灣 百貨集團 購物中心集團",
        "台灣 outlet 購物中心",
        "台灣 百貨 樓層導覽 專櫃",
    ];
}

function getFurnitureQueries() {
    return [
        "台灣 家具品牌 官方網站",
        "台灣 連鎖家具店 官方網站",
        "台灣 家具門市 品牌 官方網站",
        "台灣 家居品牌 家具 官方網站",
        "台灣 系統家具 品牌 官方網站",
        "台灣 沙發品牌 家具 官方網站",
        "台灣 床墊 家具 品牌 官方網站",
        "台灣 設計家具 北歐家具 品牌",
        "台北 新北 桃園 家具店 家具品牌",
        "新竹 台中 彰化 家具店 家具品牌",
        "嘉義 台南 高雄 家具店 家具品牌",
        "台灣 家具集團 連鎖門市",
        "台灣 家居生活 家具 門市",
        "台灣 furniture 家具 官方網站",
    ];
}

function getSearchQueries(keyword: string) {
    const profile = getIndustryProfile(keyword);

    if (profile.id === "department-store") {
        return getDepartmentStoreQueries();
    }

    if (profile.id === "furniture") {
        return getFurnitureQueries();
    }

    const terms = uniqueStrings([
        keyword,
        ...profile.searchTerms,
        ...profile.aliases,
    ]);

    const primary = terms[0] || keyword;
    const second = terms[1] || primary;
    const third = terms[2] || primary;
    const fourth = terms[3] || primary;
    const fifth = terms[4] || primary;
    const sixth = terms[5] || primary;

    const queries = [
        `台灣 ${primary} 官方網站`,
        `台灣 ${second} 品牌 門市`,
        `台灣 ${third} 連鎖 公司 官方網站`,
        `台北 新北 桃園 ${primary}`,
        `新竹 台中 彰化 ${primary}`,
        `嘉義 台南 高雄 ${primary}`,
        `台灣 ${fourth} 官方網站`,
        `台灣 ${fifth} 品牌`,
        `台灣 ${sixth} 門市`,
        `台灣 ${primary} 會員 線上購物 預約`,
    ];

    const maxQueryCount = profile.broad
        ? MAX_QUERY_COUNT_BROAD
        : MAX_QUERY_COUNT_DEFAULT;

    return uniqueStrings(
        queries.map((query) => query.replace(/\s+/g, " ").trim())
    ).slice(0, maxQueryCount);
}


// ============================================================
// OpenStreetMap / Overpass Structured Discovery
//
// OSM is used only as a structured discovery source for industries
// where OSM has meaningful business-category tags. Only POIs with a
// website/contact website are returned to the lead pipeline.
// ============================================================

type OsmSelector = {
    key: string;
    value: string;
    extraKey?: string;
    extraPattern?: string;
};

function getOsmSelectors(profileId: string): OsmSelector[] {
    switch (profileId) {
        case "department-store":
            return [
                { key: "shop", value: "mall" },
                { key: "shop", value: "department_store" },
            ];

        case "furniture":
            return [
                { key: "shop", value: "furniture" },
                { key: "shop", value: "bed" },
            ];

        case "fitness":
            return [
                { key: "leisure", value: "fitness_centre" },
                {
                    key: "leisure",
                    value: "sports_centre",
                    extraKey: "sport",
                    extraPattern: "fitness|gym",
                },
            ];

        case "pet":
            return [
                { key: "shop", value: "pet" },
            ];

        case "restaurant":
            return [
                { key: "amenity", value: "restaurant" },
            ];

        case "beverage":
            return [
                { key: "shop", value: "beverages" },
            ];

        case "fashion":
            return [
                { key: "shop", value: "clothes" },
                { key: "shop", value: "fashion" },
            ];

        case "beauty":
            return [
                { key: "shop", value: "beauty" },
                { key: "shop", value: "hairdresser" },
            ];

        case "hotel":
            return [
                { key: "tourism", value: "hotel" },
                { key: "tourism", value: "motel" },
            ];

        case "parking":
            return [
                { key: "amenity", value: "parking" },
            ];

        case "ev-charging":
            return [
                { key: "amenity", value: "charging_station" },
            ];

        case "car-rental":
            return [
                { key: "amenity", value: "car_rental" },
            ];

        default:
            return [];
    }
}

function buildOverpassQuery(profileId: string) {
    const selectors = getOsmSelectors(profileId);

    if (selectors.length === 0) {
        return "";
    }

    const statements: string[] = [];

    for (const selector of selectors) {
        const base =
            `["${selector.key}"="${selector.value}"]` +
            (
                selector.extraKey && selector.extraPattern
                    ? `["${selector.extraKey}"~"${selector.extraPattern}",i]`
                    : ""
            );

        // Keep only entities that already expose a website.
        // This lets them flow into the existing website/merchant analysis.
        statements.push(
            `nwr${base}["name"]["website"](area.tw);`
        );
        statements.push(
            `nwr${base}["name"]["contact:website"](area.tw);`
        );
        statements.push(
            `nwr${base}["name"]["brand:website"](area.tw);`
        );
    }

    return `
[out:json][timeout:20];
area["ISO3166-1"="TW"]["boundary"="administrative"]->.tw;
(
${statements.join("\n")}
);
out tags center;
`.trim();
}

async function callOverpass(
    endpoint: string,
    query: string
) {
    try {
        const body = new URLSearchParams({
            data: query,
        });

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded;charset=UTF-8",
                "User-Agent":
                    "PayLead-Finder/13 internal merchant discovery",
            },
            body: body.toString(),
            cache: "no-store",
            signal: AbortSignal.timeout(
                OVERPASS_TIMEOUT_MS
            ),
        });

        if (!response.ok) {
            return {
                elements: [] as any[],
                error: `Overpass HTTP ${response.status}`,
            };
        }

        const data: any = await response.json();

        return {
            elements: Array.isArray(data?.elements)
                ? data.elements
                : [],
            error: "",
        };
    } catch (error) {
        return {
            elements: [] as any[],
            error:
                error instanceof Error
                    ? error.message
                    : "Overpass request failed",
        };
    }
}

async function searchOpenStreetMap(
    keyword: string
): Promise<{
    results: SearchResult[];
    error?: string;
}> {
    const profile = getIndustryProfile(keyword);
    const query = buildOverpassQuery(profile.id);

    if (!query) {
        return {
            results: [],
        };
    }

    const cacheKey = `osm-v13::${profile.id}`;
    const cached = osmCache.get(cacheKey);

    if (
        cached &&
        cached.results.length > 0 &&
        Date.now() - cached.timestamp < OSM_CACHE_TTL
    ) {
        console.log(
            "🗺 OSM Cache：",
            profile.id,
            cached.results.length
        );

        return {
            results: cached.results,
        };
    }

    // Public Overpass servers are used sequentially, never concurrently.
    const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ];

    let lastError = "";

    for (const endpoint of endpoints) {
        const response = await callOverpass(
            endpoint,
            query
        );

        if (response.error) {
            lastError = response.error;
        }

        if (response.elements.length === 0) {
            continue;
        }

        const map = new Map<string, SearchResult>();

        for (const element of response.elements) {
            const tags =
                element?.tags &&
                typeof element.tags === "object"
                    ? element.tags
                    : {};

            const name = cleanSearchText(
                String(
                    tags.name ||
                    tags["name:zh"] ||
                    tags.brand ||
                    ""
                )
            );

            const website = normalizeExternalUrl(
                String(
                    tags.website ||
                    tags["contact:website"] ||
                    tags["brand:website"] ||
                    ""
                )
            );

            if (!name || !website) {
                continue;
            }

            if (shouldExcludeUrl(website)) {
                continue;
            }

            const structuredSignals = uniqueStrings([
                tags.shop
                    ? `shop=${String(tags.shop)}`
                    : "",
                tags.amenity
                    ? `amenity=${String(tags.amenity)}`
                    : "",
                tags.leisure
                    ? `leisure=${String(tags.leisure)}`
                    : "",
                tags.tourism
                    ? `tourism=${String(tags.tourism)}`
                    : "",
                tags.sport
                    ? `sport=${String(tags.sport)}`
                    : "",
                tags.operator
                    ? `operator=${String(tags.operator)}`
                    : "",
                tags.brand
                    ? `brand=${String(tags.brand)}`
                    : "",
            ]);

            const description = cleanSearchText(
                [
                    "OpenStreetMap Taiwan structured merchant",
                    ...structuredSignals,
                    tags["addr:city"] || "",
                    tags["addr:district"] || "",
                    tags["addr:street"] || "",
                ].join(" ")
            );

            const domainKey = getDomainKey(website);

            if (!domainKey) {
                continue;
            }

            if (!map.has(domainKey)) {
                map.set(domainKey, {
                    title: name,
                    url: website,
                    description,
                    query: `OSM:${profile.id}`,
                    source: "OpenStreetMap",
                    searchScore: 1,
                    structuredIndustry: true,
                    structuredSignals,
                });
            }
        }

        const results = Array.from(map.values())
            .slice(0, MAX_OSM_RESULTS);

        if (results.length > 0) {
            osmCache.set(cacheKey, {
                timestamp: Date.now(),
                results,
            });

            console.log(
                "🗺 OSM Structured：",
                profile.id,
                "→",
                results.length
            );

            return {
                results,
            };
        }
    }

    return {
        results: [],
        error: lastError || "OpenStreetMap 沒有可用 website 的結構化結果",
    };
}

// ============================================================
// Tavily Search
// ============================================================


type TavilyRawCall = {
    results: SearchResult[];
    credits: number;
    error?: string;
    requestId?: string;
};

async function callTavily(
    query: string,
    options: {
        countryBoost: boolean;
        useExcludeDomains: boolean;
        label: string;
    }
): Promise<TavilyRawCall> {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
        throw new Error("缺少 TAVILY_API_KEY");
    }

    try {
        const body: Record<string, any> = {
            query,
            topic: "general",
            search_depth: "basic",
            chunks_per_source: 1,
            max_results: MAX_TAVILY_RESULTS,
            include_answer: false,
            include_raw_content: false,
            include_images: false,
            include_usage: true,
        };

        if (options.countryBoost) {
            body.country = "taiwan";
        }

        if (options.useExcludeDomains) {
            body.exclude_domains = tavilyExcludedDomains;
        }

        const response = await fetch(
            "https://api.tavily.com/search",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(15000),
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            return {
                results: [],
                credits: 0,
                error:
                    `${options.label} HTTP ${response.status}: ` +
                    responseText.slice(0, 240),
            };
        }

        let data: any = {};

        try {
            data = JSON.parse(responseText);
        } catch {
            return {
                results: [],
                credits: 0,
                error:
                    `${options.label} 回傳非 JSON：` +
                    responseText.slice(0, 200),
            };
        }

        const items = Array.isArray(data?.results)
            ? data.results
            : [];

        const results: SearchResult[] = items
            .map((item: any) => ({
                title: cleanSearchText(
                    String(item?.title || "")
                ),
                url: normalizeUrl(
                    String(item?.url || "")
                ),
                description: cleanSearchText(
                    String(item?.content || "")
                ),
                query,
                source: "Tavily" as const,
                searchScore:
                    typeof item?.score === "number"
                        ? item.score
                        : 0,
            }))
            .filter(
                (item: SearchResult) =>
                    Boolean(item.title && item.url)
            );

        return {
            results,
            credits: Number(data?.usage?.credits ?? 1),
            requestId: String(data?.request_id || ""),
        };
    } catch (error) {
        return {
            results: [],
            credits: 0,
            error:
                error instanceof Error
                    ? `${options.label}: ${error.message}`
                    : `${options.label}: Tavily 搜尋失敗`,
        };
    }
}

async function searchTavily(
    query: string
): Promise<TavilySearchResponse> {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
        throw new Error("缺少 TAVILY_API_KEY");
    }

    // 版本化 cache key，避免舊版本留下的 0-result cache 污染。
    const cacheKey = `v13::${query.toLowerCase()}`;
    const cached = searchCache.get(cacheKey);

    if (
        cached &&
        cached.results.length > 0 &&
        Date.now() - cached.timestamp < SEARCH_CACHE_TTL
    ) {
        console.log(
            "🟢 Tavily Cache：",
            query,
            cached.results.length
        );

        return {
            results: cached.results,
            credits: 0,
        };
    }

    // 空快取一律刪除，不再讓 0 筆結果卡 10～30 分鐘。
    if (cached && cached.results.length === 0) {
        searchCache.delete(cacheKey);
    }

    const primary = await callTavily(query, {
        countryBoost: true,
        useExcludeDomains: true,
        label: "primary",
    });

    let credits = primary.credits;

    console.log(
        "🔎 Tavily Primary：",
        query,
        "→",
        primary.results.length,
        primary.requestId
            ? `request=${primary.requestId}`
            : ""
    );

    if (primary.results.length > 0) {
        searchCache.set(cacheKey, {
            timestamp: Date.now(),
            results: primary.results,
        });

        return {
            results: primary.results,
            credits,
        };
    }

    // HTTP 錯誤（例如額度、rate limit）不無腦重試。
    if (
        primary.error &&
        (
            primary.error.includes("HTTP 401") ||
            primary.error.includes("HTTP 429") ||
            primary.error.includes("HTTP 432") ||
            primary.error.includes("HTTP 433")
        )
    ) {
        return {
            results: [],
            credits,
            error: primary.error,
        };
    }

    // Tavily 偶爾在 country boost + 大量 exclude_domains 下回 0。
    // 第二次改成：不 country boost、不送 exclude_domains，
    // 讓本地 Taiwan / Domain / Industry Gate 接手。
    const fallbackQuery =
        query.toLowerCase().includes("台灣")
            ? query
            : `台灣 ${query}`;

    const fallback = await callTavily(fallbackQuery, {
        countryBoost: false,
        useExcludeDomains: false,
        label: "fallback",
    });

    credits += fallback.credits;

    console.log(
        "↪ Tavily Fallback：",
        fallbackQuery,
        "→",
        fallback.results.length,
        fallback.requestId
            ? `request=${fallback.requestId}`
            : ""
    );

    if (fallback.results.length > 0) {
        searchCache.set(cacheKey, {
            timestamp: Date.now(),
            results: fallback.results,
        });

        return {
            results: fallback.results,
            credits,
            error: primary.error,
        };
    }

    // 絕對不 cache 空陣列。
    return {
        results: [],
        credits,
        error:
            fallback.error ||
            primary.error ||
            "Tavily 兩種搜尋模式皆回傳 0 筆",
    };
}

// ============================================================
// Search-Level Industry Scoring / Filtering
// ============================================================

function calculateSearchIndustryScore(
    keyword: string,
    title: string,
    description: string
) {
    const profile = getIndustryProfile(keyword);
    const titleLower = title.toLowerCase();
    const combined = `${title} ${description}`.toLowerCase();
    let score = 0;

    if (titleLower.includes(keyword.toLowerCase())) {
        score += 30;
    } else if (combined.includes(keyword.toLowerCase())) {
        score += 16;
    }

    const strongTitle = findSignals(title, profile.strongSignals);
    const strongAll = findSignals(combined, profile.strongSignals);
    const aliasHits = findSignals(combined, profile.aliases);
    const signalHits = findSignals(combined, profile.signals);

    score += Math.min(42, strongTitle.length * 24);
    score += Math.min(32, strongAll.length * 15);
    score += Math.min(24, aliasHits.length * 7);
    score += Math.min(18, signalHits.length * 4);

    return clamp(Math.round(score));
}

function hasProfileSearchNegative(result: SearchResult, keyword: string) {
    const profile = getIndustryProfile(keyword);
    const negatives = profile.negativeSearchSignals || [];

    if (negatives.length === 0) {
        return false;
    }

    const searchText = `${result.title} ${result.description}`;
    const negativeHits = findSignals(searchText, negatives);

    if (negativeHits.length === 0) {
        return false;
    }

    // A title that explicitly says it is a department store / shopping mall
    // is allowed even when the snippet mentions travel, beauty, etc.
    const strongTitleHits = findSignals(result.title, profile.strongSignals);
    const strongSearchHits = findSignals(searchText, profile.strongSignals);

    return strongTitleHits.length === 0 && strongSearchHits.length === 0;
}


function hasCrossIndustrySearchNoise(
    result: SearchResult,
    keyword: string
) {
    const target = keyword.toLowerCase().trim();
    const searchText = `${result.title} ${result.description}`;
    const profile = getIndustryProfile(keyword);

    const targetStrongTitle = findSignals(
        result.title,
        profile.strongSignals
    );

    const targetEvidence = uniqueStrings([
        ...findSignals(searchText, profile.strongSignals),
        ...findSignals(searchText, profile.aliases),
    ]);

    for (const group of crossIndustrySearchGroups) {
        const targetBelongsToGroup = group.targetKeys.some((key) => {
            const normalized = key.toLowerCase();
            return (
                target.includes(normalized) ||
                normalized.includes(target)
            );
        });

        if (targetBelongsToGroup) {
            continue;
        }

        const hits = findSignals(searchText, group.signals);

        if (hits.length === 0) {
            continue;
        }

        // If the title itself strongly identifies the requested industry,
        // do not reject it merely because its snippet mentions another one.
        if (targetStrongTitle.length > 0) {
            continue;
        }

        // Strong cross-industry evidence with little requested-industry evidence.
        if (
            hits.length >= 2 &&
            targetEvidence.length < 2
        ) {
            return true;
        }

        // These categories are usually unambiguous even with one strong signal.
        if (
            ["media", "jobs", "travel", "content-directory"].includes(group.id) &&
            hits.length >= 1 &&
            targetEvidence.length === 0
        ) {
            return true;
        }
    }

    return false;
}

function getCompetingIndustryScore(
    keyword: string,
    title: string,
    description: string
) {
    const targetProfile = getIndustryProfile(keyword);
    const searchText = `${title} ${description}`;

    let best = {
        id: "",
        score: 0,
        signals: [] as string[],
    };

    for (const profile of industryProfiles) {
        if (profile.id === targetProfile.id) {
            continue;
        }

        const strongTitle = findSignals(
            title,
            profile.strongSignals
        );

        const strongAll = findSignals(
            searchText,
            profile.strongSignals
        );

        const aliases = findSignals(
            searchText,
            profile.aliases
        );

        const signals = findSignals(
            searchText,
            profile.signals
        );

        let score = 0;
        score += Math.min(54, strongTitle.length * 30);
        score += Math.min(36, strongAll.length * 18);
        score += Math.min(24, aliases.length * 8);
        score += Math.min(18, signals.length * 4);
        score = clamp(Math.round(score));

        if (score > best.score) {
            best = {
                id: profile.id,
                score,
                signals: uniqueStrings([
                    ...strongTitle,
                    ...strongAll,
                    ...aliases,
                    ...signals,
                ]).slice(0, 12),
            };
        }
    }

    return best;
}

function calculateRelevance(keyword: string, result: SearchResult) {
    if (result.structuredIndustry) {
        return 92;
    }

    const industryScore = calculateSearchIndustryScore(
        keyword,
        result.title,
        result.description
    );

    const tavilyScore = Math.min(28, result.searchScore * 28);

    return clamp(
        Math.round(industryScore * 0.78 + tavilyScore)
    );
}


function shouldKeepSearchResult(
    result: SearchResult,
    keyword: string
) {
    if (shouldExcludeUrl(result.url)) {
        return false;
    }

    // OSM category tags are structured evidence, not an article/snippet match.
    if (result.structuredIndustry) {
        return true;
    }

    const text =
        `${result.title} ${result.description}`
            .toLowerCase();

    if (
        excludedTitleSignals.some((signal) =>
            text.includes(signal.toLowerCase())
        )
    ) {
        return false;
    }

    if (
        platformNoise.some((signal) =>
            text.includes(signal.toLowerCase())
        )
    ) {
        return false;
    }

    if (hasCrossIndustrySearchNoise(result, keyword)) {
        return false;
    }

    if (hasProfileSearchNegative(result, keyword)) {
        return false;
    }

    const profile = getIndustryProfile(keyword);
    const industryScore =
        calculateSearchIndustryScore(
            keyword,
            result.title,
            result.description
        );

    const competing =
        getCompetingIndustryScore(
            keyword,
            result.title,
            result.description
        );

    // 明顯是另一個已知產業，而且目標證據很弱。
    if (
        competing.score >= 52 &&
        industryScore < 26
    ) {
        return false;
    }

    // 百貨先高召回，真正「是不是百貨營運方」
    // 留到官網 Operator Gate 做，避免 Search Filter 先砍掉真商戶。
    if (profile.id === "department-store") {
        return (
            industryScore >= 6 ||
            result.searchScore >= 0.42
        );
    }

    return (
        industryScore >= 6 ||
        result.searchScore >= 0.46
    );
}

// ============================================================
// Candidate Builder
// ============================================================

function buildCandidates(results: SearchResult[], keyword: string) {
    const map = new Map<string, Candidate>();

    for (const result of results) {
        if (!shouldKeepSearchResult(result, keyword)) {
            continue;
        }

        const domainKey = getDomainKey(result.url);

        if (!domainKey) {
            continue;
        }

        const relevanceScore = calculateRelevance(keyword, result);
        const existing = map.get(domainKey);

        if (!existing) {
            map.set(domainKey, {
                ...result,
                domainKey,
                relevanceScore,
                appearanceCount: 1,
                sourceUrls: [result.url],
                structuredIndustry:
                    Boolean(result.structuredIndustry),
                structuredSignals:
                    result.structuredSignals || [],
            });
            continue;
        }

        existing.appearanceCount += 1;

        if (!existing.sourceUrls.includes(result.url)) {
            existing.sourceUrls.push(result.url);
        }

        if (result.structuredIndustry) {
            existing.structuredIndustry = true;
            existing.structuredSignals = uniqueStrings([
                ...(existing.structuredSignals || []),
                ...(result.structuredSignals || []),
            ]);
        }

        if (relevanceScore > existing.relevanceScore) {
            existing.title = result.title;
            existing.description = result.description;
            existing.url = result.url;
            existing.query = result.query;
            existing.relevanceScore = relevanceScore;
            existing.searchScore = Math.max(
                existing.searchScore,
                result.searchScore
            );
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        const scoreA =
            a.relevanceScore +
            Math.min(16, a.appearanceCount * 4) +
            a.searchScore * 10;

        const scoreB =
            b.relevanceScore +
            Math.min(16, b.appearanceCount * 4) +
            b.searchScore * 10;

        return scoreB - scoreA;
    });
}

// ============================================================
// Website Fetch
// ============================================================

const browserHeaders = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
};

async function fetchWebsite(url: string) {
    const cached = pageCache.get(url);

    if (cached && Date.now() - cached.timestamp < PAGE_CACHE_TTL) {
        return cached.html;
    }

    try {
        const response = await fetch(url, {
            headers: browserHeaders,
            redirect: "follow",
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            return "";
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("text/html")) {
            return "";
        }

        const html = (await response.text()).slice(0, 1_500_000);

        pageCache.set(url, {
            timestamp: Date.now(),
            html,
        });

        return html;
    } catch {
        return "";
    }
}

// ============================================================
// Taiwan Qualification
// ============================================================

function analyzeTaiwan(url: string, searchText: string, websiteText: string) {
    const host = getHostname(url);
    const combined = `${searchText} ${websiteText}`.toLowerCase();
    const evidence: string[] = [];
    let score = 0;

    const isTwDomain = host.endsWith(".tw");
    const foreign = isForeignTld(url);

    if (isTwDomain) {
        score += 50;
        evidence.push(".tw domain");
    }

    if (foreign) {
        score -= 70;
        evidence.push("foreign TLD");
    }

    const taiwanHits = findSignals(combined, taiwanSignals);

    if (taiwanHits.length > 0) {
        score += Math.min(36, taiwanHits.length * 8);
        evidence.push(...taiwanHits.slice(0, 5));
    }

    if (combined.includes("統一編號")) {
        score += 20;
        evidence.push("統一編號");
    }

    const taiwanPhoneSignals = [
        "+886",
        "02-",
        "03-",
        "04-",
        "05-",
        "06-",
        "07-",
        "08-",
        "(02)",
        "(03)",
        "(04)",
        "(05)",
        "(06)",
        "(07)",
        "(08)",
    ];

    if (
        taiwanPhoneSignals.some((signal) => combined.includes(signal))
    ) {
        score += 14;
        evidence.push("台灣電話");
    }

    score = clamp(score);

    return {
        score,
        evidence: uniqueStrings(evidence),
        passes: !foreign && (isTwDomain || score >= 18),
    };
}

// ============================================================
// Industry Qualification
// ============================================================



const departmentStoreCoreOperatorSignals = [
    "樓層導覽",
    "樓層指南",
    "樓層介紹",
    "樓層資訊",
    "樓層平面圖",
    "品牌導覽",
    "品牌樓層",
    "店櫃導覽",
    "櫃位查詢",
    "館別介紹",
    "館內服務",
    "顧客服務",
    "服務台",
    "停車優惠",
    "會員卡",
    "聯名卡",
    "週年慶",
];

function departmentStoreEntityGate(
    titleText: string,
    websiteText: string,
    structuredIndustry: boolean
) {
    if (structuredIndustry) {
        return {
            passes: true,
            titleSignals: ["OSM structured mall/department_store"],
            operatorSignals: [] as string[],
        };
    }

    const titleIdentitySignals = [
        "百貨",
        "百貨公司",
        "購物中心",
        "購物廣場",
        "時尚廣場",
        "shopping mall",
        "shopping park",
        "department store",
        "outlet mall",
        "outlet",
        "mall",
        "plaza",
    ];

    const titleSignals = findSignals(
        titleText,
        titleIdentitySignals
    );

    const operatorSignals = findSignals(
        websiteText,
        departmentStoreCoreOperatorSignals
    );

    const websiteIdentity = findSignals(
        websiteText,
        [
            "百貨公司",
            "購物中心",
            "shopping mall",
            "department store",
            "outlet mall",
            "購物廣場",
            "時尚廣場",
        ]
    );

    // Either the entity identifies itself in its title,
    // or its homepage has a real mall operator structure.
    const passes =
        titleSignals.length >= 1 ||
        (
            websiteIdentity.length >= 1 &&
            operatorSignals.length >= 3
        ) ||
        operatorSignals.length >= 5;

    return {
        passes,
        titleSignals,
        operatorSignals,
    };
}

function analyzeDepartmentStoreIndustry(
    keyword: string,
    titleText: string,
    searchText: string,
    websiteText: string
): IndustryAnalysis {
    const profile = getIndustryProfile(keyword);

    const searchIndustryScore =
        calculateSearchIndustryScore(
            keyword,
            titleText,
            searchText
        );

    const strongTitle =
        findSignals(
            titleText,
            profile.strongSignals
        );

    const strongSearch =
        findSignals(
            searchText,
            profile.strongSignals
        );

    const strongWebsite =
        findSignals(
            websiteText,
            profile.strongSignals
        );

    const aliasWebsite =
        findSignals(
            websiteText,
            profile.aliases
        );

    const websiteSignals =
        findSignals(
            websiteText,
            profile.signals
        );

    const operatorSignals =
        findSignals(
            websiteText,
            profile.operatorSignals || []
        );

    const negativeSearchSignals =
        findSignals(
            `${titleText} ${searchText}`,
            profile.negativeSearchSignals || []
        );

    let score =
        searchIndustryScore * 0.34;

    score +=
        Math.min(
            40,
            strongTitle.length * 30
        );

    score +=
        Math.min(
            28,
            strongWebsite.length * 14
        );

    score +=
        Math.min(
            34,
            operatorSignals.length * 7
        );

    score +=
        Math.min(
            16,
            aliasWebsite.length * 4
        );

    score +=
        Math.min(
            10,
            websiteSignals.length * 2
        );

    if (
        negativeSearchSignals.length > 0 &&
        strongTitle.length === 0
    ) {
        score -=
            Math.min(
                50,
                negativeSearchSignals.length * 22
            );
    }

    score = clamp(
        Math.round(score)
    );

    // Search snippets often mention malls even when the site itself is a tenant,
    // media article, directory, research site, etc. The actual entity must
    // identify as a mall/department-store operator or expose operator structure.
    const entityGate = departmentStoreEntityGate(
        titleText,
        websiteText,
        false
    );

    const profileGatePassed =
        entityGate.passes &&
        negativeSearchSignals.length === 0;

    const tier: "A" | "B" | "C" | "D" =
        score >= 64
            ? "A"
            : score >= 42
                ? "B"
                : score >= 22
                    ? "C"
                    : "D";

    return {
        score,
        tier,
        passes:
            profileGatePassed &&
            tier !== "D",
        profileGatePassed,
        searchIndustryScore,
        strongSignals:
            uniqueStrings([
                ...strongTitle,
                ...strongSearch,
                ...strongWebsite,
            ]).slice(0, 12),
        aliases:
            aliasWebsite.slice(0, 12),
        signals:
            websiteSignals.slice(0, 15),
        operatorSignals:
            uniqueStrings([
                ...operatorSignals,
                ...entityGate.operatorSignals,
            ]).slice(0, 15),
        negativeSearchSignals:
            negativeSearchSignals.slice(0, 10),
    };
}

function analyzeIndustry(
    keyword: string,
    titleText: string,
    searchText: string,
    websiteText: string
): IndustryAnalysis {
    const profile = getIndustryProfile(keyword);

    if (profile.id === "department-store") {
        return analyzeDepartmentStoreIndustry(
            keyword,
            titleText,
            searchText,
            websiteText
        );
    }

    const searchIndustryScore = calculateSearchIndustryScore(
        keyword,
        searchText,
        ""
    );

    const websiteStrongSignals = findSignals(
        websiteText,
        profile.strongSignals
    );
    const websiteAliases = findSignals(websiteText, profile.aliases);
    const websiteSignals = findSignals(websiteText, profile.signals);
    const operatorSignals = findSignals(
        websiteText,
        profile.operatorSignals || []
    );
    const negativeSearchSignals = findSignals(
        searchText,
        profile.negativeSearchSignals || []
    );

    let score = searchIndustryScore * 0.44;
    score += Math.min(36, websiteStrongSignals.length * 18);
    score += Math.min(26, websiteAliases.length * 8);
    score += Math.min(24, websiteSignals.length * 5);

    if (
        websiteText.toLowerCase().includes(keyword.toLowerCase())
    ) {
        score += 8;
    }

    score -= Math.min(30, negativeSearchSignals.length * 15);
    score = clamp(Math.round(score));

    const tier: "A" | "B" | "C" | "D" =
        score >= 60
            ? "A"
            : score >= 38
                ? "B"
                : score >= 18
                    ? "C"
                    : "D";

    const searchEvidence = searchIndustryScore >= 18;
    const websiteEvidence =
        websiteStrongSignals.length >= 1 ||
        websiteAliases.length >= 1 ||
        websiteSignals.length >= 2;

    const profileGatePassed =
        negativeSearchSignals.length === 0 &&
        (searchEvidence || websiteEvidence);

    return {
        score,
        tier,
        passes: profileGatePassed && tier !== "D",
        profileGatePassed,
        searchIndustryScore,
        strongSignals: websiteStrongSignals.slice(0, 10),
        aliases: websiteAliases.slice(0, 12),
        signals: websiteSignals.slice(0, 15),
        operatorSignals: operatorSignals.slice(0, 12),
        negativeSearchSignals: negativeSearchSignals.slice(0, 10),
    };
}

// ============================================================
// Merchant Qualification
// ============================================================

function analyzeMerchant(text: string) {
    const merchantFound = findSignals(text, merchantSignals);
    const strongFound = findSignals(text, strongMerchantSignals);
    const paymentFound = findSignals(text, paymentSignals);
    const physicalFound = findSignals(text, physicalSignals);
    const institutionalFound = findSignals(text, institutionalSignals);
    const contentFound = findSignals(text, contentSignals);

    const merchantScore = clamp(
        merchantFound.length * 5 + strongFound.length * 10
    );
    const paymentScore = clamp(paymentFound.length * 7);
    const physicalScore = clamp(physicalFound.length * 8);

    const hasPhysicalStore = physicalFound.length >= 1;
    const hasPaymentNeed = paymentFound.length >= 1;

    const isMerchant =
        strongFound.length >= 1 ||
        merchantFound.length >= 2 ||
        physicalFound.length >= 1 ||
        paymentFound.length >= 1;

    const isInstitutional =
        institutionalFound.length >= 2 &&
        strongFound.length === 0 &&
        paymentFound.length === 0 &&
        physicalFound.length === 0;

    const isContentSite =
        contentFound.length >= 8 &&
        strongFound.length === 0 &&
        paymentFound.length === 0 &&
        physicalFound.length === 0;

    let leadBase =
        merchantScore * 0.35 +
        paymentScore * 0.35 +
        physicalScore * 0.30;

    leadBase -= institutionalFound.length * 4;
    leadBase -= contentFound.length * 1.2;

    return {
        merchantScore,
        paymentScore,
        physicalScore,
        leadBase: clamp(Math.round(leadBase)),
        merchantSignals: merchantFound.slice(0, 15),
        strongMerchantSignals: strongFound.slice(0, 10),
        paymentSignals: paymentFound.slice(0, 15),
        physicalSignals: physicalFound.slice(0, 15),
        institutionalSignals: institutionalFound.slice(0, 10),
        contentSignals: contentFound.slice(0, 10),
        hasPhysicalStore,
        hasPaymentNeed,
        isMerchant,
        isInstitutional,
        isContentSite,
    };
}

// ============================================================
// Platform Detection
// ============================================================

function detectPlatform(html: string): PlatformResult {
    const lower = html.toLowerCase();

    const ranked = fingerprints
        .map((item) => {
            const evidence = item.keywords.filter((keyword) =>
                lower.includes(keyword.toLowerCase())
            );

            return {
                platform: item.name,
                evidence,
                score: evidence.length,
            };
        })
        .sort((a, b) => b.score - a.score);

    const best = ranked[0];

    if (!best || best.score === 0) {
        return {
            platform: "Unknown",
            evidence: [],
        };
    }

    return {
        platform: best.platform,
        evidence: best.evidence,
    };
}

// ============================================================
// Brand Detection
// ============================================================

function detectBrand(html: string, fallbackTitle: string, url: string) {
    const ogPatterns = [
        /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
    ];

    for (const pattern of ogPatterns) {
        const match = html.match(pattern);

        if (match?.[1]) {
            return cleanSearchText(match[1]);
        }
    }

    const titleMatch = html.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
    );

    if (titleMatch?.[1]) {
        const title = cleanSearchText(titleMatch[1])
            .replace(/\s*[|｜]\s*.*$/, "")
            .trim();

        if (title) {
            return title;
        }
    }

    if (fallbackTitle) {
        return cleanSearchText(fallbackTitle)
            .replace(/\s*[|｜]\s*.*$/, "")
            .trim();
    }

    return getHostname(url).split(".")[0] || "未知品牌";
}

// ============================================================
// Recommendation
// ============================================================

function getRecommendation(
    paymentScore: number,
    hasPhysicalStore: boolean,
    platform: string,
    profileId: string
) {
    const cooperative = cooperationPlatforms.includes(platform);

    if (cooperative && paymentScore >= 28 && hasPhysicalStore) {
        return "已辨識為可合作開店平台，且同時具有線上交易與實體據點訊號，建議優先評估 EC / APP＋POS。";
    }

    if (cooperative) {
        return "已辨識為可合作開店平台，建議優先確認目前金流狀況與全支付導入機會。";
    }

    if (profileId === "department-store" && hasPhysicalStore) {
        return "屬百貨／購物中心營運場域，建議優先確認 POS、會員支付、停車與館內支付合作機會。";
    }

    if (paymentScore >= 28 && hasPhysicalStore) {
        return "同時具有線上交易與實體據點訊號，建議評估 EC / APP 與 POS 合作。";
    }

    if (paymentScore >= 14) {
        return "具有線上交易、會員、預約或付款訊號，可進一步評估 EC / APP 金流合作。";
    }

    if (hasPhysicalStore) {
        return "具有實體門市／據點，可進一步確認 POS、QR 或門市支付需求。";
    }

    return "產業與商戶條件符合，可進一步人工確認交易流程與支付合作機會。";
}

// ============================================================
// Candidate Analysis
// ============================================================

async function analyzeCandidate(candidate: Candidate, keyword: string) {
    const profile = getIndustryProfile(keyword);
    const searchText = `${candidate.title} ${candidate.description}`;
    const candidateOrigin = getOrigin(candidate.url);

    const sourcePage = candidate.sourceUrls.find((url) => {
        try {
            return new URL(url).pathname !== "/";
        } catch {
            return false;
        }
    });

    const urlsToFetch = uniqueStrings([
        candidateOrigin,
        sourcePage || candidate.url,
    ]).slice(0, 2);

    const pages = await Promise.all(
        urlsToFetch.map(async (url) => ({
            url,
            html: await fetchWebsite(url),
        }))
    );

    const validPages = pages.filter((page) => page.html);
    const combinedHtml = validPages.map((page) => page.html).join("\n");
    const websiteText = cleanHtml(combinedHtml);

    // If a site blocks Vercel, Tavily title/snippet is still usable evidence.
    const analysisText = `${searchText} ${websiteText}`.trim();

    const taiwan = analyzeTaiwan(
        candidate.url,
        searchText,
        websiteText
    );

    if (candidate.structuredIndustry) {
        taiwan.passes = true;
        taiwan.score = Math.max(taiwan.score, 76);
        taiwan.evidence = uniqueStrings([
            ...taiwan.evidence,
            "OpenStreetMap Taiwan POI",
        ]);
    }

    if (!taiwan.passes) {
        return null;
    }

    const siteRole = getNonMerchantSiteRole(
        keyword,
        candidate.title,
        candidate.description,
        websiteText
    );

    if (
        siteRole.reject &&
        !candidate.structuredIndustry
    ) {
        return null;
    }

    const industry = analyzeIndustry(
        keyword,
        candidate.title,
        searchText,
        websiteText
    );

    if (candidate.structuredIndustry) {
        industry.passes = true;
        industry.profileGatePassed = true;
        industry.score = Math.max(industry.score, 74);
        industry.tier =
            industry.score >= 60 ? "A" : "B";
        industry.strongSignals = uniqueStrings([
            ...industry.strongSignals,
            ...(candidate.structuredSignals || []),
        ]).slice(0, 12);
    }

    // Department-store is especially vulnerable to tenant brands and articles.
    if (
        profile.id === "department-store" &&
        !candidate.structuredIndustry
    ) {
        const entityGate = departmentStoreEntityGate(
            candidate.title,
            websiteText,
            false
        );

        if (!entityGate.passes) {
            return null;
        }
    }

    if (!industry.passes) {
        return null;
    }

    // 全產業通用 precision：
    // 如果搜尋標題/摘要明顯屬另一個已知產業，而目標產業分數偏低，
    // 就不要只因為網站有付款、會員、門市而誤收。
    const competingIndustry =
        getCompetingIndustryScore(
            keyword,
            candidate.title,
            `${candidate.description} ${websiteText.slice(0, 18000)}`
        );

    if (
        !candidate.structuredIndustry &&
        competingIndustry.score >= 58 &&
        (
            industry.score < 48 ||
            getStrongTargetTitleSignals(
                keyword,
                candidate.title
            ).length === 0
        )
    ) {
        return null;
    }

    const merchant = analyzeMerchant(analysisText);

    if (merchant.isInstitutional || merchant.isContentSite) {
        return null;
    }

    // Department stores / malls are merchants by business model even when
    // their homepage has no cart or explicit payment wording.
    const merchantQualified =
        candidate.structuredIndustry
            ? true
            : profile.id === "department-store"
                ? industry.profileGatePassed
                : merchant.isMerchant ||
                  industry.score >= 48 ||
                  (
                      industry.score >= 34 &&
                      candidate.appearanceCount >= 2
                  );

    if (!merchantQualified) {
        return null;
    }

    const platform = detectPlatform(combinedHtml);
    const brand = detectBrand(
        combinedHtml,
        candidate.title,
        candidate.url
    );

    let leadScore = merchant.leadBase;
    leadScore += industry.score * 0.23;
    leadScore += candidate.relevanceScore * 0.10;
    leadScore += taiwan.score * 0.08;
    leadScore += Math.min(8, candidate.appearanceCount * 2);
    leadScore += Math.min(5, candidate.searchScore * 5);

    if (cooperationPlatforms.includes(platform.platform)) {
        leadScore += 14;
    }

    if (merchant.hasPhysicalStore) {
        leadScore += 5;
    }

    if (merchant.hasPaymentNeed) {
        leadScore += 3;
    }

    if (candidate.structuredIndustry) {
        leadScore += 8;
    }

    if (profile.id === "department-store") {
        leadScore += Math.min(10, industry.operatorSignals.length * 2);
    }

    if (validPages.length === 0) {
        leadScore -= 4;
    }

    leadScore = clamp(Math.round(leadScore));

    const minimumLeadScore =
        profile.id === "department-store" ? 14 : 16;

    if (leadScore < minimumLeadScore) {
        return null;
    }

    const cooperation = cooperationPlatforms.includes(platform.platform)
        ? "可合作"
        : "暫不可合作";

    return {
        success: true,
        title: candidate.title,
        brand,
        url: candidateOrigin || candidate.url,
        description: candidate.description,

        discoverySource: candidate.structuredIndustry
            ? "OpenStreetMap + Web"
            : candidate.source,
        structuredIndustry:
            Boolean(candidate.structuredIndustry),
        structuredSignals:
            candidate.structuredSignals || [],
        siteRole: siteRole.id || "merchant",
        siteRoleSignals: siteRole.signals,

        platform: platform.platform,
        cooperation,
        evidence: platform.evidence,

        recommendation: getRecommendation(
            merchant.paymentScore,
            merchant.hasPhysicalStore,
            platform.platform,
            profile.id
        ),

        physicalStore: {
            hasPhysicalStore: merchant.hasPhysicalStore,
            signals: merchant.physicalSignals,
        },

        merchantScore: merchant.merchantScore,
        paymentScore: merchant.paymentScore,
        physicalScore: merchant.physicalScore,
        relevanceScore: candidate.relevanceScore,
        appearanceCount: candidate.appearanceCount,
        tavilyScore: candidate.searchScore,
        taiwanScore: taiwan.score,
        industryScore: industry.score,
        industryTier: industry.tier,
        leadScore,

        taiwanEvidence: taiwan.evidence,
        industrySignals: uniqueStrings([
            ...industry.strongSignals,
            ...industry.aliases,
            ...industry.signals,
            ...industry.operatorSignals,
        ]).slice(0, 18),
        strongIndustrySignals: industry.strongSignals,
        operatorSignals: industry.operatorSignals,
        negativeIndustrySignals: industry.negativeSearchSignals,
        merchantSignals: merchant.merchantSignals,
        strongMerchantSignals: merchant.strongMerchantSignals,
        paymentSignals: merchant.paymentSignals,
        contentSignals: merchant.contentSignals,
        institutionalSignals: merchant.institutionalSignals,
        hasPaymentNeed: merchant.hasPaymentNeed,
        analyzedPages: urlsToFetch,
        websiteFetchSuccess: validPages.length > 0,
    };
}

// ============================================================
// POST
// ============================================================

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const keyword = String(body?.keyword || "").trim();

        if (!keyword) {
            return NextResponse.json(
                {
                    success: false,
                    error: "請輸入搜尋關鍵字",
                    results: [],
                },
                {
                    status: 400,
                }
            );
        }

        const profile = getIndustryProfile(keyword);
        const queries = getSearchQueries(keyword);

        const targetCandidates = profile.broad
            ? TARGET_CANDIDATES_BROAD
            : TARGET_CANDIDATES_DEFAULT;

        const minQueriesBeforeStop = profile.broad
            ? MIN_QUERIES_BEFORE_STOP_BROAD
            : MIN_QUERIES_BEFORE_STOP_DEFAULT;

        console.log("====================================");
        console.log("PayLead Finder v13");
        console.log("搜尋產業：", keyword);
        console.log("Industry Profile：", profile.id);
        console.log("搜尋來源：Tavily + OpenStreetMap");
        console.log("OpenAI：已移除");
        console.log("Query 數上限：", queries.length);
        console.log("Target Candidates：", targetCandidates);

        const rawResults: SearchResult[] = [];
        const searchWarnings: string[] = [];
        let creditsUsed = 0;
        let queryCount = 0;

        // Structured physical-merchant discovery runs once per search/category.
        // The result is cached for 6 hours and does not consume Tavily credits.
        const osmPromise = searchOpenStreetMap(keyword);

        for (let i = 0; i < queries.length; i += SEARCH_BATCH_SIZE) {
            const queryBatch = queries.slice(i, i + SEARCH_BATCH_SIZE);

            const responses = await Promise.all(
                queryBatch.map((query) => searchTavily(query))
            );

            queryCount += queryBatch.length;

            responses.forEach((response, index) => {
                rawResults.push(...response.results);
                creditsUsed += response.credits;

                if (response.error) {
                    searchWarnings.push(
                        `${queryBatch[index]} → ${response.error}`
                    );
                }
            });

            const currentCandidates = buildCandidates(
                rawResults,
                keyword
            );

            console.log(
                `Search ${queryCount}/${queries.length}`,
                "Raw：",
                rawResults.length,
                "Unique：",
                currentCandidates.length
            );

            if (
                queryCount >= minQueriesBeforeStop &&
                currentCandidates.length >= targetCandidates
            ) {
                console.log(
                    `✅ 候選已達 ${targetCandidates}，停止額外搜尋`
                );
                break;
            }
        }

        const osmResponse = await osmPromise;

        if (osmResponse.results.length > 0) {
            rawResults.push(...osmResponse.results);
            console.log(
                "OSM Results：",
                osmResponse.results.length
            );
        }

        if (osmResponse.error) {
            searchWarnings.push(
                `OpenStreetMap → ${osmResponse.error}`
            );
        }

        if (searchWarnings.length > 0) {
            console.log(
                "Search Warnings：",
                searchWarnings.slice(0, 8)
            );
        }

        if (rawResults.length === 0) {
            throw new Error(
                searchWarnings[0] ||
                "Tavily + OpenStreetMap 都沒有回傳搜尋結果"
            );
        }

        const candidates = buildCandidates(
            rawResults,
            keyword
        ).slice(0, MAX_CANDIDATES_TO_ANALYZE);

        console.log("Raw Results：", rawResults.length);
        console.log("Candidate Domains：", candidates.length);

        const analyzedResults: any[] = [];

        for (
            let i = 0;
            i < candidates.length;
            i += ANALYZE_BATCH_SIZE
        ) {
            const batch = candidates.slice(
                i,
                i + ANALYZE_BATCH_SIZE
            );

            const analyzed = await Promise.all(
                batch.map((candidate) =>
                    analyzeCandidate(candidate, keyword)
                )
            );

            analyzedResults.push(...analyzed.filter(Boolean));

            console.log(
                `Analyze ${Math.min(
                    i + ANALYZE_BATCH_SIZE,
                    candidates.length
                )}/${candidates.length}`,
                "有效商戶：",
                analyzedResults.length
            );

            if (analyzedResults.length >= MAX_ANALYZED_RESULTS) {
                break;
            }
        }

        analyzedResults.sort((a, b) => {
            const cooperationA = a.cooperation === "可合作" ? 1 : 0;
            const cooperationB = b.cooperation === "可合作" ? 1 : 0;

            if (cooperationA !== cooperationB) {
                return cooperationB - cooperationA;
            }

            if (b.leadScore !== a.leadScore) {
                return b.leadScore - a.leadScore;
            }

            if (b.industryScore !== a.industryScore) {
                return b.industryScore - a.industryScore;
            }

            if (b.appearanceCount !== a.appearanceCount) {
                return b.appearanceCount - a.appearanceCount;
            }

            return b.relevanceScore - a.relevanceScore;
        });

        const finalResults = analyzedResults.slice(
            0,
            FINAL_RESULT_LIMIT
        );

        console.log("最終結果：", finalResults.length);
        console.log("Tavily Credits：", creditsUsed);
        console.log("OSM Structured：", osmResponse.results.length);
        console.log("Warnings：", searchWarnings.length);
        console.log("====================================");

        return NextResponse.json({
            success: true,
            keyword,
            version: "v13",
            searchEngine: "Tavily + OpenStreetMap",
            searchDepth: "basic",
            searchMode: "taiwan-structured-merchant-discovery",
            aiQuery: false,
            openAI: false,

            industryProfile: profile.id,
            queryCount,
            searchedQueries: queries.slice(0, queryCount),
            creditsUsed,
            osmCount: osmResponse.results.length,
            targetCandidates,
            searchWarnings,

            rawCount: rawResults.length,
            filteredCount: candidates.length,
            candidateCount: candidates.length,
            analyzedCount: analyzedResults.length,
            count: finalResults.length,
            results: finalResults,
        });
    } catch (error) {
        console.error("Search API Error：", error);

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "搜尋發生錯誤",
                results: [],
            },
            {
                status: 500,
            }
        );
    }
}
