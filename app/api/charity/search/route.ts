import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// ============================================================
// Charity Search v4
// Government open data + website analysis
//
// Goals
// 1. Tavily = 0
// 2. OpenAI = 0
// 3. Government rosters provide breadth even when MOHW registry is unavailable.
// 4. Organizations without a website are still returned as leads.
// 5. Known official websites are analyzed for donation / recurring donation.
// 6. Keep response fields compatible with CharityDevelopment.tsx.
// ============================================================

type DonationResult = {
    online: boolean;
    hasOnlineDonation: boolean;
    recurring: boolean;
    hasRecurringDonation: boolean;
    methods: string[];
    signals: string[];
};

type PhysicalResult = {
    hasPhysicalStore: boolean;
    signals: string[];
};

type FundraisingResult = {
    hasFundraisingInfo: boolean;
    number: string;
    signals: string[];
};

type GovernmentEntry = {
    name: string;
    address: string;
    type: string;
    source: string;
    established?: string;
    chairman?: string;
    score?: number;
};

type SeedEntry = {
    name: string;
    website: string;
    categories: string[];
    keywords: string[];
    phone?: string;
    address?: string;
};

type CharityResult = {
    success: true;
    type: "charity";
    organizationName: string;
    name: string;
    url: string;
    website: string;
    category: string;
    categories: string[];
    orgType: string;
    phone: string;
    address: string;
    donation: DonationResult;
    onlineDonation: boolean;
    recurringDonation: boolean;
    physicalStore: PhysicalResult;
    hasPhysicalStore: boolean;
    fundraising: FundraisingResult;
    fundraisingNumber: string;
    paymentScore: number;
    physicalScore: number;
    confidence: number;
    priority: "高" | "中" | "低";
    cooperation: string[];
    recommendation: string;
    evidence: string[];
    fullPay: {
        hasFullPay: boolean;
        signals: string[];
        excludeFromSearch: boolean;
    };
    governmentSource: string;
    governmentMatchScore: number;
    websiteFetchSuccess: boolean;
};

// ============================================================
// Tunables
// ============================================================

const FINAL_LIMIT = 30;
const GOVERNMENT_CANDIDATE_LIMIT = 80;
const WEBSITE_ANALYZE_LIMIT = 18;
const WEBSITE_BATCH_SIZE = 6;
const GOVERNMENT_CACHE_TTL = 12 * 60 * 60 * 1000;
const WEBSITE_CACHE_TTL = 60 * 60 * 1000;

// Ministry of the Interior / Government Open Data platform resources.
// These URLs are the CSV resources behind data.gov.tw datasets.
const ASSOCIATION_CSV_URL =
    "https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/DA99D92C-531A-40B2-AFF6-D5C1C7AEE022/resource/6CD84A67-522B-4811-96B8-3E7942AE3C1B/download";

const FOUNDATION_CSV_URL =
    "https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/470F5551-E9B0-48A8-929C-F5395BFA4978/resource/F70DDD2B-4B3B-4AEA-8A91-7203808147EF/download";

// ============================================================
// Category Profiles
// ============================================================

type CategoryProfile = {
    name: string;
    triggers: string[];
    searchTerms: string[];
    strongNameSignals: string[];
    negativeNameSignals?: string[];
};

const categoryProfiles: CategoryProfile[] = [
    {
        name: "動物／流浪動物",
        triggers: ["動物", "動物保護", "動保", "流浪動物", "流浪犬", "流浪貓", "犬貓", "毛孩", "寵物"],
        searchTerms: [
            "動物保護",
            "保護動物",
            "愛護動物",
            "流浪動物",
            "流浪犬",
            "流浪貓",
            "犬貓",
            "動物福利",
            "動物救援",
            "動物關懷",
            "野生動物",
        ],
        strongNameSignals: [
            "保護動物",
            "動物保護",
            "愛護動物",
            "流浪動物",
            "流浪犬",
            "流浪貓",
            "犬貓",
            "動物福利",
            "動物救援",
            "動物關懷",
            "野生動物保護",
        ],
        negativeNameSignals: [
            "獸醫師公會",
            "獸醫學會",
            "畜牧",
            "養殖",
            "寵物商業",
            "寵物產業",
            "寵物美容",
            "寵物食品",
            "寵物用品商業",
            "犬種俱樂部",
            "犬協會",
            "貓協會",
        ],
    },
    {
        name: "失智／認知障礙",
        triggers: ["失智", "失智照護", "認知障礙", "阿茲海默", "長照"],
        searchTerms: ["失智", "認知障礙", "阿茲海默", "失智照護", "失智症"],
        strongNameSignals: ["失智", "阿茲海默", "認知障礙"],
    },
    {
        name: "長者／老人福利",
        triggers: ["老人", "老人照護", "長者", "高齡", "銀髮", "老人福利"],
        searchTerms: ["老人", "長者", "高齡", "銀髮", "老人福利", "長者照護"],
        strongNameSignals: ["老人福利", "老人", "長者", "高齡", "銀髮"],
    },
    {
        name: "兒童／青少年",
        triggers: ["兒童", "兒少", "兒少福利", "青少年", "弱勢兒童", "孩子"],
        searchTerms: ["兒童", "兒少", "兒童福利", "青少年", "弱勢兒童", "兒童關懷"],
        strongNameSignals: ["兒童福利", "兒童", "兒少", "青少年", "孩子"],
    },
    {
        name: "身心障礙",
        triggers: ["身心障礙", "身障", "視障", "聽障", "智能障礙", "障礙服務"],
        searchTerms: ["身心障礙", "身障", "視障", "聽障", "智能障礙", "障礙者"],
        strongNameSignals: ["身心障礙", "身障", "視障", "聽障", "智能障礙"],
    },
    {
        name: "醫療／疾病",
        triggers: ["癌症", "癌症醫療", "罕見疾病", "病友", "醫療公益", "疾病"],
        searchTerms: ["癌症", "罕見疾病", "病友", "醫療", "疾病", "健康關懷"],
        strongNameSignals: ["癌症", "罕見疾病", "病友", "醫療", "疾病"],
        negativeNameSignals: ["醫師公會", "醫學會", "醫療產業", "醫療器材"],
    },
    {
        name: "教育",
        triggers: ["教育公益", "助學", "偏鄉教育", "兒童教育", "獎學金", "教育"],
        searchTerms: ["助學", "偏鄉教育", "教育公益", "獎學金", "弱勢學生", "教育關懷"],
        strongNameSignals: ["助學", "偏鄉教育", "教育基金", "弱勢教育", "獎學"],
    },
    {
        name: "環境／生態",
        triggers: ["環境保育", "環境", "生態", "保育", "海洋", "森林", "環保"],
        searchTerms: ["環境保護", "環境保育", "生態保育", "海洋保育", "森林保育", "自然保育"],
        strongNameSignals: ["環境保護", "環境保育", "生態", "保育", "海洋", "森林"],
    },
    {
        name: "婦女／家庭",
        triggers: ["婦女", "婦女福利", "女性", "家庭", "單親", "家暴"],
        searchTerms: ["婦女", "女性權益", "家庭扶助", "單親", "家暴", "婦幼"],
        strongNameSignals: ["婦女", "女性", "婦幼", "家庭扶助", "家暴"],
    },
    {
        name: "心理健康",
        triggers: ["心理健康", "心理", "心理支持", "精神健康", "心理諮商"],
        searchTerms: ["心理健康", "心理支持", "精神健康", "心理關懷", "自殺防治"],
        strongNameSignals: ["心理健康", "心理", "精神健康", "心理關懷"],
    },
    {
        name: "社會福利",
        triggers: ["弱勢扶助", "社會福利", "社福", "弱勢", "公益", "公益募款", "慈善"],
        searchTerms: ["社會福利", "弱勢", "慈善", "公益", "關懷", "扶助", "救助"],
        strongNameSignals: ["社會福利", "慈善", "公益", "弱勢", "關懷", "扶助", "救助"],
    },
];

const genericCharityNameSignals = [
    "慈善",
    "公益",
    "福利",
    "關懷",
    "扶助",
    "救助",
    "救援",
    "保護",
    "基金會",
    "協會",
    "促進會",
    "服務協會",
];

const genericNonLeadSignals = [
    "同業公會",
    "商業同業",
    "工業同業",
    "職業工會",
    "產業協會",
    "企業協會",
    "校友會",
    "宗親會",
    "聯誼會",
    "商會",
    "學術學會",
];

// ============================================================
// Known official websites
//
// These do NOT replace government data. They let high-value known NGOs
// enter website analysis immediately, while government rosters provide breadth.
// ============================================================

const websiteSeeds: SeedEntry[] = [
    // Animal
    {
        name: "社團法人台灣之心愛護動物協會",
        website: "https://www.hotac.org.tw",
        categories: ["動物／流浪動物"],
        keywords: ["動物", "動保", "流浪動物", "犬貓", "絕育"],
    },
    {
        name: "社團法人台灣防止虐待動物協會",
        website: "https://www.spca.org.tw",
        categories: ["動物／流浪動物"],
        keywords: ["動物", "動保", "虐待動物", "動物福利"],
    },
    {
        name: "社團法人中華民國保護動物協會",
        website: "https://www.apatw.org",
        categories: ["動物／流浪動物"],
        keywords: ["動物", "動保", "保護動物", "流浪動物"],
    },
    {
        name: "社團法人台灣動物社會研究會",
        website: "https://www.east.org.tw",
        categories: ["動物／流浪動物", "環境／生態"],
        keywords: ["動物", "動保", "動物福利", "動物保護", "保育"],
    },
    {
        name: "社團法人中華民國關懷生命協會",
        website: "https://www.lca.org.tw",
        categories: ["動物／流浪動物"],
        keywords: ["動物", "動保", "生命關懷", "動物保護"],
    },
    {
        name: "台灣動物緊急救援小組",
        website: "https://www.savedogs.org",
        categories: ["動物／流浪動物"],
        keywords: ["動物", "動保", "動物救援", "流浪犬", "流浪動物"],
    },
    {
        name: "Animals Taiwan 台灣動物協會",
        website: "https://www.animalstaiwan.org",
        categories: ["動物／流浪動物"],
        keywords: ["動物", "動保", "流浪動物", "animal"],
    },
    {
        name: "社團法人台灣流浪動物救援協會",
        website: "https://thara.eoffering.org.tw",
        categories: ["動物／流浪動物"],
        keywords: ["動物", "動保", "流浪動物", "動物救援", "犬", "貓"],
    },

    // Children / family / disability / elderly / medical
    {
        name: "財團法人台灣兒童暨家庭扶助基金會",
        website: "https://www.ccf.org.tw",
        categories: ["兒童／青少年", "社會福利", "婦女／家庭"],
        keywords: ["兒童", "兒少", "弱勢", "家庭", "扶助", "助學"],
    },
    {
        name: "財團法人兒童福利聯盟文教基金會",
        website: "https://www.children.org.tw",
        categories: ["兒童／青少年", "社會福利"],
        keywords: ["兒童", "兒少", "兒童福利", "弱勢兒童"],
    },
    {
        name: "財團法人伊甸社會福利基金會",
        website: "https://www.eden.org.tw",
        categories: ["身心障礙", "社會福利"],
        keywords: ["身心障礙", "身障", "弱勢", "社會福利"],
    },
    {
        name: "財團法人心路社會福利基金會",
        website: "https://www.syinlu.org.tw",
        categories: ["身心障礙", "社會福利"],
        keywords: ["身心障礙", "智能障礙", "早療", "社會福利"],
    },
    {
        name: "財團法人弘道老人福利基金會",
        website: "https://www.hondao.org.tw",
        categories: ["長者／老人福利", "社會福利"],
        keywords: ["老人", "長者", "高齡", "銀髮", "老人福利"],
    },
    {
        name: "財團法人癌症希望基金會",
        website: "https://www.ecancer.org.tw",
        categories: ["醫療／疾病"],
        keywords: ["癌症", "癌友", "病友", "醫療"],
    },
    {
        name: "財團法人罕見疾病基金會",
        website: "https://www.tfrd.org.tw",
        categories: ["醫療／疾病"],
        keywords: ["罕見疾病", "病友", "醫療"],
    },
    {
        name: "財團法人勵馨社會福利事業基金會",
        website: "https://www.goh.org.tw",
        categories: ["婦女／家庭", "社會福利", "兒童／青少年"],
        keywords: ["婦女", "家庭", "家暴", "兒少", "社會福利"],
    },
    {
        name: "財團法人世界展望會",
        website: "https://www.worldvision.org.tw",
        categories: ["兒童／青少年", "社會福利", "國際援助"],
        keywords: ["兒童", "弱勢", "助學", "國際援助", "公益"],
    },

    // Environment
    {
        name: "社團法人台灣環境資訊協會",
        website: "https://teia.tw",
        categories: ["環境／生態"],
        keywords: ["環境", "生態", "保育", "環保"],
    },
];

// ============================================================
// Caches
// ============================================================

let governmentCache: {
    timestamp: number;
    entries: GovernmentEntry[];
    warnings: string[];
} | null = null;

const websiteCache = new Map<
    string,
    {
        timestamp: number;
        html: string;
        finalUrl: string;
    }
>();

// ============================================================
// General helpers
// ============================================================

function cleanText(value: string) {
    return String(value || "")
        .replace(/^\uFEFF/, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function cleanHtml(html: string) {
    return cleanText(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
            .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
            .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    );
}

function uniqueStrings(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeName(value: string) {
    return cleanText(value)
        .toLowerCase()
        .replace(/社團法人|財團法人|中華民國|臺灣|台灣/g, "")
        .replace(/[\s（）()\-＿_／/・·.,，。]/g, "")
        .trim();
}

function normalizeUrl(value: string) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    try {
        const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        const parsed = new URL(withProtocol);
        parsed.hash = "";
        return `${parsed.protocol}//${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "")}`;
    } catch {
        return "";
    }
}

function getHostname(value: string) {
    try {
        return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
        return "";
    }
}

function findSignals(text: string, signals: string[]) {
    const lower = text.toLowerCase();
    return signals.filter((signal) => lower.includes(signal.toLowerCase()));
}

function getProfile(keyword: string) {
    const lower = keyword.toLowerCase().trim();

    let best: CategoryProfile | null = null;
    let bestLength = 0;

    for (const profile of categoryProfiles) {
        for (const trigger of profile.triggers) {
            if (lower.includes(trigger.toLowerCase()) || trigger.toLowerCase().includes(lower)) {
                if (trigger.length > bestLength) {
                    best = profile;
                    bestLength = trigger.length;
                }
            }
        }
    }

    return best;
}

// ============================================================
// CSV parser
// ============================================================

function parseCsvRows(csv: string): string[][] {
    const text = csv.replace(/^\uFEFF/, "");
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                cell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            row.push(cell.trim());
            cell = "";
            continue;
        }

        if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") i++;
            row.push(cell.trim());
            cell = "";

            if (row.some((value) => value.trim())) rows.push(row);
            row = [];
            continue;
        }

        cell += char;
    }

    if (cell || row.length > 0) {
        row.push(cell.trim());
        if (row.some((value) => value.trim())) rows.push(row);
    }

    return rows;
}

function rowsToObjects(rows: string[][]) {
    if (rows.length === 0) return [] as Record<string, string>[];

    let headerIndex = 0;

    // The association dataset currently includes an English header and a Chinese label row.
    // Prefer the first row as headers if it looks structured.
    const headers = rows[headerIndex].map((value) => cleanText(value));

    return rows.slice(headerIndex + 1).map((row) => {
        const item: Record<string, string> = {};
        headers.forEach((header, index) => {
            item[header] = cleanText(row[index] || "");
        });
        return item;
    });
}

function firstValue(item: Record<string, string>, keys: string[]) {
    for (const key of keys) {
        if (item[key]) return cleanText(item[key]);
    }
    return "";
}

// ============================================================
// Fetch government CSVs
// ============================================================

async function fetchText(url: string, timeoutMs = 18000) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "PayLead-Finder-Charity/4.0",
                Accept: "text/csv,text/plain,*/*",
            },
            cache: "no-store",
            signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
            return { text: "", error: `HTTP ${response.status}` };
        }

        return { text: await response.text(), error: "" };
    } catch (error) {
        return {
            text: "",
            error: error instanceof Error ? error.message : "fetch failed",
        };
    }
}

function parseAssociationCsv(csv: string): GovernmentEntry[] {
    const objects = rowsToObjects(parseCsvRows(csv));
    const results: GovernmentEntry[] = [];

    for (const item of objects) {
        const name = firstValue(item, ["Name", "協會名稱", "團體名稱"]);
        const address = firstValue(item, ["address", "地址"]);
        const established = firstValue(item, ["Date_of_Establishment", "成立日期"]);
        const chairman = firstValue(item, ["Chairman", "理事長", "負責人"]);

        // Skip the Chinese label row that appears directly below the English header.
        if (!name || name === "協會名稱" || name === "團體名稱") continue;

        results.push({
            name,
            address,
            established,
            chairman,
            type: "全國性人民團體",
            source: "內政部全國性人民團體名冊",
        });
    }

    return results;
}

function parseFoundationCsv(csv: string): GovernmentEntry[] {
    const objects = rowsToObjects(parseCsvRows(csv));
    const results: GovernmentEntry[] = [];

    for (const item of objects) {
        const name = firstValue(item, ["團體名稱", "法人名稱", "Name", "名稱"]);
        const address = firstValue(item, ["地址", "主事務所地址", "address"]);
        const established = firstValue(item, ["成立日期", "許可設立日期", "Date_of_Establishment"]);
        const type = firstValue(item, ["類型", "type"]) || "財團法人";
        const chairman = firstValue(item, ["負責人", "法人代表", "Chairman"]);

        if (!name || name === "團體名稱" || name === "法人名稱") continue;

        results.push({
            name,
            address,
            established,
            chairman,
            type,
            source: "內政部財團法人名冊",
        });
    }

    return results;
}

async function loadGovernmentEntries() {
    if (
        governmentCache &&
        governmentCache.entries.length > 0 &&
        Date.now() - governmentCache.timestamp < GOVERNMENT_CACHE_TTL
    ) {
        console.log("🏛️ Government Cache：", governmentCache.entries.length);
        return governmentCache;
    }

    const warnings: string[] = [];

    const [association, foundation] = await Promise.all([
        fetchText(ASSOCIATION_CSV_URL),
        fetchText(FOUNDATION_CSV_URL),
    ]);

    const entries: GovernmentEntry[] = [];

    if (association.text) {
        const parsed = parseAssociationCsv(association.text);
        entries.push(...parsed);
        console.log("🏛️ 人民團體名冊：", parsed.length);
    } else {
        warnings.push(`人民團體名冊：${association.error}`);
    }

    if (foundation.text) {
        const parsed = parseFoundationCsv(foundation.text);
        entries.push(...parsed);
        console.log("🏛️ 財團法人名冊：", parsed.length);
    } else {
        warnings.push(`財團法人名冊：${foundation.error}`);
    }

    // Deduplicate exact / normalized names.
    const map = new Map<string, GovernmentEntry>();
    for (const item of entries) {
        const key = normalizeName(item.name) || item.name;
        const existing = map.get(key);

        if (!existing) {
            map.set(key, item);
            continue;
        }

        // Prefer the entry with a usable address and more specific type.
        if ((!existing.address && item.address) || existing.type === "全國性人民團體") {
            map.set(key, {
                ...existing,
                ...item,
                address: item.address || existing.address,
            });
        }
    }

    const result = {
        timestamp: Date.now(),
        entries: Array.from(map.values()),
        warnings,
    };

    // Only cache successful non-empty government data.
    if (result.entries.length > 0) {
        governmentCache = result;
    }

    return result;
}

// ============================================================
// Candidate scoring
// ============================================================

function scoreGovernmentEntry(entry: GovernmentEntry, keyword: string, profile: CategoryProfile | null) {
    const name = entry.name.toLowerCase();
    const keywordLower = keyword.toLowerCase().trim();
    let score = 0;
    const evidence: string[] = [];

    if (keywordLower && name.includes(keywordLower)) {
        score += 60;
        evidence.push(`名稱包含：${keyword}`);
    }

    const terms = profile
        ? uniqueStrings([...profile.searchTerms, ...profile.strongNameSignals, ...profile.triggers])
        : [keyword];

    for (const term of terms) {
        if (!term) continue;
        if (name.includes(term.toLowerCase())) {
            const weight = profile?.strongNameSignals.includes(term) ? 24 : 12;
            score += weight;
            evidence.push(`名稱訊號：${term}`);
        }
    }

    const genericHits = genericCharityNameSignals.filter((term) => name.includes(term.toLowerCase()));
    score += Math.min(genericHits.length * 4, 12);

    if (entry.type.includes("財團法人")) score += 6;
    if (entry.address) score += 3;

    const negativeSignals = [
        ...genericNonLeadSignals,
        ...(profile?.negativeNameSignals || []),
    ];

    const negativeHits = negativeSignals.filter((term) => name.includes(term.toLowerCase()));

    if (negativeHits.length > 0) {
        // Strong direct charity-category matches can survive a mild negative term,
        // otherwise professional / commercial associations are removed.
        const strongHits = profile
            ? profile.strongNameSignals.filter((term) => name.includes(term.toLowerCase())).length
            : 0;

        score -= strongHits > 0 ? negativeHits.length * 12 : negativeHits.length * 45;
        evidence.push(...negativeHits.map((term) => `排除風險：${term}`));
    }

    return {
        score,
        evidence: uniqueStrings(evidence).slice(0, 10),
    };
}

function findGovernmentCandidates(entries: GovernmentEntry[], keyword: string) {
    const profile = getProfile(keyword);

    const scored = entries
        .map((entry) => {
            const analysis = scoreGovernmentEntry(entry, keyword, profile);
            return {
                ...entry,
                score: analysis.score,
                _evidence: analysis.evidence,
            };
        })
        .filter((entry) => entry.score >= (profile ? 16 : 28))
        .sort((a, b) => b.score - a.score)
        .slice(0, GOVERNMENT_CANDIDATE_LIMIT);

    return scored;
}

function matchingSeeds(keyword: string) {
    const profile = getProfile(keyword);
    const lower = keyword.toLowerCase();

    return websiteSeeds
        .map((seed) => {
            let score = 0;

            if (seed.name.toLowerCase().includes(lower)) score += 60;

            for (const term of seed.keywords) {
                if (lower.includes(term.toLowerCase()) || term.toLowerCase().includes(lower)) {
                    score += 22;
                }
            }

            if (profile && seed.categories.includes(profile.name)) score += 45;

            return { seed, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.seed);
}

function findSeedForGovernmentEntry(entry: GovernmentEntry) {
    const normalized = normalizeName(entry.name);

    return websiteSeeds.find((seed) => {
        const seedName = normalizeName(seed.name);
        return (
            seedName === normalized ||
            (seedName.length >= 5 && normalized.includes(seedName)) ||
            (normalized.length >= 5 && seedName.includes(normalized))
        );
    });
}

// ============================================================
// Website analysis
// ============================================================

async function fetchWebsite(url: string) {
    const normalized = normalizeUrl(url);
    if (!normalized) return { html: "", finalUrl: "", error: "invalid url" };

    const cached = websiteCache.get(normalized);
    if (cached && Date.now() - cached.timestamp < WEBSITE_CACHE_TTL) {
        return { html: cached.html, finalUrl: cached.finalUrl, error: "" };
    }

    try {
        const response = await fetch(normalized, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
            },
            redirect: "follow",
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return { html: "", finalUrl: normalized, error: `HTTP ${response.status}` };
        }

        const html = await response.text();
        const finalUrl = response.url || normalized;

        if (html) {
            websiteCache.set(normalized, {
                timestamp: Date.now(),
                html,
                finalUrl,
            });
        }

        return { html, finalUrl, error: "" };
    } catch (error) {
        return {
            html: "",
            finalUrl: normalized,
            error: error instanceof Error ? error.message : "fetch failed",
        };
    }
}

function extractDonationLinks(html: string, baseUrl: string) {
    const links: string[] = [];
    const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html))) {
        const href = cleanText(match[1]);
        const anchor = cleanText(match[2]);
        const combined = `${href} ${anchor}`.toLowerCase();

        if (!/(捐款|捐贈|支持|贊助|donat|giving|give|support)/i.test(combined)) continue;

        try {
            const url = new URL(href, baseUrl).toString();
            const baseHost = getHostname(baseUrl);
            const targetHost = getHostname(url);

            if (!targetHost) continue;

            // Permit official site's donation subdomain and common third-party donation pages.
            const sameOrganization =
                targetHost === baseHost ||
                targetHost.endsWith(`.${baseHost}`) ||
                baseHost.endsWith(`.${targetHost}`);

            const donationProvider = /(eoffering|ugiving|neti|donate|giving)/i.test(targetHost);

            if (sameOrganization || donationProvider) links.push(url);
        } catch {
            // ignore malformed href
        }

        if (links.length >= 3) break;
    }

    return uniqueStrings(links);
}

function detectDonation(text: string): DonationResult {
    const lower = text.toLowerCase();

    const donationSignals = findSignals(lower, [
        "線上捐款",
        "立即捐款",
        "我要捐款",
        "愛心捐款",
        "捐款支持",
        "捐贈",
        "支持我們",
        "贊助我們",
        "donate",
        "donation",
        "give now",
    ]);

    const recurringSignals = findSignals(lower, [
        "定期定額",
        "定期捐款",
        "每月捐款",
        "月捐",
        "每月支持",
        "recurring donation",
        "monthly donation",
        "monthly giving",
    ]);

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
        if (group.signals.some((signal) => lower.includes(signal.toLowerCase()))) {
            methods.push(group.name);
        }
    }

    const online = donationSignals.length > 0 || methods.length > 0;
    const recurring = recurringSignals.length > 0 || methods.includes("定期定額");

    return {
        online,
        hasOnlineDonation: online,
        recurring,
        hasRecurringDonation: recurring,
        methods: uniqueStrings(methods),
        signals: uniqueStrings([...donationSignals, ...recurringSignals]).slice(0, 12),
    };
}

function detectFundraising(text: string): FundraisingResult {
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
    ];

    let number = "";
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[0]) {
            number = cleanText(match[0]);
            break;
        }
    }

    return {
        hasFundraisingInfo: Boolean(number) || signals.length > 0,
        number,
        signals: uniqueStrings(signals).slice(0, 10),
    };
}

function detectFullPay(text: string) {
    const signals = findSignals(text, [
        "全支付",
        "全+pay",
        "全+支付",
        "pxpay+",
        "px pay+",
        "全支付捐款",
        "全支付捐贈",
    ]);

    return {
        hasFullPay: signals.length > 0,
        signals: uniqueStrings(signals),
        excludeFromSearch: signals.length > 0,
    };
}

function categoryFromText(keyword: string, name: string, text: string, seed?: SeedEntry) {
    const categories = new Set<string>();

    if (seed) seed.categories.forEach((item) => categories.add(item));

    const haystack = `${keyword} ${name} ${text}`.toLowerCase();

    for (const profile of categoryProfiles) {
        const hits = [...profile.triggers, ...profile.strongNameSignals].filter((signal) =>
            haystack.includes(signal.toLowerCase())
        );
        if (hits.length > 0) categories.add(profile.name);
    }

    if (categories.size === 0) categories.add("公益組織");

    return Array.from(categories).slice(0, 3);
}

function calculatePaymentScore(donation: DonationResult, fundraising: FundraisingResult) {
    let score = 0;

    if (donation.online) score += 12;
    if (donation.recurring) score += 10;
    if (donation.methods.includes("信用卡")) score += 4;
    if (donation.methods.some((method) => ["LINE Pay", "街口支付", "Apple Pay"].includes(method))) score += 3;
    if (fundraising.hasFundraisingInfo) score += 5;

    return Math.min(score, 30);
}

function calculatePriority(
    donation: DonationResult,
    fundraising: FundraisingResult,
    website: string,
    governmentScore: number,
    fullPay: boolean
): "高" | "中" | "低" {
    if (fullPay) return "低";
    if (website && donation.online && (donation.recurring || fundraising.hasFundraisingInfo)) return "高";
    if (website && donation.online) return "高";
    if (website || governmentScore >= 55) return "中";
    return "低";
}

function buildRecommendation(
    donation: DonationResult,
    fundraising: FundraisingResult,
    website: string,
    address: string,
    fullPay: boolean
) {
    if (fullPay) {
        return "官網已偵測到全支付相關資訊，建議先確認既有合作狀態，避免重複開發。";
    }

    const recommendations: string[] = [];

    if (donation.online) {
        recommendations.push("已有線上捐款流程，可優先洽談 EC／APP 捐款金流合作。");
    }

    if (donation.recurring) {
        recommendations.push("具有定期捐款需求，可進一步評估定期扣款合作。");
    }

    if (fundraising.hasFundraisingInfo) {
        recommendations.push("具公益勸募資訊，可確認 APP 捐款專區合作資格。");
    }

    if (!donation.online && website) {
        recommendations.push("已有官方網站但尚未偵測到明確線上捐款，可人工確認捐款流程或企業合作入口。");
    }

    if (!website) {
        recommendations.push("政府名冊符合公益類型，但尚未取得官方網站；建議先補查官網與募款方式後再進一步開發。");
    }

    if (address) {
        recommendations.push("名冊具有實體地址，可作為聯繫及現場支付需求確認依據。");
    }

    return recommendations.join(" ");
}

async function analyzeWebsite(
    website: string,
    keyword: string,
    name: string,
    address: string,
    seed?: SeedEntry
) {
    const home = await fetchWebsite(website);
    let combinedHtml = home.html;
    let finalUrl = home.finalUrl || website;

    if (home.html) {
        const donationLinks = extractDonationLinks(home.html, finalUrl || website).slice(0, 2);

        const pages = await Promise.all(donationLinks.map((url) => fetchWebsite(url)));
        for (const page of pages) {
            if (page.html) combinedHtml += `\n${page.html}`;
        }
    }

    const text = cleanHtml(combinedHtml).slice(0, 180000);
    const donation = detectDonation(text);
    const fundraising = detectFundraising(text);
    const fullPay = detectFullPay(text);
    const categories = categoryFromText(keyword, name, text, seed);

    return {
        finalUrl: normalizeUrl(finalUrl || website) || website,
        text,
        donation,
        fundraising,
        fullPay,
        categories,
        websiteFetchSuccess: Boolean(home.html),
        fetchError: home.error,
        address,
    };
}

// ============================================================
// Result builders
// ============================================================

function emptyDonation(): DonationResult {
    return {
        online: false,
        hasOnlineDonation: false,
        recurring: false,
        hasRecurringDonation: false,
        methods: [],
        signals: [],
    };
}

function emptyFundraising(): FundraisingResult {
    return {
        hasFundraisingInfo: false,
        number: "",
        signals: [],
    };
}

function governmentEntryToBaseResult(
    entry: GovernmentEntry & { score?: number; _evidence?: string[] },
    keyword: string,
    seed?: SeedEntry
): CharityResult {
    const website = seed?.website || "";
    const categories = seed?.categories?.length
        ? seed.categories
        : categoryFromText(keyword, entry.name, "", seed);

    const donation = emptyDonation();
    const fundraising = emptyFundraising();
    const physicalStore: PhysicalResult = {
        hasPhysicalStore: Boolean(entry.address),
        signals: entry.address ? ["政府名冊地址"] : [],
    };

    const governmentScore = entry.score || 0;
    const priority = calculatePriority(donation, fundraising, website, governmentScore, false);

    return {
        success: true,
        type: "charity",
        organizationName: entry.name,
        name: entry.name,
        url: website,
        website,
        category: categories[0] || "公益組織",
        categories,
        orgType: entry.type,
        phone: seed?.phone || "",
        address: seed?.address || entry.address,
        donation,
        onlineDonation: false,
        recurringDonation: false,
        physicalStore,
        hasPhysicalStore: physicalStore.hasPhysicalStore,
        fundraising,
        fundraisingNumber: "",
        paymentScore: 0,
        physicalScore: physicalStore.hasPhysicalStore ? 10 : 0,
        confidence: Math.min(92, 48 + Math.round(governmentScore / 2) + (website ? 10 : 0)),
        priority,
        cooperation: physicalStore.hasPhysicalStore ? ["實體據點"] : [],
        recommendation: buildRecommendation(donation, fundraising, website, entry.address, false),
        evidence: uniqueStrings([
            `資料來源：${entry.source}`,
            ...(entry._evidence || []),
            entry.address ? `名冊地址：${entry.address}` : "",
        ]).slice(0, 20),
        fullPay: {
            hasFullPay: false,
            signals: [],
            excludeFromSearch: false,
        },
        governmentSource: entry.source,
        governmentMatchScore: governmentScore,
        websiteFetchSuccess: false,
    };
}

function seedOnlyBaseResult(seed: SeedEntry, keyword: string): CharityResult {
    const donation = emptyDonation();
    const fundraising = emptyFundraising();
    const physicalStore: PhysicalResult = {
        hasPhysicalStore: Boolean(seed.address),
        signals: seed.address ? ["已知聯絡地址"] : [],
    };

    return {
        success: true,
        type: "charity",
        organizationName: seed.name,
        name: seed.name,
        url: seed.website,
        website: seed.website,
        category: seed.categories[0] || getProfile(keyword)?.name || "公益組織",
        categories: seed.categories,
        orgType: "公益組織",
        phone: seed.phone || "",
        address: seed.address || "",
        donation,
        onlineDonation: false,
        recurringDonation: false,
        physicalStore,
        hasPhysicalStore: physicalStore.hasPhysicalStore,
        fundraising,
        fundraisingNumber: "",
        paymentScore: 0,
        physicalScore: physicalStore.hasPhysicalStore ? 10 : 0,
        confidence: 70,
        priority: "中",
        cooperation: [],
        recommendation: "已知公益組織官方網站，正在以官網捐款能力作為主要開發判斷。",
        evidence: ["已知公益組織官方網站"],
        fullPay: {
            hasFullPay: false,
            signals: [],
            excludeFromSearch: false,
        },
        governmentSource: "Local Verified Website Seed",
        governmentMatchScore: 50,
        websiteFetchSuccess: false,
    };
}

async function enrichResult(base: CharityResult, keyword: string, seed?: SeedEntry): Promise<CharityResult> {
    if (!base.website) return base;

    const analysis = await analyzeWebsite(
        base.website,
        keyword,
        base.organizationName,
        base.address,
        seed
    );

    const donation = analysis.donation;
    const fundraising = analysis.fundraising;
    const fullPay = analysis.fullPay;
    const physicalStore: PhysicalResult = {
        hasPhysicalStore: Boolean(base.address),
        signals: base.address ? ["政府名冊／已知地址"] : [],
    };

    const paymentScore = calculatePaymentScore(donation, fundraising);
    const priority = calculatePriority(
        donation,
        fundraising,
        analysis.finalUrl,
        base.governmentMatchScore,
        fullPay.hasFullPay
    );

    const cooperation: string[] = [];
    if (donation.online) cooperation.push("線上捐款");
    if (donation.recurring) cooperation.push("定期捐款");
    if (physicalStore.hasPhysicalStore) cooperation.push("實體據點");

    return {
        ...base,
        url: analysis.finalUrl || base.website,
        website: analysis.finalUrl || base.website,
        category: analysis.categories[0] || base.category,
        categories: analysis.categories.length > 0 ? analysis.categories : base.categories,
        donation,
        onlineDonation: donation.online,
        recurringDonation: donation.recurring,
        fundraising,
        fundraisingNumber: fundraising.number,
        fullPay,
        paymentScore,
        priority,
        cooperation,
        recommendation: buildRecommendation(
            donation,
            fundraising,
            analysis.finalUrl || base.website,
            base.address,
            fullPay.hasFullPay
        ),
        evidence: uniqueStrings([
            ...base.evidence,
            ...donation.signals,
            ...donation.methods.map((method) => `捐款方式：${method}`),
            ...fundraising.signals,
            fundraising.number ? `勸募字號：${fundraising.number}` : "",
            ...fullPay.signals.map((signal) => `全支付：${signal}`),
        ]).slice(0, 20),
        confidence: Math.min(
            98,
            base.confidence +
                (analysis.websiteFetchSuccess ? 10 : 0) +
                (donation.online ? 8 : 0) +
                (fundraising.hasFundraisingInfo ? 5 : 0)
        ),
        websiteFetchSuccess: analysis.websiteFetchSuccess,
    };
}

// ============================================================
// POST
// ============================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const keyword = String(body?.keyword || "").trim();

        if (!keyword) {
            return NextResponse.json(
                {
                    success: false,
                    error: "請輸入公益類型",
                    results: [],
                },
                { status: 400 }
            );
        }

        console.log("====================================");
        console.log("Charity Search v4");
        console.log("搜尋：", keyword);
        console.log("來源：內政部政府開放資料 + 已知官方網站 + 官網分析");
        console.log("Tavily：0");
        console.log("OpenAI：0");

        const government = await loadGovernmentEntries();
        console.log("政府名冊總數：", government.entries.length);

        const governmentCandidates = findGovernmentCandidates(government.entries, keyword);
        console.log("政府候選：", governmentCandidates.length);

        const seeds = matchingSeeds(keyword);
        console.log("已知官網 Seed：", seeds.length);

        const resultMap = new Map<string, { result: CharityResult; seed?: SeedEntry }>();

        // 1) Government roster candidates
        for (const candidate of governmentCandidates) {
            const seed = findSeedForGovernmentEntry(candidate);
            const result = governmentEntryToBaseResult(candidate, keyword, seed);
            const key = normalizeName(result.organizationName) || result.organizationName;
            resultMap.set(key, { result, seed });
        }

        // 2) Known verified websites not found in government roster result slice
        for (const seed of seeds) {
            const key = normalizeName(seed.name) || seed.name;
            const existing = resultMap.get(key);

            if (existing) {
                if (!existing.result.website) {
                    existing.result.website = seed.website;
                    existing.result.url = seed.website;
                }
                existing.seed = seed;
                continue;
            }

            resultMap.set(key, {
                result: seedOnlyBaseResult(seed, keyword),
                seed,
            });
        }

        let working = Array.from(resultMap.values());

        // Sort before website analysis so the most relevant / actionable leads get analyzed first.
        working.sort((a, b) => {
            const websiteA = a.result.website ? 20 : 0;
            const websiteB = b.result.website ? 20 : 0;
            const scoreA = a.result.governmentMatchScore + websiteA;
            const scoreB = b.result.governmentMatchScore + websiteB;
            return scoreB - scoreA;
        });

        const toAnalyze = working
            .filter((item) => Boolean(item.result.website))
            .slice(0, WEBSITE_ANALYZE_LIMIT);

        const analyzedMap = new Map<string, CharityResult>();

        for (let i = 0; i < toAnalyze.length; i += WEBSITE_BATCH_SIZE) {
            const batch = toAnalyze.slice(i, i + WEBSITE_BATCH_SIZE);
            const analyzed = await Promise.all(
                batch.map((item) => enrichResult(item.result, keyword, item.seed))
            );

            for (const item of analyzed) {
                analyzedMap.set(
                    normalizeName(item.organizationName) || item.organizationName,
                    item
                );
            }

            console.log(
                `官網分析 ${Math.min(i + WEBSITE_BATCH_SIZE, toAnalyze.length)}/${toAnalyze.length}`
            );
        }

        const finalPool = working.map(({ result }) => {
            const key = normalizeName(result.organizationName) || result.organizationName;
            return analyzedMap.get(key) || result;
        });

        finalPool.sort((a, b) => {
            const priorityScore = { 高: 40, 中: 20, 低: 0 };
            const actionA =
                priorityScore[a.priority] +
                a.paymentScore * 2 +
                (a.website ? 12 : 0) +
                Math.min(a.governmentMatchScore, 80) -
                (a.fullPay.hasFullPay ? 30 : 0);
            const actionB =
                priorityScore[b.priority] +
                b.paymentScore * 2 +
                (b.website ? 12 : 0) +
                Math.min(b.governmentMatchScore, 80) -
                (b.fullPay.hasFullPay ? 30 : 0);
            return actionB - actionA;
        });

        const finalResults = finalPool.slice(0, FINAL_LIMIT);

        console.log("最終結果：", finalResults.length);
        console.log("其中有官網：", finalResults.filter((item) => item.website).length);
        console.log("其中已分析官網：", finalResults.filter((item) => item.websiteFetchSuccess).length);
        console.log("政府資料警告：", government.warnings.length);
        console.log("====================================");

        return NextResponse.json({
            success: true,
            keyword,
            version: "charity-v4",
            searchEngine: "Government Open Data + Website Analysis",
            searchMode: "government-roster-charity-discovery",
            tavily: false,
            openAI: false,
            creditsUsed: 0,
            governmentCount: government.entries.length,
            candidateCount: governmentCandidates.length,
            seedCount: seeds.length,
            analyzedWebsiteCount: finalResults.filter((item) => item.websiteFetchSuccess).length,
            count: finalResults.length,
            warnings: government.warnings,
            results: finalResults,
        });
    } catch (error) {
        console.error("❌ Charity Search API Error：", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "公益搜尋失敗",
                results: [],
            },
            { status: 500 }
        );
    }
}
