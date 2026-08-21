import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;


type CharityGoogleSheetExportResult = {
    enabled: boolean;
    success: boolean;
    exportedCount: number;
    updatedCount?: number;
    skippedCount?: number;
    error?: string;
};

function formatTaipeiDateTime(
    date = new Date()
) {
    const parts =
        new Intl.DateTimeFormat(
            "zh-TW",
            {
                timeZone: "Asia/Taipei",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            }
        ).formatToParts(date);

    const map =
        Object.fromEntries(
            parts.map((part) => [
                part.type,
                part.value,
            ])
        );

    return (
        `${map.year}-${map.month}-${map.day} ` +
        `${map.hour}:${map.minute}:${map.second}`
    );
}

async function exportCharitiesToGoogleSheet(
    keyword: string,
    results: CharityResult[]
): Promise<CharityGoogleSheetExportResult> {
    const webhookUrl =
        String(
            process.env.GOOGLE_SHEET_WEBHOOK_URL ||
            ""
        ).trim();

    const secret =
        String(
            process.env.GOOGLE_SHEET_WEBHOOK_SECRET ||
            ""
        ).trim();

    if (!webhookUrl) {
        console.warn(
            "⚠️ Charity Google Sheet Export disabled：缺少 GOOGLE_SHEET_WEBHOOK_URL"
        );

        return {
            enabled: false,
            success: false,
            exportedCount: 0,
            error: "缺少 GOOGLE_SHEET_WEBHOOK_URL",
        };
    }

    const exportedAt =
        formatTaipeiDateTime();

    const leads = results.map(
        (item) => {
            const referenceUrl =
                item.website ||
                item.registryUrl ||
                "";

            const paymentSignals = [
                ...(item.donation?.signals || []),
                ...(item.donation?.methods || []).map(
                    (method) =>
                        `付款方式：${method}`
                ),
                ...(item.fundraising?.signals || []),
            ];

            const leadScore =
                item.paymentScore +
                item.physicalScore +
                Math.round(
                    item.confidence / 2
                );

            return {
                exportedAt,
                keyword,

                brand:
                    item.organizationName ||
                    item.name ||
                    "公益組織",

                title:
                    item.organizationName ||
                    item.name ||
                    "公益組織",

                // 沒有官網時使用衛福部名錄頁當「參考網址」，
                // 避免 Apps Script 因空 URL 而略過整筆資料。
                url: referenceUrl,

                description:
                    [
                        item.purpose,
                        item.address
                            ? `地址：${item.address}`
                            : "",
                        item.ubn
                            ? `統編：${item.ubn}`
                            : "",
                    ]
                        .filter(Boolean)
                        .join("｜"),

                platform:
                    item.website
                        ? "公益組織官網"
                        : "衛福部公益勸募名錄",

                cooperation:
                    Array.isArray(
                        item.cooperation
                    )
                        ? item.cooperation.join("、")
                        : "",

                recommendation:
                    item.recommendation || "",

                hasPhysicalStore:
                    item.hasPhysicalStore === true,

                physicalSignals:
                    item.physicalStore?.signals || [],

                merchantScore:
                    item.confidence || 0,

                paymentScore:
                    item.paymentScore || 0,

                physicalScore:
                    item.physicalScore || 0,

                relevanceScore:
                    item.confidence || 0,

                industryScore:
                    item.confidence || 0,

                leadScore,

                industryTier:
                    item.priority || "",

                hasPaymentNeed:
                    Boolean(
                        item.donation?.online ||
                        item.donation?.recurring ||
                        item.fundraising
                            ?.hasFundraisingInfo
                    ),

                merchantSignals:
                    item.evidence || [],

                paymentSignals,

                industrySignals:
                    item.categories || [],
            };
        }
    );

    try {
        const response =
            await fetch(
                webhookUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body:
                        JSON.stringify({
                            secret,
                            source:
                                "PayLead Finder Charity",
                            sourceType:
                                "charity",
                            destination:
                                "charity",
                            version:
                                "charity-v3.3-prod-safe",
                            keyword,
                            exportedAt,
                            leads,
                        }),
                    cache: "no-store",
                    signal:
                        AbortSignal.timeout(
                            6000
                        ),
                }
            );

        const responseText =
            await response.text();

        let data: any = {};

        try {
            data =
                JSON.parse(
                    responseText
                );
        } catch {
            data = {};
        }

        if (
            !response.ok ||
            data?.success === false
        ) {
            throw new Error(
                String(
                    data?.error ||
                    `Google Sheet HTTP ${response.status}`
                )
            );
        }

        const result = {
            enabled: true,
            success: true,
            exportedCount:
                Number(
                    data?.exportedCount || 0
                ),
            updatedCount:
                Number(
                    data?.updatedCount || 0
                ),
            skippedCount:
                Number(
                    data?.skippedCount || 0
                ),
        };

        console.log(
            "✅ Charity Google Sheet Export：",
            `新增 ${result.exportedCount} / 更新 ${result.updatedCount} / 略過 ${result.skippedCount}`
        );

        return result;
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Google Sheet export failed";

        console.warn(
            "⚠️ Charity Google Sheet Export failed：",
            message
        );

        return {
            enabled: true,
            success: false,
            exportedCount: 0,
            error: message,
        };
    }
}

// ============================================================
// Charity Search v3.1
// Official registry discovery + website donation analysis
//
// No Tavily
// No OpenAI
// No Bing / Google / DuckDuckGo scraping
//
// Source of truth for discovery:
// 衛福部公益勸募管理系統 - 勸募團體名錄
// ============================================================

type CharityCategory = {
    name: string;
    triggers: string[];
    registryTerms: string[];
};

type RegistryCandidate = {
    id: string;
    organizationName: string;
    detailUrl: string;
};

type RegistryDetail = RegistryCandidate & {
    website: string;
    ubn: string;
    orgType: string;
    phone: string;
    address: string;
    purpose: string;
};

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
    signals: string[];
    number?: string;
};

type CharityResult = {
    success: true;
    type: "charity";
    organizationName: string;
    name: string;
    url: string;
    website: string;
    registryUrl: string;
    ubn: string;
    orgType: string;
    phone: string;
    address: string;
    purpose: string;
    categories: string[];
    category: string;
    donation: DonationResult;
    onlineDonation: boolean;
    recurringDonation: boolean;
    physicalStore: PhysicalResult;
    hasPhysicalStore: boolean;
    fundraising: FundraisingResult;
    fundraisingNumber: string;
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
    priority: "高" | "中" | "低";
    websiteFetchSuccess: boolean;
};

// ============================================================
// Tunables
// ============================================================

const REGISTRY_BASE = "https://sasw.mohw.gov.tw";
const REGISTRY_LIST_PATH = "/app39/fundgroup/fundgroupIndex";
const REGISTRY_DETAIL_PATH = "/app39/fundgroup/fundgroupDetails";

const MAX_REGISTRY_TERMS = 4;
const MAX_REGISTRY_CANDIDATES = 28;
const MAX_RESULTS = 20;
const DETAIL_BATCH_SIZE = 10;
const WEBSITE_BATCH_SIZE = 8;
const FETCH_TIMEOUT_MS = 7000;
const REGISTRY_CACHE_TTL = 6 * 60 * 60 * 1000;
const DETAIL_CACHE_TTL = 12 * 60 * 60 * 1000;
const WEBSITE_CACHE_TTL = 30 * 60 * 1000;

// ============================================================
// Categories / query expansion
// ============================================================

const charityCategories: CharityCategory[] = [
    {
        name: "動物／流浪動物",
        triggers: ["動物", "流浪動物", "動保", "寵物", "犬", "狗", "貓", "animal", "pet"],
        registryTerms: ["動物", "動保", "流浪動物", "犬", "貓", "愛護動物"],
    },
    {
        name: "失智／認知障礙",
        triggers: ["失智", "認知障礙", "阿茲海默", "失智症", "dementia", "alzheimer"],
        registryTerms: ["失智", "阿茲海默", "認知", "老人", "長照"],
    },
    {
        name: "長者／老人福利",
        triggers: ["老人", "長者", "高齡", "銀髮", "老人福利", "長輩", "長照", "elderly", "senior"],
        registryTerms: ["老人", "長者", "高齡", "銀髮", "長照", "老人福利"],
    },
    {
        name: "兒童／青少年",
        triggers: ["兒童", "孩童", "青少年", "少年", "兒少", "弱勢兒童", "兒童福利", "child", "youth"],
        registryTerms: ["兒童", "兒少", "少年", "青少年", "育幼", "兒童福利"],
    },
    {
        name: "身心障礙",
        triggers: ["身心障礙", "身障", "障礙", "智能障礙", "視障", "聽障", "肢體障礙", "disability"],
        registryTerms: ["身心障礙", "身障", "智能障礙", "視障", "聽障", "障礙"],
    },
    {
        name: "醫療／疾病",
        triggers: ["醫療", "疾病", "癌症", "罕見疾病", "病友", "醫院", "健康", "醫學", "medical", "cancer"],
        registryTerms: ["癌症", "病友", "罕見疾病", "醫療", "健康", "醫學"],
    },
    {
        name: "教育",
        triggers: ["教育", "助學", "獎學金", "學童", "學生", "偏鄉教育", "教育基金", "education", "scholarship"],
        registryTerms: ["教育", "助學", "獎學", "學童", "學生", "偏鄉"],
    },
    {
        name: "環境／生態",
        triggers: ["環境", "生態", "保育", "自然", "海洋", "森林", "氣候", "環保", "environment", "ecology"],
        registryTerms: ["環境", "生態", "保育", "海洋", "森林", "環保"],
    },
    {
        name: "婦女／家庭",
        triggers: ["婦女", "女性", "家庭", "單親", "家暴", "性別", "women", "family"],
        registryTerms: ["婦女", "女性", "家庭", "單親", "家暴", "性別"],
    },
    {
        name: "心理健康",
        triggers: ["心理", "心理健康", "心理支持", "心理諮商", "精神健康", "mental"],
        registryTerms: ["心理", "精神", "心理健康", "諮商"],
    },
    {
        name: "災害救助",
        triggers: ["災害", "救災", "災民", "賑災", "地震", "颱風", "水災", "disaster", "relief"],
        registryTerms: ["救災", "賑災", "災害", "救援", "慈善"],
    },
    {
        name: "國際援助",
        triggers: ["國際援助", "海外援助", "國際救援", "難民", "人道援助", "humanitarian", "refugee"],
        registryTerms: ["國際", "救援", "人道", "援助", "難民"],
    },
    {
        name: "社會福利",
        triggers: ["社會福利", "弱勢", "社福", "貧困", "弱勢家庭", "社會救助", "公益", "慈善", "公益團體", "公益組織", "非營利", "npo", "ngo"],
        registryTerms: ["慈善", "社會福利", "弱勢", "社福", "公益", "關懷"],
    },
];

const broadKeywords = [
    "公益團體",
    "公益組織",
    "非營利組織",
    "非營利",
    "npo",
    "ngo",
    "公益募款",
    "線上捐款",
    "基金會",
    "協會",
    "慈善機構",
    "社福機構",
];

// Registry fallback only. These are not the main search source.
const fallbackSeeds = [
    { name: "財團法人台灣兒童暨家庭扶助基金會", url: "https://www.ccf.org.tw", categories: ["兒童／青少年", "社會福利"] },
    { name: "財團法人台灣世界展望會", url: "https://www.worldvision.org.tw", categories: ["兒童／青少年", "國際援助"] },
    { name: "財團法人伊甸社會福利基金會", url: "https://www.eden.org.tw", categories: ["身心障礙", "社會福利"] },
    { name: "財團法人陽光社會福利基金會", url: "https://www.sunshine.org.tw", categories: ["身心障礙", "社會福利"] },
    { name: "財團法人董氏基金會", url: "https://www.jtf.org.tw", categories: ["醫療／疾病", "心理健康"] },
    { name: "財團法人癌症希望基金會", url: "https://www.ecancer.org.tw", categories: ["醫療／疾病"] },
    { name: "財團法人中華民國兒童癌症基金會", url: "https://www.ccfroc.org.tw", categories: ["兒童／青少年", "醫療／疾病"] },
    { name: "社團法人中華民國喜願協會", url: "https://www.makeawish.org.tw", categories: ["兒童／青少年", "醫療／疾病"] },
    { name: "財團法人台灣失智症協會", url: "https://www.tada2002.org.tw", categories: ["失智／認知障礙", "長者／老人福利"] },
    { name: "財團法人老五老基金會", url: "https://www.ofo.org.tw", categories: ["長者／老人福利"] },
    { name: "財團法人弘道老人福利基金會", url: "https://www.hondao.org.tw", categories: ["長者／老人福利"] },
    { name: "社團法人台灣之心愛護動物協會", url: "https://www.hotac.org.tw", categories: ["動物／流浪動物"] },
    { name: "社團法人台灣防止虐待動物協會", url: "https://www.spca.org.tw", categories: ["動物／流浪動物"] },
    { name: "社團法人中華民國保護動物協會", url: "https://www.apatw.org", categories: ["動物／流浪動物"] },
    { name: "財團法人環境品質文教基金會", url: "https://www.eqpf.org", categories: ["環境／生態", "教育"] },
    { name: "財團法人婦女權益促進發展基金會", url: "https://www.wrp.org.tw", categories: ["婦女／家庭"] },
];

// ============================================================
// Cache
// ============================================================

const registrySearchCache = new Map<string, { timestamp: number; results: RegistryCandidate[] }>();
const registryDetailCache = new Map<string, { timestamp: number; result: RegistryDetail }>();
const websiteCache = new Map<string, { timestamp: number; html: string }>();

// ============================================================
// Helpers
// ============================================================

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

function cleanText(value: string) {
    return cleanHtml(String(value || ""));
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUrl(rawUrl: string) {
    let value = decodeHtml(String(rawUrl || "")).trim();

    if (!value) return "";

    try {
        value = decodeURIComponent(value);
    } catch {}

    value = value.replace(/^['"]+|['"]+$/g, "").trim();

    if (/^(javascript:|mailto:|tel:|data:|#)/i.test(value)) {
        return "";
    }

    if (value.startsWith("//")) {
        value = `https:${value}`;
    }

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

function normalizeRegistryUrl(rawUrl: string) {
    if (!rawUrl) return "";

    try {
        return new URL(decodeHtml(rawUrl), REGISTRY_BASE).toString();
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

function extractBetweenLabels(text: string, label: string, stopLabels: string[]) {
    const lower = text.toLowerCase();
    const labelLower = label.toLowerCase();
    const startIndex = lower.indexOf(labelLower);

    if (startIndex < 0) return "";

    const start = startIndex + label.length;
    let end = Math.min(text.length, start + 350);

    for (const stopLabel of stopLabels) {
        const stopIndex = lower.indexOf(stopLabel.toLowerCase(), start);
        if (stopIndex >= start && stopIndex < end) {
            end = stopIndex;
        }
    }

    return text
        .slice(start, end)
        .replace(/^[\s：:：;；,，。|｜-]+/, "")
        .replace(/[\s|｜]+$/g, "")
        .trim();
}

function unwrapExternalHref(rawHref: string) {
    const absolute = normalizeRegistryUrl(rawHref);
    if (!absolute) return "";

    try {
        const parsed = new URL(absolute);

        if (!parsed.hostname.endsWith("mohw.gov.tw")) {
            return normalizeUrl(absolute);
        }

        for (const key of ["url", "target", "redirect", "href", "website"]) {
            const nested = parsed.searchParams.get(key);
            if (nested) {
                const normalized = normalizeUrl(nested);
                if (normalized && !getHostname(normalized).endsWith("mohw.gov.tw")) {
                    return normalized;
                }
            }
        }
    } catch {}

    return "";
}

function isUsableOrganizationWebsite(rawUrl: string) {
    const url = normalizeUrl(unwrapExternalHref(rawUrl));
    const host = getHostname(url);

    if (!url || !host) return "";

    const blockedHosts = [
        "mohw.gov.tw",
        "gov.tw",
        "facebook.com",
        "instagram.com",
        "youtube.com",
        "line.me",
    ];

    if (
        blockedHosts.some(
            (blocked) =>
                host === blocked ||
                host.endsWith(`.${blocked}`)
        )
    ) {
        return "";
    }

    return url;
}

function extractExternalWebsite(html: string) {
    const decoded = decodeHtml(String(html || ""));
    const labelIndex = decoded.indexOf("團體網址");

    // 優先只看「團體網址」附近，避免誤抓頁尾或其他外部連結。
    const focusedSegments =
        labelIndex >= 0
            ? [
                  decoded.slice(
                      labelIndex,
                      labelIndex + 3500
                  ),
              ]
            : [];

    const segments = [
        ...focusedSegments,
        decoded,
    ];

    for (const segment of segments) {
        // 1. 一般 <a href="..."> 官網連結
        const hrefRegex =
            /href\s*=\s*["']([^"']+)["']/gi;

        let hrefMatch:
            RegExpExecArray | null;

        while (
            (hrefMatch =
                hrefRegex.exec(segment)) !==
            null
        ) {
            const website =
                isUsableOrganizationWebsite(
                    hrefMatch[1]
                );

            if (website) {
                return website;
            }
        }

        // 2. 網址直接以純文字顯示，例如：
        //    https://www.example.org.tw
        //    www.example.org.tw
        const textUrlRegex =
            /\b(?:https?:\/\/|www\.)[^\s<>"'，。、；;）)]+/gi;

        let textMatch:
            RegExpExecArray | null;

        while (
            (textMatch =
                textUrlRegex.exec(segment)) !==
            null
        ) {
            let candidate =
                textMatch[0]
                    .replace(
                        /[.,，。;；:：]+$/,
                        ""
                    )
                    .trim();

            if (
                candidate
                    .toLowerCase()
                    .startsWith("www.")
            ) {
                candidate =
                    `https://${candidate}`;
            }

            const website =
                isUsableOrganizationWebsite(
                    candidate
                );

            if (website) {
                return website;
            }
        }
    }

    return "";
}

function getMatchingCategory(keyword: string) {
    const lower = keyword.toLowerCase();

    let best: CharityCategory | null = null;
    let bestScore = 0;

    for (const category of charityCategories) {
        const score = category.triggers.reduce((sum, trigger) => {
            const t = trigger.toLowerCase();
            if (lower.includes(t)) return sum + Math.max(2, t.length);
            if (t.includes(lower) && lower.length >= 2) return sum + 2;
            return sum;
        }, 0);

        if (score > bestScore) {
            best = category;
            bestScore = score;
        }
    }

    return best;
}

function getRegistryTerms(keyword: string) {
    const normalized = keyword.trim();
    const category = getMatchingCategory(normalized);
    const isBroad = broadKeywords.some((item) => normalized.toLowerCase().includes(item.toLowerCase()));

    if (category && !isBroad) {
        return uniqueStrings([
            normalized,
            ...category.registryTerms,
        ]).slice(0, MAX_REGISTRY_TERMS);
    }

    if (isBroad) {
        return ["慈善", "社會福利", "弱勢", "關懷", "公益", "基金會"];
    }

    return uniqueStrings([normalized, ...(category?.registryTerms || [])]).slice(0, MAX_REGISTRY_TERMS);
}

function detectCategories(text: string, preferredKeyword = "") {
    const combined = `${preferredKeyword} ${text}`.toLowerCase();
    const scores = charityCategories
        .map((category) => {
            const hits = category.triggers.filter((trigger) => combined.includes(trigger.toLowerCase()));
            return {
                name: category.name,
                score: hits.reduce((sum, hit) => sum + Math.max(1, hit.length >= 4 ? 3 : 1), 0),
            };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

    return scores.slice(0, 3).map((item) => item.name);
}

// ============================================================
// Fetch
// ============================================================

async function fetchHtml(url: string, timeoutMs = FETCH_TIMEOUT_MS) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
            },
            redirect: "follow",
            cache: "no-store",
            signal: AbortSignal.timeout(timeoutMs),
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

// ============================================================
// Official MOHW registry
// ============================================================

function parseRegistryList(html: string) {
    const results: RegistryCandidate[] = [];
    const seen = new Set<string>();

    const anchorRegex = /<a[^>]+href=["']([^"']*fundgroupDetails\/(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = anchorRegex.exec(html)) !== null) {
        const id = match[2];
        const organizationName = cleanText(match[3]);

        if (!id || !organizationName || organizationName.length < 2 || seen.has(id)) {
            continue;
        }

        seen.add(id);
        results.push({
            id,
            organizationName,
            detailUrl: `${REGISTRY_BASE}${REGISTRY_DETAIL_PATH}/${id}`,
        });
    }

    return results;
}

async function searchRegistryByName(term: string, offset = 0) {
    const cacheKey = `${term}::${offset}`;
    const cached = registrySearchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < REGISTRY_CACHE_TTL) {
        return cached.results;
    }

    const params = new URLSearchParams({
        max: "50",
        offset: String(offset),
        qdisplayName: term,
        qorgtype: "",
        qpurpose: "",
        qubno: "",
    });

    const url = `${REGISTRY_BASE}${REGISTRY_LIST_PATH}?${params.toString()}`;
    const response = await fetchHtml(url, 15000);

    if (!response.html) {
        console.log("⚠️ 衛福部名錄查詢失敗：", term, response.error);
        return [];
    }

    const results = parseRegistryList(response.html);

    if (results.length > 0) {
        registrySearchCache.set(cacheKey, {
            timestamp: Date.now(),
            results,
        });
    }

    return results;
}

async function discoverRegistryCandidates(keyword: string) {
    const terms = getRegistryTerms(keyword);
    const candidateMap = new Map<string, RegistryCandidate>();

    for (const term of terms) {
        const results = await searchRegistryByName(term, 0);

        for (const result of results) {
            if (!candidateMap.has(result.id)) {
                candidateMap.set(result.id, result);
            }
        }

        if (candidateMap.size >= MAX_REGISTRY_CANDIDATES) {
            break;
        }
    }

    // Very broad search: if keyword terms returned too few, sample the official registry itself.
    const isBroad = broadKeywords.some((item) => keyword.toLowerCase().includes(item.toLowerCase()));

    if (isBroad && candidateMap.size < 30) {
        for (const offset of [0, 50, 100]) {
            const results = await searchRegistryByName("", offset);
            for (const result of results) {
                if (!candidateMap.has(result.id)) {
                    candidateMap.set(result.id, result);
                }
            }
            if (candidateMap.size >= MAX_REGISTRY_CANDIDATES) break;
        }
    }

    return Array.from(candidateMap.values()).slice(0, MAX_REGISTRY_CANDIDATES);
}

async function fetchRegistryDetail(candidate: RegistryCandidate): Promise<RegistryDetail | null> {
    const cached = registryDetailCache.get(candidate.id);

    if (cached && Date.now() - cached.timestamp < DETAIL_CACHE_TTL) {
        return cached.result;
    }

    const response = await fetchHtml(candidate.detailUrl, 15000);
    if (!response.html) return null;

    const html = response.html;
    const text = cleanHtml(html);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1]
        ? cleanText(titleMatch[1]).replace(/\s*[|｜].*$/, "").trim()
        : "";

    const organizationName =
        title && !title.includes("公益勸募管理系統")
            ? title
            : candidate.organizationName;

    const stopLabels = [
        "團體類型",
        "團體電話",
        "團體網址",
        "團體登記地址",
        "團體聯絡地址",
        "勸募用途",
        "裁處資訊",
        "年度查核",
        "統計資訊",
    ];

    const ubn = extractBetweenLabels(text, "統一編號", stopLabels);
    const orgType = extractBetweenLabels(text, "團體類型", stopLabels);
    const phone = extractBetweenLabels(text, "團體電話", stopLabels);
    const registrationAddress = extractBetweenLabels(text, "團體登記地址", stopLabels);
    const contactAddress = extractBetweenLabels(text, "團體聯絡地址", stopLabels);
    const purpose = extractBetweenLabels(text, "勸募用途", stopLabels);
    const website = extractExternalWebsite(html);

    const result: RegistryDetail = {
        ...candidate,
        organizationName: organizationName || candidate.organizationName,
        website,
        ubn,
        orgType,
        phone,
        address: contactAddress || registrationAddress,
        purpose,
    };

    registryDetailCache.set(candidate.id, {
        timestamp: Date.now(),
        result,
    });

    return result;
}

// ============================================================
// Website analysis
// ============================================================

async function fetchWebsiteCached(url: string) {
    const normalized = normalizeUrl(url);
    if (!normalized) return { html: "", finalUrl: "", error: "invalid url" };

    const cached = websiteCache.get(normalized);
    if (cached && cached.html && Date.now() - cached.timestamp < WEBSITE_CACHE_TTL) {
        return { html: cached.html, finalUrl: normalized, error: "" };
    }

    const response = await fetchHtml(normalized, 6500);

    if (response.html) {
        websiteCache.set(normalized, {
            timestamp: Date.now(),
            html: response.html,
        });
    }

    return response;
}

function extractDonationLinks(html: string, baseUrl: string) {
    const links: string[] = [];
    const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
        const href = decodeHtml(match[1]);
        const label = cleanText(match[2]).toLowerCase();
        const combined = `${href} ${label}`.toLowerCase();

        if (!/(捐款|捐贈|支持我們|donat|giving|give|support)/i.test(combined)) {
            continue;
        }

        try {
            const absolute = new URL(href, baseUrl).toString();
            if (getHostname(absolute) !== getHostname(baseUrl)) continue;
            const normalized = normalizeUrl(absolute);
            if (normalized && !links.includes(normalized)) links.push(normalized);
        } catch {}

        if (links.length >= 1) break;
    }

    return links;
}

function detectDonation(text: string): DonationResult {
    const lower = text.toLowerCase();

    const donationSignals = findSignals(lower, [
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

    const recurringSignals = findSignals(lower, [
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

function detectPhysicalStore(text: string, registryAddress: string): PhysicalResult {
    const signals = findSignals(text, [
        "服務據點",
        "服務中心",
        "服務站",
        "服務處",
        "辦事處",
        "分會",
        "分院",
        "院區",
        "中心",
        "據點",
        "聯絡地址",
        "服務地址",
        "contact us",
        "location",
        "office",
        "branch",
    ]);

    if (registryAddress) {
        signals.unshift("衛福部登記／聯絡地址");
    }

    return {
        hasPhysicalStore: signals.length > 0,
        signals: uniqueStrings(signals).slice(0, 10),
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

    const numberPatterns = [
        /衛部救字第[^\s，。,、；;]{2,40}/i,
        /衛授救字第[^\s，。,、；;]{2,40}/i,
        /府社字第[^\s，。,、；;]{2,40}/i,
        /勸募許可字號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
        /勸募字號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
        /勸募文號[：:\s]*[A-Za-z0-9\u4e00-\u9fff\-\/]{3,50}/i,
    ];

    let number = "";
    for (const pattern of numberPatterns) {
        const match = text.match(pattern);
        if (match?.[0]) {
            number = match[0].replace(/\s+/g, " ").trim();
            break;
        }
    }

    return {
        hasFundraisingInfo: Boolean(number) || signals.length > 0,
        signals: signals.slice(0, 10),
        number,
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
    };
}

function calculatePaymentScore(donation: DonationResult, fundraising: FundraisingResult) {
    let score = 0;
    if (donation.online) score += 12;
    if (donation.recurring) score += 8;
    if (donation.methods.includes("信用卡")) score += 4;
    if (donation.methods.some((method) => ["LINE Pay", "街口支付", "Apple Pay", "全支付"].includes(method))) score += 3;
    if (fundraising.hasFundraisingInfo) score += 3;
    return Math.min(30, score);
}

function buildRecommendation(
    donation: DonationResult,
    physical: PhysicalResult,
    fundraising: FundraisingResult,
    fullPay: { hasFullPay: boolean; signals: string[] }
) {
    if (fullPay.hasFullPay) {
        return "官網已偵測到全支付相關資訊，建議先確認既有合作狀態，避免重複開發。";
    }

    const parts: string[] = [];

    if (donation.online) {
        parts.push("已有線上捐款流程，可優先洽談 EC／APP 捐款金流合作。");
    }

    if (donation.recurring) {
        parts.push("具有定期捐款需求，可進一步評估定期扣款合作。");
    }

    if (physical.hasPhysicalStore) {
        parts.push("具有正式登記或服務據點，可進一步確認現場收款／POS需求。");
    }

    if (fundraising.hasFundraisingInfo) {
        parts.push("具公益勸募資訊，可確認 APP 捐款專區合作資格。");
    }

    return parts.length > 0
        ? parts.join(" ")
        : "已確認為衛福部公益勸募名錄團體，可進一步確認官網捐款、定期捐款與收款流程。";
}

async function analyzeRegisteredCharity(detail: RegistryDetail, keyword: string): Promise<CharityResult> {
    let combinedText = `${detail.organizationName} ${detail.orgType} ${detail.purpose} ${detail.address}`;
    let websiteFetchSuccess = false;
    let website = normalizeUrl(detail.website);

    if (website) {
        const home = await fetchWebsiteCached(website);

        if (home.html) {
            websiteFetchSuccess = true;
            website = normalizeUrl(home.finalUrl) || website;
            combinedText += ` ${cleanHtml(home.html)}`;

            const donationLinks = extractDonationLinks(home.html, website);
            const extraPages = await Promise.all(
                donationLinks.map((link) => fetchWebsiteCached(link))
            );

            for (const page of extraPages) {
                if (page.html) {
                    combinedText += ` ${cleanHtml(page.html)}`;
                }
            }
        }
    }

    const categories = detectCategories(combinedText, keyword);
    const donation = detectDonation(combinedText);
    const physicalStore = detectPhysicalStore(combinedText, detail.address);
    const fundraising = detectFundraising(combinedText);
    const fullPay = detectFullPay(combinedText);
    const paymentScore = calculatePaymentScore(donation, fundraising);
    const physicalScore = physicalStore.hasPhysicalStore ? 10 : 0;

    let confidence = 62; // official registry verified
    if (categories.length > 0) confidence += 10;
    if (website) confidence += 8;
    if (websiteFetchSuccess) confidence += 5;
    if (donation.online) confidence += 8;
    if (fundraising.hasFundraisingInfo) confidence += 5;
    confidence = Math.min(98, confidence);

    const cooperation: string[] = [];
    if (donation.online) cooperation.push("線上捐款");
    if (donation.recurring) cooperation.push("定期捐款");
    if (physicalStore.hasPhysicalStore) cooperation.push("實體據點");

    const priority: "高" | "中" | "低" =
        donation.online && donation.recurring
            ? "高"
            : donation.online || physicalStore.hasPhysicalStore
                ? "中"
                : "低";

    const evidence = uniqueStrings([
        "衛福部公益勸募團體名錄",
        detail.orgType ? `團體類型：${detail.orgType}` : "",
        detail.purpose ? `勸募用途：${detail.purpose}` : "",
        categories.length > 0 ? `公益分類：${categories.join("、")}` : "",
        ...donation.signals.map((signal) => `捐款：${signal}`),
        ...donation.methods.map((method) => `付款方式：${method}`),
        ...physicalStore.signals.map((signal) => `據點：${signal}`),
        ...fundraising.signals.map((signal) => `勸募：${signal}`),
        ...fullPay.signals.map((signal) => `全支付：${signal}`),
    ]).slice(0, 20);

    return {
        success: true,
        type: "charity",
        organizationName: detail.organizationName,
        name: detail.organizationName,
        url: website,
        website,
        registryUrl: detail.detailUrl,
        ubn: detail.ubn,
        orgType: detail.orgType,
        phone: detail.phone,
        address: detail.address,
        purpose: detail.purpose,
        categories: categories.length > 0 ? categories : ["公益組織"],
        category: categories[0] || "公益組織",
        donation,
        onlineDonation: donation.online,
        recurringDonation: donation.recurring,
        physicalStore,
        hasPhysicalStore: physicalStore.hasPhysicalStore,
        fundraising,
        fundraisingNumber: fundraising.number || "",
        fullPay,
        paymentScore,
        physicalScore,
        confidence,
        cooperation,
        recommendation: buildRecommendation(donation, physicalStore, fundraising, fullPay),
        evidence,
        priority,
        websiteFetchSuccess,
    };
}

function buildFallbackResults(keyword: string): RegistryDetail[] {
    const category = getMatchingCategory(keyword);
    const isBroad = broadKeywords.some((item) => keyword.toLowerCase().includes(item.toLowerCase()));

    return fallbackSeeds
        .filter((seed) => {
            if (isBroad) return true;
            if (!category) {
                return `${seed.name} ${seed.categories.join(" ")}`.toLowerCase().includes(keyword.toLowerCase());
            }
            return seed.categories.includes(category.name);
        })
        .map((seed, index) => ({
            id: `seed-${index}`,
            organizationName: seed.name,
            detailUrl: "",
            website: seed.url,
            ubn: "",
            orgType: "",
            phone: "",
            address: "",
            purpose: seed.categories.join("、"),
        }));
}

// ============================================================
// POST
// ============================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
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
        console.log("Charity Search v3.3 Prod Safe");
        console.log("搜尋：", keyword);
        console.log("來源：衛福部公益勸募管理系統 + 官網分析");
        console.log("Tavily：0");
        console.log("OpenAI：0");

        const registryCandidates = await discoverRegistryCandidates(keyword);
        console.log("官方名錄候選：", registryCandidates.length);

        const details: RegistryDetail[] = [];

        for (let i = 0; i < registryCandidates.length; i += DETAIL_BATCH_SIZE) {
            const batch = registryCandidates.slice(i, i + DETAIL_BATCH_SIZE);
            const resolved = await Promise.all(batch.map((candidate) => fetchRegistryDetail(candidate)));
            details.push(...resolved.filter((item): item is RegistryDetail => Boolean(item)));

            if (details.length >= MAX_REGISTRY_CANDIDATES) break;
        }

        let workingDetails = details;
        let source = "MOHW Registry";

        if (workingDetails.length === 0) {
            workingDetails = buildFallbackResults(keyword);
            source = "Local Fallback Seeds";
            console.log("⚠️ 官方名錄暫時無法取得，使用本地 fallback：", workingDetails.length);
        }

        const analyzed: CharityResult[] = [];

        for (let i = 0; i < workingDetails.length; i += WEBSITE_BATCH_SIZE) {
            const batch = workingDetails.slice(i, i + WEBSITE_BATCH_SIZE);
            const results = await Promise.all(
                batch.map((detail) => analyzeRegisteredCharity(detail, keyword))
            );

            analyzed.push(...results);

            if (analyzed.length >= MAX_RESULTS + 6) break;
        }

        const category = getMatchingCategory(keyword);
        const isBroad = broadKeywords.some((item) => keyword.toLowerCase().includes(item.toLowerCase()));

        let filtered = analyzed.filter((item) => {
            if (isBroad || !category) return true;

            const haystack = `${item.organizationName} ${item.categories.join(" ")} ${item.purpose}`.toLowerCase();
            return (
                item.categories.includes(category.name) ||
                category.registryTerms.some((term) => haystack.includes(term.toLowerCase())) ||
                category.triggers.some((term) => haystack.includes(term.toLowerCase()))
            );
        });

        // If the post-analysis filter became too strict, keep official-registry matches instead of returning almost nothing.
        if (filtered.length < Math.min(8, analyzed.length)) {
            filtered = analyzed;
        }

        const unique = new Map<string, CharityResult>();
        for (const item of filtered) {
            const key = item.ubn || getHostname(item.website) || item.organizationName;
            const existing = unique.get(key);
            if (!existing || item.paymentScore + item.confidence > existing.paymentScore + existing.confidence) {
                unique.set(key, item);
            }
        }

        const finalResults = Array.from(unique.values())
            .sort((a, b) => {
                const fullPayPenaltyA = a.fullPay.hasFullPay ? 20 : 0;
                const fullPayPenaltyB = b.fullPay.hasFullPay ? 20 : 0;
                const priorityScore = { 高: 30, 中: 15, 低: 0 };

                const scoreA = priorityScore[a.priority] + a.paymentScore + a.physicalScore + a.confidence - fullPayPenaltyA;
                const scoreB = priorityScore[b.priority] + b.paymentScore + b.physicalScore + b.confidence - fullPayPenaltyB;
                return scoreB - scoreA;
            })
            .slice(0, MAX_RESULTS);

        console.log("詳細資料：", details.length);
        console.log("分析完成：", analyzed.length);
        console.log("最終結果：", finalResults.length);
        console.log("資料來源：", source);

        const googleSheetExport =
            await exportCharitiesToGoogleSheet(
                keyword,
                finalResults
            );

        console.log("====================================");

        return NextResponse.json({
            success: true,
            keyword,
            version: "charity-v3.3-prod-safe",
            searchEngine: "MOHW Registry",
            source,
            tavily: false,
            openAI: false,
            queryTerms: getRegistryTerms(keyword),
            registryCandidateCount: registryCandidates.length,
            analyzedCount: analyzed.length,
            count: finalResults.length,
            googleSheetExport,
            results: finalResults,
        });
    } catch (error) {
        console.error("❌ Charity Search API Error:", error);

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
