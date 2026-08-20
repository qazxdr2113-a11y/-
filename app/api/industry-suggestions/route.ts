import { NextResponse } from "next/server";

// ============================================================
// PayLead Finder - Industry Suggestions v2
//
// 一般商戶專用產業建議
// - 不使用 OpenAI
// - 不使用 Tavily
// - 不需要 API Key
// - 公益 / 非營利組織已獨立到 CharityDevelopment，不在此出現
// - 每次從不同產業群組抽樣，避免 8 筆都集中在相似產業
// ============================================================

type IndustryGroup = {
    id: string;
    items: string[];
};

const industryGroups: IndustryGroup[] = [
    {
        id: "energy-mobility",
        items: [
            "電動車充電",
            "充電樁",
            "充電站",
            "電動車租賃",
            "共享機車",
            "共享汽車",
            "汽車租賃",
            "停車場",
            "停車服務",
            "能源服務",
            "太陽能",
            "再生能源",
        ],
    },
    {
        id: "food-beverage",
        items: [
            "餐廳",
            "咖啡廳",
            "早午餐",
            "手搖飲",
            "飲料店",
            "火鍋店",
            "燒肉店",
            "居酒屋",
            "中央廚房",
            "烘焙",
            "甜點店",
            "蛋糕店",
            "麵包店",
            "食品",
            "食品電商",
            "生鮮",
            "農產品",
            "農產電商",
        ],
    },
    {
        id: "retail-ecommerce",
        items: [
            "服飾",
            "鞋店",
            "精品",
            "珠寶",
            "眼鏡",
            "美妝",
            "保養品",
            "香氛",
            "家居",
            "家具",
            "家電",
            "3C",
            "手機配件",
            "電腦周邊",
            "運動用品",
            "戶外用品",
            "生活用品",
            "百貨",
            "購物中心",
            "零售",
            "電商",
            "品牌電商",
            "團購",
            "訂閱制電商",
        ],
    },
    {
        id: "pet",
        items: [
            "寵物用品",
            "寵物美容",
            "寵物醫院",
            "寵物旅館",
            "寵物寄宿",
            "寵物訓練",
            "寵物食品",
        ],
    },
    {
        id: "beauty-personal",
        items: [
            "美容美髮",
            "美髮沙龍",
            "美容院",
            "美甲",
            "美睫",
            "按摩",
            "SPA",
            "芳療",
            "紋繡",
            "皮膚管理",
        ],
    },
    {
        id: "fitness-sports",
        items: [
            "健身房",
            "健身工作室",
            "瑜珈",
            "皮拉提斯",
            "拳擊館",
            "舞蹈教室",
            "運動中心",
            "高爾夫",
            "球館",
            "運動場館",
        ],
    },
    {
        id: "medical-health",
        items: [
            "診所",
            "醫美診所",
            "牙醫診所",
            "眼科診所",
            "皮膚科診所",
            "復健診所",
            "中醫診所",
            "健康管理",
            "健檢中心",
            "藥局",
            "醫療服務",
            "照護服務",
            "長照",
        ],
    },
    {
        id: "education",
        items: [
            "補習班",
            "線上課程",
            "教育平台",
            "語言學校",
            "英文補習班",
            "兒童教育",
            "才藝教室",
            "音樂教室",
            "藝術教室",
            "程式教育",
            "職業培訓",
            "證照課程",
        ],
    },
    {
        id: "travel-hospitality",
        items: [
            "旅遊",
            "旅遊票券",
            "旅行社",
            "飯店",
            "民宿",
            "旅館",
            "住宿",
            "露營",
            "露營區",
            "景點",
            "觀光",
            "遊樂園",
            "觀光工廠",
            "活動票券",
            "展覽",
        ],
    },
    {
        id: "entertainment",
        items: [
            "KTV",
            "電影院",
            "密室逃脫",
            "桌遊店",
            "遊樂場",
            "遊戲中心",
            "娛樂場所",
            "演唱會",
            "展演活動",
            "活動場地",
        ],
    },
    {
        id: "rental-booking",
        items: [
            "場地租借",
            "攝影棚",
            "共享辦公室",
            "會議室租借",
            "設備租賃",
            "婚紗攝影",
            "攝影服務",
            "機車租賃",
            "自行車租賃",
            "工具租賃",
        ],
    },
    {
        id: "transport-auto",
        items: [
            "計程車",
            "接駁服務",
            "包車服務",
            "物流",
            "快遞",
            "搬家公司",
            "汽車服務",
            "汽車保養",
            "汽車美容",
            "機車維修",
            "洗車",
        ],
    },
    {
        id: "life-services",
        items: [
            "洗衣店",
            "自助洗衣",
            "清潔服務",
            "家事服務",
            "居家服務",
            "搬家服務",
            "婚禮服務",
            "婚宴會館",
            "花藝",
            "花店",
            "照相館",
            "印刷",
            "影印服務",
        ],
    },
    {
        id: "b2b-professional",
        items: [
            "企業服務",
            "人力資源",
            "人才媒合",
            "顧問服務",
            "法律服務",
            "會計服務",
            "教育顧問",
            "行銷顧問",
            "設計服務",
            "軟體服務",
            "SaaS",
            "企業訂閱服務",
        ],
    },
    {
        id: "high-transaction",
        items: [
            "會員制服務",
            "訂閱制服務",
            "線上預約服務",
            "線上票券",
            "數位內容",
            "線上商城",
            "平台型服務",
            "APP 服務",
            "線上服務平台",
        ],
    },
];

function shuffle<T>(array: T[]): T[] {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function randomItem<T>(items: T[]): T | undefined {
    if (items.length === 0) return undefined;
    return items[Math.floor(Math.random() * items.length)];
}

function getSuggestions(limit = 8): string[] {
    // 先打散群組，確保優先從不同大類各取一筆。
    const shuffledGroups = shuffle(industryGroups);
    const selected: string[] = [];
    const selectedSet = new Set<string>();

    for (const group of shuffledGroups) {
        const item = randomItem(group.items);

        if (!item || selectedSet.has(item)) continue;

        selected.push(item);
        selectedSet.add(item);

        if (selected.length >= limit) {
            return selected;
        }
    }

    // 理論上目前群組數已足夠；保留 fallback 方便未來調整。
    const remaining = shuffle(
        industryGroups.flatMap((group) => group.items)
    );

    for (const item of remaining) {
        if (selectedSet.has(item)) continue;

        selected.push(item);
        selectedSet.add(item);

        if (selected.length >= limit) break;
    }

    return selected;
}

export async function POST(req: Request) {
    try {
        // 保留 body 接收，方便未來依使用者偏好做產業推薦。
        await req.json().catch(() => ({}));

        const suggestions = getSuggestions(8);

        return NextResponse.json({
            success: true,
            version: "industry-suggestions-v2",
            source: "local-industry-pool",
            openAI: false,
            tavily: false,
            suggestions,
        });
    } catch (error) {
        console.error("產業建議 API 失敗：", error);

        return NextResponse.json(
            {
                success: false,
                error: "取得產業建議失敗",
                suggestions: [],
            },
            {
                status: 500,
            }
        );
    }
}
