"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

type AnalysisResult = {
    success?: boolean;

    title?: string;
    url?: string;
    description?: string;

    brand?: string;

    platform?: string;
    confidence?: number;

    cooperation?: string;
    recommendation?: string;

    paymentScore?: number;
    paymentSignals?: string[];

    physicalScore?: number;

    physicalStore?: {
        hasPhysicalStore?: boolean;
        signals?: string[];
    };

    merchantScore?: number;
    leadScore?: number;

    merchantSignals?: string[];
    industrySignals?: string[];
    contentSignals?: string[];

    hasPaymentNeed?: boolean;

    evidence?: string[];
};

type IndustrySuggestion = {
    name: string;
};

export default function GeneralMerchant() {
    const [mode, setMode] =
        useState<"search" | "analyze">(
            "search"
        );

    const [keyword, setKeyword] =
        useState("");

    const [url, setUrl] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [aiLoading, setAiLoading] =
        useState(false);

    const [results, setResults] =
        useState<AnalysisResult[]>([]);

    const [error, setError] =
        useState("");

    // =========================================================
    // AI 產業建議
    // =========================================================

    const [
        industrySuggestions,
        setIndustrySuggestions,
    ] = useState<IndustrySuggestion[]>(
        []
    );

    // =========================================================
    // 篩選
    // =========================================================

    const [
        platformFilter,
        setPlatformFilter,
    ] = useState("全部");

    const [ecFilter, setEcFilter] =
        useState("全部");

    const [posFilter, setPosFilter] =
        useState("全部");

    // =========================================================
    // 取得 AI 產業建議
    // =========================================================

    async function getIndustrySuggestions() {
        try {
            setAiLoading(true);

            const response =
                await fetch(
                    "/api/industry-suggestions",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "取得產業建議失敗"
                );
            }

            const data =
                await response.json();

            if (
                data.success &&
                Array.isArray(
                    data.suggestions
                )
            ) {
                const suggestions =
                    data.suggestions
                        .map(
                            (item: any) => {
                                if (
                                    typeof item ===
                                    "string"
                                ) {
                                    return {
                                        name: item,
                                    };
                                }

                                return {
                                    name:
                                        item?.name ||
                                        "",
                                };
                            }
                        )
                        .filter(
                            (
                                item: IndustrySuggestion
                            ) =>
                                item.name
                        );

                setIndustrySuggestions(
                    suggestions
                );
            }
        } catch (error) {
            console.error(
                "取得 AI 產業建議失敗：",
                error
            );
        } finally {
            setAiLoading(false);
        }
    }

    // =========================================================
    // 頁面載入時取得產業建議
    // =========================================================

    useEffect(() => {
        getIndustrySuggestions();
    }, []);

    // =========================================================
    // 搜尋商戶
    // =========================================================

    async function searchMerchants(
        customKeyword?: string
    ) {
        const searchKeyword =
            (
                customKeyword ||
                keyword
            ).trim();

        if (!searchKeyword) {
            setError(
                "請輸入產業關鍵字"
            );
            return;
        }

        setKeyword(searchKeyword);

        setLoading(true);
        setError("");
        setResults([]);

        setPlatformFilter("全部");
        setEcFilter("全部");
        setPosFilter("全部");

        try {
            const response =
                await fetch(
                    "/api/search",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            keyword:
                                searchKeyword,
                        }),
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                data.success === false
            ) {
                throw new Error(
                    data.error ||
                        "搜尋失敗"
                );
            }

            const searchResults =
                Array.isArray(
                    data.results
                )
                    ? data.results
                    : [];

            setResults(
                searchResults
            );
        } catch (error) {
            console.error(
                "搜尋失敗：",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "搜尋發生錯誤"
            );
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // 點擊產業建議
    // =========================================================

    function selectIndustry(
        industry: string
    ) {
        setKeyword(industry);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    // =========================================================
    // 單一網站分析
    // =========================================================

    async function analyzeWebsite() {
        if (!url.trim()) {
            setError(
                "請輸入網站網址"
            );
            return;
        }

        setLoading(true);
        setError("");
        setResults([]);

        try {
            const response =
                await fetch(
                    "/api/analyze",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            url:
                                url.trim(),
                        }),
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                data.success === false
            ) {
                throw new Error(
                    data.error ||
                        "網站分析失敗"
                );
            }

            setResults([data]);
        } catch (error) {
            console.error(
                "網站分析失敗：",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "網站分析失敗"
            );
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // EC / APP 判斷
    // =========================================================

    function getECStatus(
        result: AnalysisResult
    ) {
        if (
            result.hasPaymentNeed ||
            (result.paymentScore ?? 0) >= 20
        ) {
            return "有";
        }

        return "未發現";
    }

    // =========================================================
    // POS 判斷
    // =========================================================

    function getPOSStatus(
        result: AnalysisResult
    ) {
        return result.physicalStore
            ?.hasPhysicalStore
            ? "有"
            : "未發現";
    }

    // =========================================================
    // 可合作開店平台
    // =========================================================

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

    // =========================================================
    // 合作切入點
    // =========================================================

    function getCooperationTypes(
        result: AnalysisResult
    ) {
        const types: string[] = [];

        // 開店平台
        if (
            result.platform &&
            cooperationPlatforms.some(
                (platform) =>
                    platform.toLowerCase() ===
                    result.platform?.toLowerCase()
            )
        ) {
            types.push("開店平台");
        }

        // EC / APP
        if (
            result.hasPaymentNeed ||
            (result.paymentScore ?? 0) >= 20
        ) {
            types.push("EC / APP");
        }

        // POS
        if (
            result.physicalStore
                ?.hasPhysicalStore
        ) {
            types.push("POS");
        }

        return types;
    }

    // =========================================================
    // 合作切入點 Badge
    // =========================================================

    function CooperationBadge({
        result,
    }: {
        result: AnalysisResult;
    }) {
        const types =
            getCooperationTypes(
                result
            );

        if (types.length === 0) {
            return (
                <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-sm font-bold">
                    暫無明確合作切入點
                </span>
            );
        }

        return (
            <div className="flex flex-wrap justify-end gap-2">
                {types.map((type) => {
                    let className =
                        "px-3 py-1.5 rounded-full text-sm font-bold";

                    if (
                        type ===
                        "開店平台"
                    ) {
                        className +=
                            " bg-purple-100 text-purple-700";
                    }

                    if (
                        type ===
                        "EC / APP"
                    ) {
                        className +=
                            " bg-blue-100 text-blue-700";
                    }

                    if (
                        type === "POS"
                    ) {
                        className +=
                            " bg-green-100 text-green-700";
                    }

                    return (
                        <span
                            key={type}
                            className={
                                className
                            }
                        >
                            {type}
                        </span>
                    );
                })}
            </div>
        );
    }

    // =========================================================
    // 篩選結果
    // =========================================================

    const filteredResults =
        useMemo(() => {
            return results.filter(
                (result) => {
                    if (
                        platformFilter !==
                            "全部" &&
                        result.platform !==
                            platformFilter
                    ) {
                        return false;
                    }

                    if (
                        ecFilter !==
                            "全部"
                    ) {
                        if (
                            getECStatus(
                                result
                            ) !==
                            ecFilter
                        ) {
                            return false;
                        }
                    }

                    if (
                        posFilter !==
                            "全部"
                    ) {
                        if (
                            getPOSStatus(
                                result
                            ) !==
                            posFilter
                        ) {
                            return false;
                        }
                    }

                    return true;
                }
            );
        }, [
            results,
            platformFilter,
            ecFilter,
            posFilter,
        ]);

    // =========================================================
    // 平台選項
    // =========================================================

    const platforms =
        useMemo(() => {
            const values =
                results
                    .map(
                        (item) =>
                            item.platform ||
                            "Unknown"
                    )
                    .filter(
                        (
                            value,
                            index,
                            array
                        ) =>
                            array.indexOf(
                                value
                            ) === index
                    );

            return [
                "全部",
                ...values,
            ];
        }, [results]);

    // =========================================================
    // Excel / CSV
    // =========================================================

    function exportExcel() {
        if (
            filteredResults.length ===
            0
        ) {
            return;
        }

        const header = [
            "商戶名稱",
            "網址",
            "開店平台",
            "平台信心度",
            "EC / APP",
            "POS",
            "合作切入點",
            "付款需求",
            "付款訊號",
            "POS訊號",
            "開發建議",
        ];

        const rows =
            filteredResults.map(
                (result) => [
                    result.brand ||
                        result.title ||
                        "",

                    result.url || "",

                    result.platform ||
                        "Unknown",

                    result.confidence ??
                        "",

                    getECStatus(
                        result
                    ),

                    getPOSStatus(
                        result
                    ),

                    getCooperationTypes(
                        result
                    ).join("、"),

                    result.hasPaymentNeed
                        ? "有"
                        : "未發現",

                    (
                        result.paymentSignals ||
                        []
                    ).join("、"),

                    (
                        result.physicalStore
                            ?.signals ||
                        []
                    ).join("、"),

                    result.recommendation ||
                        "",
                ]
            );

        const csv = [
            header,
            ...rows,
        ]
            .map(
                (row) =>
                    row
                        .map(
                            (value) =>
                                `"${String(
                                    value
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`
                        )
                        .join(",")
            )
            .join("\n");

        const blob =
            new Blob(
                [
                    "\uFEFF" +
                        csv,
                ],
                {
                    type:
                        "text/csv;charset=utf-8;",
                }
            );

        const fileUrl =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = fileUrl;

        link.download =
            `PayLead_${
                keyword ||
                "商戶名單"
            }.csv`;

        link.click();

        URL.revokeObjectURL(
            fileUrl
        );
    }

    return (
        <section className="space-y-6">

            {/* ================================================= */}
            {/* 標題 */}
            {/* ================================================= */}

            <div className="bg-white rounded-2xl shadow-sm p-6">

                <div className="flex items-center gap-3">

                    <div className="text-3xl">
                        🌐
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold">
                            一般商戶
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            尋找具 EC／APP、POS 與支付合作機會的潛在商戶
                        </p>
                    </div>

                </div>

            </div>

            {/* ================================================= */}
            {/* 模式 */}
            {/* ================================================= */}

            <div className="bg-white rounded-2xl shadow-sm p-2">

                <div className="grid grid-cols-2 gap-2">

                    <button
                        onClick={() => {
                            setMode(
                                "search"
                            );
                            setError("");
                        }}
                        className={
                            mode ===
                            "search"
                                ? "bg-black text-white rounded-xl px-5 py-4 font-bold"
                                : "bg-white text-gray-600 rounded-xl px-5 py-4 font-medium hover:bg-gray-50"
                        }
                    >
                        🔎 搜尋潛在商戶
                    </button>

                    <button
                        onClick={() => {
                            setMode(
                                "analyze"
                            );
                            setError("");
                        }}
                        className={
                            mode ===
                            "analyze"
                                ? "bg-black text-white rounded-xl px-5 py-4 font-bold"
                                : "bg-white text-gray-600 rounded-xl px-5 py-4 font-medium hover:bg-gray-50"
                        }
                    >
                        🌐 分析網站
                    </button>

                </div>

            </div>

            {/* ================================================= */}
            {/* 搜尋模式 */}
            {/* ================================================= */}

            {mode === "search" && (
                <div className="bg-white rounded-2xl shadow-sm p-6">

                    {/* 搜尋 */}

                    <div>
                        <h3 className="text-xl font-bold">
                            🔎 搜尋潛在商戶
                        </h3>

                        <p className="text-gray-500 text-sm mt-1">
                            輸入產業，搜尋具支付、EC／APP 或 POS 合作潛力的商戶
                        </p>
                    </div>

                    <div className="mt-5 flex flex-col md:flex-row gap-3">

                        <input
                            value={
                                keyword
                            }
                            onChange={(e) =>
                                setKeyword(
                                    e.target
                                        .value
                                )
                            }
                            onKeyDown={(e) => {
                                if (
                                    e.key ===
                                    "Enter"
                                ) {
                                    searchMerchants();
                                }
                            }}
                            placeholder="例如：電動車充電、寵物用品、健身房"
                            className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        />

                        <button
                            onClick={() =>
                                searchMerchants()
                            }
                            disabled={
                                loading
                            }
                            className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading
                                ? "搜尋分析中..."
                                : "搜尋並分析"}
                        </button>

                    </div>

                    {/* ================================================= */}
                    {/* AI 產業建議 */}
                    {/* ================================================= */}

                    <div className="mt-5 border rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center justify-between gap-3 mb-3">

                            <div>

                                <div className="font-bold text-gray-800">
                                    🤖 AI 產業建議
                                </div>

                                <div className="text-xs text-gray-500 mt-0.5">
                                    不知道要搜尋什麼？選一個有金流開發潛力的產業
                                </div>

                            </div>

                            <button
                                onClick={
                                    getIndustrySuggestions
                                }
                                disabled={
                                    aiLoading
                                }
                                className="text-sm font-bold text-gray-600 hover:text-black whitespace-nowrap"
                            >
                                🔄 換一批
                            </button>

                        </div>

                        {aiLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

                                {Array.from({
                                    length: 8,
                                }).map(
                                    (_, index) => (
                                        <div
                                            key={
                                                index
                                            }
                                            className="h-12 rounded-lg bg-gray-200 animate-pulse"
                                        />
                                    )
                                )}

                            </div>
                        ) : industrySuggestions.length >
                          0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

                                {industrySuggestions.map(
                                    (
                                        item,
                                        index
                                    ) => (
                                        <button
                                            key={
                                                `${item.name}-${index}`
                                            }
                                            onClick={() =>
                                                selectIndustry(
                                                    item.name
                                                )
                                            }
                                            className="text-left bg-white border border-gray-200 hover:border-black hover:shadow-sm rounded-lg px-3 py-2.5 transition"
                                        >
                                            <div className="font-bold text-sm text-gray-800">
                                                {
                                                    item.name
                                                }
                                            </div>
                                        </button>
                                    )
                                )}

                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 py-3">
                                暫時沒有產業建議
                            </div>
                        )}

                    </div>

                </div>
            )}

            {/* ================================================= */}
            {/* 分析網站 */}
            {/* ================================================= */}

            {mode === "analyze" && (
                <div className="bg-white rounded-2xl shadow-sm p-6">

                    <h3 className="text-xl font-bold">
                        🌐 分析網站
                    </h3>

                    <p className="text-gray-500 text-sm mt-1">
                        輸入商戶網址，自動分析開店平台、EC／APP 與 POS
                    </p>

                    <div className="mt-6 flex flex-col md:flex-row gap-3">

                        <input
                            value={url}
                            onChange={(e) =>
                                setUrl(
                                    e.target
                                        .value
                                )
                            }
                            onKeyDown={(e) => {
                                if (
                                    e.key ===
                                    "Enter"
                                ) {
                                    analyzeWebsite();
                                }
                            }}
                            placeholder="例如：https://www.example.com"
                            className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        />

                        <button
                            onClick={
                                analyzeWebsite
                            }
                            disabled={
                                loading
                            }
                            className="bg-black text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                        >
                            {loading
                                ? "分析中..."
                                : "開始分析"}
                        </button>

                    </div>

                </div>
            )}

            {/* ================================================= */}
            {/* 錯誤 */}
            {/* ================================================= */}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                    {error}
                </div>
            )}

            {/* ================================================= */}
            {/* 結果 */}
            {/* ================================================= */}

            {results.length > 0 && (
                <div className="space-y-5">

                    {/* Header */}

                    <div className="bg-white rounded-2xl shadow-sm p-5">

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                            <div>

                                <h3 className="text-xl font-bold">
                                    搜尋結果
                                </h3>

                                <p className="text-sm text-gray-500 mt-1">
                                    顯示{" "}
                                    {
                                        filteredResults.length
                                    }{" "}
                                    /{" "}
                                    {
                                        results.length
                                    }{" "}
                                    筆商戶
                                </p>

                            </div>

                            <div className="flex flex-wrap gap-2">

                                <select
                                    value={
                                        platformFilter
                                    }
                                    onChange={(e) =>
                                        setPlatformFilter(
                                            e.target
                                                .value
                                        )
                                    }
                                    className="border rounded-lg px-3 py-2 text-sm"
                                >
                                    {platforms.map(
                                        (
                                            platform
                                        ) => (
                                            <option
                                                key={
                                                    platform
                                                }
                                                value={
                                                    platform
                                                }
                                            >
                                                開店平台：
                                                {
                                                    platform
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={
                                        ecFilter
                                    }
                                    onChange={(e) =>
                                        setEcFilter(
                                            e.target
                                                .value
                                        )
                                    }
                                    className="border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="全部">
                                        EC / APP：全部
                                    </option>

                                    <option value="有">
                                        EC / APP：有
                                    </option>

                                    <option value="未發現">
                                        EC / APP：未發現
                                    </option>
                                </select>

                                <select
                                    value={
                                        posFilter
                                    }
                                    onChange={(e) =>
                                        setPosFilter(
                                            e.target
                                                .value
                                        )
                                    }
                                    className="border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="全部">
                                        POS：全部
                                    </option>

                                    <option value="有">
                                        POS：有
                                    </option>

                                    <option value="未發現">
                                        POS：未發現
                                    </option>
                                </select>

                                <button
                                    onClick={
                                        exportExcel
                                    }
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700"
                                >
                                    📊 匯出 Excel
                                </button>

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* 商戶卡片 */}
                    {/* ================================================= */}

                    {filteredResults.map(
                        (
                            result,
                            index
                        ) => {

                            const cooperationTypes =
                                getCooperationTypes(
                                    result
                                );

                            return (
                                <div
                                    key={
                                        result.url ||
                                        index
                                    }
                                    className="bg-white rounded-2xl shadow-sm border p-6"
                                >

                                    {/* Header */}

                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                                        <div className="min-w-0">

                                            <h4 className="text-xl font-bold">
                                                {
                                                    result.brand ||
                                                    result.title ||
                                                    "未知商戶"
                                                }
                                            </h4>

                                            <a
                                                href={
                                                    result.url
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-blue-600 hover:underline mt-1 block break-all"
                                            >
                                                {
                                                    result.url
                                                }
                                            </a>

                                        </div>

                                        <div className="flex-shrink-0">
                                            <CooperationBadge
                                                result={
                                                    result
                                                }
                                            />
                                        </div>

                                    </div>

                                    {/* ================================================= */}
                                    {/* 三大核心 */}
                                    {/* ================================================= */}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

                                        {/* 開店平台 */}

                                        <div
                                            className={`rounded-xl p-5 border ${
                                                cooperationTypes.includes(
                                                    "開店平台"
                                                )
                                                    ? "bg-purple-50 border-purple-200"
                                                    : "bg-gray-50 border-gray-100"
                                            }`}
                                        >

                                            <div className="text-sm text-gray-500">
                                                開店平台
                                            </div>

                                            <div className="text-xl font-bold mt-2">
                                                {
                                                    result.platform ||
                                                    "Unknown"
                                                }
                                            </div>

                                            {result.confidence !==
                                                undefined && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    信心度{" "}
                                                    {
                                                        result.confidence
                                                    }
                                                    %
                                                </div>
                                            )}

                                            {cooperationTypes.includes(
                                                "開店平台"
                                            ) && (
                                                <div className="text-xs text-purple-700 font-bold mt-3">
                                                    ✓ 可作為合作切入點
                                                </div>
                                            )}

                                        </div>

                                        {/* EC / APP */}

                                        <div
                                            className={`rounded-xl p-5 border ${
                                                cooperationTypes.includes(
                                                    "EC / APP"
                                                )
                                                    ? "bg-blue-50 border-blue-200"
                                                    : "bg-gray-50 border-gray-100"
                                            }`}
                                        >

                                            <div className="text-sm text-gray-500">
                                                EC / APP
                                            </div>

                                            <div className="text-xl font-bold mt-2">
                                                {getECStatus(
                                                    result
                                                )}
                                            </div>

                                            <div className="text-xs text-gray-500 mt-1">
                                                Payment Score：
                                                {" "}
                                                {
                                                    result.paymentScore ??
                                                    0
                                                }
                                            </div>

                                            {cooperationTypes.includes(
                                                "EC / APP"
                                            ) && (
                                                <div className="text-xs text-blue-700 font-bold mt-3">
                                                    ✓ 可作為合作切入點
                                                </div>
                                            )}

                                        </div>

                                        {/* POS */}

                                        <div
                                            className={`rounded-xl p-5 border ${
                                                cooperationTypes.includes(
                                                    "POS"
                                                )
                                                    ? "bg-green-50 border-green-200"
                                                    : "bg-gray-50 border-gray-100"
                                            }`}
                                        >

                                            <div className="text-sm text-gray-500">
                                                POS
                                            </div>

                                            <div className="text-xl font-bold mt-2">
                                                {getPOSStatus(
                                                    result
                                                )}
                                            </div>

                                            <div className="text-xs text-gray-500 mt-1">
                                                Physical Score：
                                                {" "}
                                                {
                                                    result.physicalScore ??
                                                    0
                                                }
                                            </div>

                                            {cooperationTypes.includes(
                                                "POS"
                                            ) && (
                                                <div className="text-xs text-green-700 font-bold mt-3">
                                                    ✓ 可作為合作切入點
                                                </div>
                                            )}

                                        </div>

                                    </div>

                                    {/* ================================================= */}
                                    {/* AI 開發建議 */}
                                    {/* ================================================= */}

                                    {result.recommendation && (
                                        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                                            <div className="font-bold text-blue-900 mb-1">
                                                💡 開發建議
                                            </div>

                                            <div className="text-sm text-blue-800 leading-6">
                                                {
                                                    result.recommendation
                                                }
                                            </div>

                                        </div>
                                    )}

                                    {/* ================================================= */}
                                    {/* 平台辨識證據 */}
                                    {/* ================================================= */}

                                    {result.evidence &&
                                        result.evidence.length >
                                            0 && (
                                            <details className="mt-5">

                                                <summary className="cursor-pointer text-sm font-bold text-gray-600">
                                                    查看平台辨識證據
                                                </summary>

                                                <div className="flex flex-wrap gap-2 mt-3">

                                                    {result.evidence.map(
                                                        (
                                                            signal,
                                                            i
                                                        ) => (
                                                            <span
                                                                key={
                                                                    i
                                                                }
                                                                className="px-2 py-1 rounded-lg bg-gray-100 text-xs text-gray-600"
                                                            >
                                                                {
                                                                    signal
                                                                }
                                                            </span>
                                                        )
                                                    )}

                                                </div>

                                            </details>
                                        )}

                                </div>
                            );
                        }
                    )}

                    {filteredResults.length ===
                        0 && (
                        <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
                            沒有符合目前篩選條件的商戶
                        </div>
                    )}

                </div>
            )}

        </section>
    );
}