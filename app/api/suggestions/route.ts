import { NextResponse } from "next/server";

type Suggestion = {
    keyword: string;
    category: string;
    reason: string;
};

type Industry = {
    category: string;
    keywords: string[];
};

const industries: Industry[] = [
    {
        category: "電動車",
        keywords: [
            "電動車充電",
            "充電站",
            "充電樁",
            "充電服務",
            "電動車租賃",
        ],
    },
    {
        category: "交通／停車",
        keywords: [
            "停車場",
            "智慧停車",
            "停車繳費",
            "車位租賃",
            "共享汽車",
            "共享機車",
            "租車",
        ],
    },
    {
        category: "餐飲",
        keywords: [
            "餐廳",
            "連鎖餐廳",
            "餐飲品牌",
            "咖啡廳",
            "甜點店",
            "火鍋店",
            "燒肉店",
            "早午餐",
        ],
    },
    {
        category: "零售／百貨",
        keywords: [
            "百貨",
            "購物中心",
            "生活百貨",
            "零售品牌",
            "連鎖零售",
            "商場",
            "Outlet",
        ],
    },
    {
        category: "服飾",
        keywords: [
            "服飾品牌",
            "女裝",
            "男裝",
            "鞋類",
            "運動服飾",
            "精品服飾",
            "服飾網購",
        ],
    },
    {
        category: "美容／美髮",
        keywords: [
            "美容SPA",
            "美容",
            "美髮沙龍",
            "髮廊",
            "美甲",
            "美睫",
            "美容連鎖店",
        ],
    },
    {
        category: "健身／運動",
        keywords: [
            "健身房",
            "健身中心",
            "瑜珈教室",
            "運動中心",
            "運動場館",
            "私人教練",
            "健身工作室",
        ],
    },
    {
        category: "醫療／健康",
        keywords: [
            "診所",
            "牙醫診所",
            "醫美",
            "復健診所",
            "眼科診所",
            "皮膚科診所",
            "健康管理",
        ],
    },
    {
        category: "教育",
        keywords: [
            "補習班",
            "線上課程",
            "教育機構",
            "語言中心",
            "才藝教室",
            "職業培訓",
            "成人教育",
        ],
    },
    {
        category: "旅遊／住宿",
        keywords: [
            "飯店",
            "旅館",
            "民宿",
            "旅行社",
            "旅遊平台",
            "渡假村",
            "住宿",
        ],
    },
    {
        category: "娛樂／活動",
        keywords: [
            "展覽",
            "活動票券",
            "演唱會票券",
            "遊樂園",
            "親子樂園",
            "密室逃脫",
            "娛樂場館",
        ],
    },
    {
        category: "寵物",
        keywords: [
            "寵物用品",
            "寵物美容",
            "寵物店",
            "寵物醫院",
            "寵物旅館",
            "寵物品牌",
        ],
    },
    {
        category: "家居／生活",
        keywords: [
            "家具",
            "家居用品",
            "生活用品",
            "家電",
            "居家生活",
            "室內設計",
            "家居電商",
        ],
    },
    {
        category: "食品／生鮮",
        keywords: [
            "食品品牌",
            "生鮮電商",
            "食材品牌",
            "零食品牌",
            "烘焙品牌",
            "冷凍食品",
            "伴手禮",
        ],
    },
    {
        category: "3C／科技",
        keywords: [
            "3C品牌",
            "手機配件",
            "電腦周邊",
            "科技品牌",
            "電子產品",
            "3C電商",
        ],
    },
    {
        category: "汽車／機車",
        keywords: [
            "汽車保養",
            "汽車美容",
            "汽車零件",
            "機車行",
            "汽車租賃",
            "汽車服務",
        ],
    },
    {
        category: "租賃／共享",
        keywords: [
            "設備租賃",
            "場地租借",
            "共享空間",
            "共享辦公室",
            "攝影棚租借",
            "活動場地租借",
        ],
    },
    {
        category: "商務服務",
        keywords: [
            "會議場地",
            "商務中心",
            "共享辦公室",
            "企業服務",
            "顧問服務",
            "企業培訓",
        ],
    },
    {
        category: "婚禮／攝影",
        keywords: [
            "婚紗",
            "婚禮顧問",
            "婚宴場地",
            "婚禮攝影",
            "攝影工作室",
            "婚禮服務",
        ],
    },
    {
        category: "家事／到府服務",
        keywords: [
            "清潔服務",
            "家事服務",
            "搬家",
            "居家清潔",
            "除蟲",
            "洗衣服務",
        ],
    },
];

function shuffle<T>(array: T[]): T[] {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [
            result[j],
            result[i],
        ];
    }

    return result;
}

export async function POST() {
    try {
        const selectedIndustries = shuffle(
            industries
        ).slice(0, 8);

        const suggestions: Suggestion[] = [];

        for (const industry of selectedIndustries) {
            const keyword =
                shuffle(industry.keywords)[0];

            suggestions.push({
                keyword,
                category: industry.category,
                reason:
                    `可從「${industry.category}」尋找具有付款、預約、會員、訂購或實體交易需求的潛在商戶。`,
            });
        }

        return NextResponse.json({
            success: true,
            suggestions: shuffle(
                suggestions
            ),
        });
    } catch (error) {
        console.error(
            "Suggestions API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error: "產生搜尋建議失敗",
            },
            {
                status: 500,
            }
        );
    }
}