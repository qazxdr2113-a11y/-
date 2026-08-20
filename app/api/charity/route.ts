import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 45;

// ============================================================
// Charity Website Analyzer v3
// No Tavily / No OpenAI
// ============================================================

const charityCategories = [
    { name: "動物／流浪動物", keywords: ["動物", "流浪動物", "犬", "狗", "貓", "毛孩", "寵物", "動保", "動物保護", "animal", "dog", "cat", "pet"] },
    { name: "失智／認知障礙", keywords: ["失智", "認知障礙", "阿茲海默", "失智症", "長照", "dementia", "alzheimer"] },
    { name: "長者／老人福利", keywords: ["老人", "長者", "高齡", "銀髮", "老人福利", "長輩", "elderly", "senior"] },
    { name: "兒童／青少年", keywords: ["兒童", "孩童", "青少年", "少年", "兒少", "弱勢兒童", "兒童福利", "child", "children", "youth"] },
    { name: "身心障礙", keywords: ["身心障礙", "身障", "障礙", "智能障礙", "視障", "聽障", "肢體障礙", "disability"] },
    { name: "醫療／疾病", keywords: ["醫療", "疾病", "癌症", "罕見疾病", "病友", "醫院", "健康", "醫學", "medical", "cancer", "health"] },
    { name: "教育", keywords: ["教育", "助學", "獎學金", "學童", "學生", "偏鄉教育", "教育基金", "education", "scholarship"] },
    { name: "環境／生態", keywords: ["環境", "生態", "保育", "自然", "海洋", "森林", "氣候", "環保", "environment", "ecology", "conservation"] },
    { name: "社會福利", keywords: ["社會福利", "弱勢", "社福", "貧困", "弱勢家庭", "社會救助", "公益", "慈善", "社會服務", "social welfare"] },
    { name: "災害救助", keywords: ["災害", "救災", "災民", "賑災", "地震", "颱風", "水災", "災區", "disaster", "relief"] },
    { name: "國際援助", keywords: ["國際援助", "海外援助", "國際救援", "難民", "人道援助", "international", "humanitarian", "refugee"] },
    { name: "婦女／家庭", keywords: ["婦女", "女性", "家庭", "單親", "家暴", "性別", "女性權益", "women", "family"] },
    { name: "青少年／青年培力", keywords: ["青年", "青年培力", "青年發展", "青少年培力", "teen", "teenager"] },
    { name: "心理健康", keywords: ["心理", "心理健康", "心理支持", "心理諮商", "精神健康", "mental health", "mental"] },
];

function uniqueStrings(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function decodeHtml(value: string) {
    return String(value || "")
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
            const code = Number.parseInt(hex, 16);
            return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
        })
        .replace(/&#([0-9]+);/g, (_, decimal) => {
            const code = Number.parseInt(decimal, 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
        })
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&nbsp;/gi, " ");
}

function cleanHtml(html: string) {
    return decodeHtml(
        String(html || "")
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

function normalizeUrl(rawUrl: string) {
    let value = decodeHtml(String(rawUrl || "")).trim();
    if (!value) return "";

    if (!/^https?:\/\//i.test(value)) {
        value = `https://${value}`;
    }

    try {
        const parsed = new URL(value);
        parsed.hash = "";
        return parsed.toString().replace(/\/$/, "");
    } catch {
        return "";
    }
}

function getHostname(url: string) {
    try {
        return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
        return "";
    }
}

function findSignals(text: string, signals: string[]) {
    const lower = text.toLowerCase();
    return uniqueStrings(signals.filter((signal) => lower.includes(signal.toLowerCase())));
}

function detectOrganizationName(html: string, url: string) {
    const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
    if (og?.[1]) return decodeHtml(og[1]).trim();

    const app = html.match(/<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i);
    if (app?.[1]) return decodeHtml(app[1]).trim();

    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (title?.[1]) {
        const text = decodeHtml(title[1]).replace(/\s+/g, " ").trim();
        if (text.length >= 2 && text.length <= 150) return text;
    }

    return getHostname(url).split(".")[0] || "未知公益組織";
}

function detectCategories(text: string) {
    const lower = text.toLowerCase();

    return charityCategories
        .map((category) => {
            const hits = category.keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
            return {
                name: category.name,
                score: hits.reduce((sum, hit) => sum + (hit.length >= 4 ? 3 : 1), 0),
            };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.name);
}

async function fetchHtml(url: string) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
            },
            redirect: "follow",
            cache: "no-store",
            signal: AbortSignal.timeout(12000),
        });

        if (!response.ok) {
            return { html: "", finalUrl: url, error: `HTTP ${response.status}` };
        }

        const html = await response.text();
        return { html, finalUrl: response.url || url, error: "" };
    } catch (error) {
        return {
            html: "",
            finalUrl: url,
            error: error instanceof Error ? error.message : "fetch failed",
        };
    }
}

function extractDonationLinks(html: string, baseUrl: string) {
    const results: string[] = [];
    const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
        const href = decodeHtml(match[1]);
        const label = cleanHtml(match[2]);
        const combined = `${href} ${label}`.toLowerCase();

        if (!/(捐款|捐贈|支持我們|donat|giving|give|support)/i.test(combined)) continue;

        try {
            const absolute = new URL(href, baseUrl).toString();
            if (getHostname(absolute) !== getHostname(baseUrl)) continue;
            const normalized = normalizeUrl(absolute);
            if (normalized && !results.includes(normalized)) results.push(normalized);
        } catch {}

        if (results.length >= 2) break;
    }

    return results;
}

function detectDonation(text: string) {
    const signals = findSignals(text, [
        "線上捐款",
        "線上捐贈",
        "立即捐款",
        "我要捐款",
        "愛心捐款",
        "捐款支持",
        "支持我們",
        "donate",
        "donation",
        "give now",
    ]);

    const recurringSignals = findSignals(text, [
        "定期捐款",
        "定期定額",
        "每月捐款",
        "月捐",
        "定期捐贈",
        "每月支持",
        "monthly donation",
        "recurring donation",
        "monthly giving",
    ]);

    const lower = text.toLowerCase();
    const methods: string[] = [];

    const methodGroups = [
        { name: "信用卡", signals: ["信用卡", "visa", "mastercard", "jcb"] },
        { name: "定期定額", signals: ["定期定額", "每月捐款", "月捐", "recurring"] },
        { name: "ATM／轉帳", signals: ["atm", "銀行轉帳", "匯款", "轉帳"] },
        { name: "超商", signals: ["超商", "便利商店", "ibon", "famiport"] },
        { name: "LINE Pay", signals: ["line pay"] },
        { name: "街口支付", signals: ["街口支付", "jkopay"] },
        { name: "全支付", signals: ["全支付", "全+pay", "pxpay+"] },
        { name: "Apple Pay", signals: ["apple pay"] },
    ];

    for (const group of methodGroups) {
        if (group.signals.some((signal) => lower.includes(signal))) methods.push(group.name);
    }

    const online = signals.length > 0 || methods.length > 0;
    const recurring = recurringSignals.length > 0 || methods.includes("定期定額");

    return {
        online,
        hasOnlineDonation: online,
        recurring,
        hasRecurringDonation: recurring,
        methods: uniqueStrings(methods),
        signals: uniqueStrings([...signals, ...recurringSignals]).slice(0, 12),
    };
}

function detectPhysicalStore(text: string) {
    const signals = findSignals(text, [
        "服務據點",
        "服務中心",
        "服務站",
        "服務處",
        "辦事處",
        "分會",
        "分院",
        "院區",
        "據點",
        "聯絡地址",
        "服務地址",
        "contact us",
        "location",
        "office",
        "branch",
    ]);

    const phoneFound = /(?:0\d{1,2}[-\s]?\d{6,8})/.test(text);
    if (phoneFound) signals.push("電話資訊");

    return {
        hasPhysicalStore: signals.length > 0,
        signals: uniqueStrings(signals).slice(0, 10),
    };
}

function detectFundraising(text: string) {
    const signals = findSignals(text, [
        "勸募字號",
        "勸募許可",
        "勸募核准",
        "勸募文號",
        "公益勸募",
        "勸募活動",
        "募款許可",
        "募款期間",
        "勸募期間",
    ]);

    const patterns = [
        /衛部救字第[^\s，。,、；;]{2,40}/i,
        /衛授救字第[^\s，。,、；;]{2,40}/i,
        /府社字第[^\s，。,、；;]{2,40}/i,
        /勸募許可字號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
        /勸募字號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
        /勸募文號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
    ];

    let fundraisingNumber = "";
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[0]) {
            fundraisingNumber = match[0].replace(/\s+/g, " ").trim();
            break;
        }
    }

    return {
        hasFundraisingInfo: Boolean(fundraisingNumber) || signals.length > 0,
        fundraisingNumber,
        signals: signals.slice(0, 10),
    };
}

function detectFullPay(text: string) {
    const signals = findSignals(text, [
        "全支付",
        "全+pay",
        "全+支付",
        "pxpay+",
        "px pay+",
        "pxpay plus",
        "px pay plus",
        "全支付捐款",
        "全支付捐贈",
    ]);

    return {
        hasFullPay: signals.length > 0,
        signals: signals.slice(0, 10),
        excludeFromSearch: signals.length > 0,
    };
}

function detectContact(text: string) {
    const phone = text.match(/(?:\+886[-\s]?)?(?:0\d{1,2})[-\s]?\d{6,8}/)?.[0] || "";
    const address = text.match(/(?:台|臺|新北|桃園|新竹|苗栗|彰化|南投|雲林|嘉義|高雄|屏東|宜蘭|花蓮|基隆|澎湖|金門)[^，。；;]{0,8}(?:市|縣)[^，。；;]{3,55}/)?.[0] || "";
    return { phone, address };
}

function calculatePaymentScore(
    donation: ReturnType<typeof detectDonation>,
    fundraising: ReturnType<typeof detectFundraising>
) {
    let score = 0;
    if (donation.online) score += 12;
    if (donation.recurring) score += 8;
    if (donation.methods.includes("信用卡")) score += 4;
    if (donation.methods.some((method) => ["LINE Pay", "街口支付", "Apple Pay", "全支付"].includes(method))) score += 3;
    if (fundraising.hasFundraisingInfo) score += 3;
    return Math.min(30, score);
}

function buildRecommendation(
    donation: ReturnType<typeof detectDonation>,
    physical: ReturnType<typeof detectPhysicalStore>,
    fundraising: ReturnType<typeof detectFundraising>,
    fullPay: ReturnType<typeof detectFullPay>
) {
    if (fullPay.hasFullPay) {
        return "官網已偵測到全支付相關資訊，建議確認既有合作狀態後再進一步開發。";
    }

    const recommendations: string[] = [];

    if (donation.online) recommendations.push("網站已有線上捐款需求，可優先洽談 EC／APP 捐款金流合作。");
    if (donation.recurring) recommendations.push("網站具有定期捐款需求，可進一步洽談定期扣款合作。");
    if (fundraising.hasFundraisingInfo) recommendations.push("網站具有公益勸募資訊，可確認 APP 捐款專區合作可能性。");
    if (physical.hasPhysicalStore) recommendations.push("網站具有實體服務據點，可進一步確認現場收款、POS 或其他支付需求。");

    return recommendations.length > 0
        ? recommendations.join(" ")
        : "目前尚未偵測到明確合作訊號，建議進一步確認線上捐款、定期捐款與收費流程。";
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const rawUrl = String(body?.url || "").trim();

        if (!rawUrl) {
            return NextResponse.json(
                { success: false, error: "請輸入公益組織網址" },
                { status: 400 }
            );
        }

        const requestedUrl = normalizeUrl(rawUrl);
        if (!requestedUrl) {
            return NextResponse.json(
                { success: false, error: "網址格式不正確" },
                { status: 400 }
            );
        }

        console.log("====================================");
        console.log("Charity Analyzer v3");
        console.log("網址：", requestedUrl);
        console.log("Tavily：0 / OpenAI：0");

        const home = await fetchHtml(requestedUrl);

        if (!home.html) {
            return NextResponse.json(
                {
                    success: false,
                    error: `網站無法讀取${home.error ? `：${home.error}` : ""}`,
                    url: requestedUrl,
                },
                { status: 400 }
            );
        }

        const url = normalizeUrl(home.finalUrl) || requestedUrl;
        let combinedText = cleanHtml(home.html);

        const donationLinks = extractDonationLinks(home.html, url);
        const donationPages = await Promise.all(donationLinks.map((link) => fetchHtml(link)));

        for (const page of donationPages) {
            if (page.html) combinedText += ` ${cleanHtml(page.html)}`;
        }

        const organizationName = detectOrganizationName(home.html, url);
        const categories = detectCategories(combinedText);
        const donation = detectDonation(combinedText);
        const physicalStore = detectPhysicalStore(combinedText);
        const fundraising = detectFundraising(combinedText);
        const fullPay = detectFullPay(combinedText);
        const contact = detectContact(combinedText);
        const paymentScore = calculatePaymentScore(donation, fundraising);
        const physicalScore = physicalStore.hasPhysicalStore ? 10 : 0;

        let confidence = 45;
        if (categories.length > 0) confidence += 15;
        if (donation.online) confidence += 12;
        if (donation.recurring) confidence += 8;
        if (fundraising.hasFundraisingInfo) confidence += 10;
        if (physicalStore.hasPhysicalStore) confidence += 8;
        confidence = Math.min(confidence, 98);

        const cooperation: string[] = [];
        if (donation.online) cooperation.push("線上捐款");
        if (donation.recurring) cooperation.push("定期捐款");
        if (physicalStore.hasPhysicalStore) cooperation.push("實體據點");

        const priority = donation.online && donation.recurring
            ? "高"
            : donation.online || physicalStore.hasPhysicalStore
                ? "中"
                : "低";

        const evidence = uniqueStrings([
            categories.length > 0 ? `公益分類：${categories.join("、")}` : "",
            ...donation.signals.map((signal) => `捐款：${signal}`),
            ...donation.methods.map((method) => `付款方式：${method}`),
            ...physicalStore.signals.map((signal) => `據點：${signal}`),
            ...fundraising.signals.map((signal) => `勸募：${signal}`),
            ...fullPay.signals.map((signal) => `全支付：${signal}`),
        ]).slice(0, 20);

        const result = {
            success: true,
            version: "charity-analyzer-v3",
            type: "charity",
            url,
            website: url,
            organizationName,
            name: organizationName,
            category: categories[0] || "公益組織",
            categories: categories.length > 0 ? categories : ["公益組織"],
            platform: "",
            confidence,
            onlineDonation: donation.online,
            recurringDonation: donation.recurring,
            donation,
            donationSignals: donation.signals,
            physicalStore,
            hasPhysicalStore: physicalStore.hasPhysicalStore,
            fundraisingNumber: fundraising.fundraisingNumber,
            fundraisingNo: fundraising.fundraisingNumber,
            solicitationNumber: fundraising.fundraisingNumber,
            fundraising,
            paymentScore,
            physicalScore,
            cooperation,
            fullPay,
            phone: contact.phone,
            address: contact.address,
            priority,
            recommendation: buildRecommendation(donation, physicalStore, fundraising, fullPay),
            evidence,
            analyzedPages: [url, ...donationLinks],
            tavily: false,
            openAI: false,
        };

        console.log("組織：", organizationName);
        console.log("線上捐款：", donation.online);
        console.log("定期捐款：", donation.recurring);
        console.log("Payment Score：", paymentScore);
        console.log("====================================");

        return NextResponse.json(result);
    } catch (error) {
        console.error("❌ Charity API Error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "公益網站分析失敗",
            },
            { status: 500 }
        );
    }
}
