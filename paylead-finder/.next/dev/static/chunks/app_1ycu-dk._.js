(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/components/CharityDevelopment.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CharityDevelopment
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function CharityDevelopment() {
    _s();
    const [keyword, setKeyword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [url, setUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("search");
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // ============================================================
    // 搜尋公益組織
    // ============================================================
    async function searchCharity() {
        if (!keyword.trim()) {
            setError("請輸入公益類型");
            return;
        }
        setLoading(true);
        setError("");
        setResults([]);
        try {
            const response = await fetch("/api/charity/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    keyword: keyword.trim()
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || "公益搜尋失敗");
            }
            const list = Array.isArray(data?.results) ? data.results : [];
            setResults(list);
        } catch (err) {
            console.error("公益搜尋錯誤：", err);
            setError(err instanceof Error ? err.message : "公益搜尋失敗");
        } finally{
            setLoading(false);
        }
    }
    // ============================================================
    // 分析單一公益組織
    // ============================================================
    async function analyzeCharity() {
        if (!url.trim()) {
            setError("請輸入公益組織網址");
            return;
        }
        setLoading(true);
        setError("");
        setResults([]);
        try {
            const response = await fetch("/api/charity", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    url: url.trim()
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || "公益組織分析失敗");
            }
            setResults([
                data
            ]);
        } catch (err) {
            console.error("公益分析錯誤：", err);
            setError(err instanceof Error ? err.message : "公益分析失敗");
        } finally{
            setLoading(false);
        }
    }
    // ============================================================
    // Enter
    // ============================================================
    function handleKeyDown(e) {
        if (e.key !== "Enter") return;
        if (mode === "search") {
            searchCharity();
        } else {
            analyzeCharity();
        }
    }
    // ============================================================
    // 名稱
    // ============================================================
    function getName(item) {
        return item.organizationName || item.name || "公益組織";
    }
    // ============================================================
    // 網址
    // ============================================================
    function getWebsite(item) {
        return item.url || item.website || "";
    }
    // ============================================================
    // 類別
    // ============================================================
    function getCategory(item) {
        if (Array.isArray(item.categories) && item.categories.length > 0) {
            return item.categories.join("、");
        }
        if (item.category) {
            return item.category;
        }
        if (item.type) {
            return item.type;
        }
        return "公益組織";
    }
    // ============================================================
    // 線上捐款
    // ============================================================
    function hasOnlineDonation(item) {
        return item.donation?.online === true || item.donation?.hasOnlineDonation === true || item.onlineDonation === true;
    }
    // ============================================================
    // 定期捐款
    // ============================================================
    function hasRecurringDonation(item) {
        return item.donation?.hasRecurringDonation === true || item.recurringDonation === true;
    }
    // ============================================================
    // 實體據點
    // ============================================================
    function hasPhysicalStore(item) {
        return item.physicalStore?.hasPhysicalStore === true || item.hasPhysicalStore === true || !!item.address;
    }
    // ============================================================
    // 勸募資訊
    // ============================================================
    function getFundraisingNumber(item) {
        return item.fundraisingNumber || item.fundraisingNo || item.solicitationNumber || item["勸募字號"] || item["勸募核准文號"] || item["勸募許可字號"] || "";
    }
    function hasFundraising(item) {
        return item.fundraising?.hasFundraisingInfo === true || !!getFundraisingNumber(item);
    }
    // ============================================================
    // Payment Score
    // ============================================================
    function getPaymentScore(item) {
        if (typeof item.paymentScore === "number") {
            return item.paymentScore;
        }
        if (hasRecurringDonation(item)) {
            return 25;
        }
        if (hasOnlineDonation(item)) {
            return 18;
        }
        return 0;
    }
    // ============================================================
    // Physical Score
    // ============================================================
    function getPhysicalScore(item) {
        if (typeof item.physicalScore === "number") {
            return item.physicalScore;
        }
        if (hasPhysicalStore(item)) {
            return 10;
        }
        return 0;
    }
    // ============================================================
    // 開發建議
    // ============================================================
    function getRecommendation(item) {
        if (item.recommendation) {
            return item.recommendation;
        }
        const recommendations = [];
        const donation = hasOnlineDonation(item);
        const recurring = hasRecurringDonation(item);
        const physical = hasPhysicalStore(item);
        const fundraising = hasFundraising(item);
        if (donation) {
            recommendations.push("網站已有線上捐款需求，可優先洽談 EC／APP 捐款金流合作。");
        }
        if (recurring) {
            recommendations.push("網站具有定期捐款需求，可進一步洽談定期扣款與會員型金流。");
        }
        if (physical) {
            recommendations.push("網站具有實體服務據點，可進一步確認現場收款、POS 或其他支付需求。");
        }
        if (fundraising) {
            recommendations.push("網站具有公益勸募資訊，可進一步確認 APP 捐款專區合作資格。");
        }
        if (recommendations.length === 0) {
            return "具有一定公益合作潛力，可進一步確認付款、會員、預約或收費流程。";
        }
        return recommendations.join(" ");
    }
    // ============================================================
    // Excel 匯出
    //
    // 不需要勾選
    // 直接匯出目前所有結果
    // ============================================================
    function exportExcel() {
        if (results.length === 0) {
            setError("目前沒有可以匯出的資料");
            return;
        }
        const headers = [
            "公益組織",
            "網址",
            "類別",
            "線上捐款",
            "定期捐款",
            "實體據點",
            "Payment Score",
            "Physical Score",
            "勸募字號",
            "開發建議"
        ];
        const rows = results.map((item)=>{
            return [
                getName(item),
                getWebsite(item),
                getCategory(item),
                hasOnlineDonation(item) ? "是" : "否",
                hasRecurringDonation(item) ? "是" : "否",
                hasPhysicalStore(item) ? "是" : "否",
                getPaymentScore(item),
                getPhysicalScore(item),
                getFundraisingNumber(item) || "未取得",
                getRecommendation(item)
            ];
        });
        const csvContent = [
            headers,
            ...rows
        ].map((row)=>row.map((value)=>{
                const text = String(value ?? "");
                return `"${text.replace(/"/g, '""')}"`;
            }).join(",")).join("\n");
        // UTF-8 BOM
        const blob = new Blob([
            "\uFEFF" + csvContent
        ], {
            type: "text/csv;charset=utf-8;"
        });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `公益開發名單_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    }
    // ============================================================
    // UI
    // ============================================================
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl shadow-sm p-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-3xl",
                            children: "🏛️"
                        }, void 0, false, {
                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                            lineNumber: 588,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-bold",
                                    children: "公益開發"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                    lineNumber: 594,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-500 text-sm mt-1",
                                    children: "尋找具線上捐款、EC、APP、POS 與公益金流合作機會的組織"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                    lineNumber: 598,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                            lineNumber: 592,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                    lineNumber: 586,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/CharityDevelopment.tsx",
                lineNumber: 584,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl shadow-sm p-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                setMode("search");
                                setError("");
                            },
                            className: mode === "search" ? "bg-black text-white rounded-xl px-5 py-4 font-bold" : "bg-white text-gray-600 rounded-xl px-5 py-4 font-medium hover:bg-gray-50",
                            children: "🔎 搜尋公益組織"
                        }, void 0, false, {
                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                            lineNumber: 617,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                setMode("analyze");
                                setError("");
                            },
                            className: mode === "analyze" ? "bg-black text-white rounded-xl px-5 py-4 font-bold" : "bg-white text-gray-600 rounded-xl px-5 py-4 font-medium hover:bg-gray-50",
                            children: "🌐 分析公益組織"
                        }, void 0, false, {
                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                            lineNumber: 631,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                    lineNumber: 615,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/CharityDevelopment.tsx",
                lineNumber: 613,
                columnNumber: 7
            }, this),
            mode === "search" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-xl font-bold",
                        children: "🔎 搜尋公益組織"
                    }, void 0, false, {
                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                        lineNumber: 658,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-500 text-sm mt-1",
                        children: "輸入公益類型，自動搜尋相關基金會、協會與公益組織"
                    }, void 0, false, {
                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                        lineNumber: 662,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-5 flex flex-col md:flex-row gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: keyword,
                                onChange: (e)=>setKeyword(e.target.value),
                                onKeyDown: handleKeyDown,
                                placeholder: "例如：老人照護、失智、兒少、動物保護、癌症醫療",
                                className: "flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                            }, void 0, false, {
                                fileName: "[project]/app/components/CharityDevelopment.tsx",
                                lineNumber: 668,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: searchCharity,
                                disabled: loading,
                                className: "bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50",
                                children: loading ? "搜尋中..." : "搜尋公益"
                            }, void 0, false, {
                                fileName: "[project]/app/components/CharityDevelopment.tsx",
                                lineNumber: 682,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                        lineNumber: 666,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-5 flex flex-wrap gap-2",
                        children: [
                            "老人照護",
                            "失智照護",
                            "兒少福利",
                            "動物保護",
                            "癌症醫療",
                            "身心障礙",
                            "環境保育",
                            "教育公益",
                            "弱勢扶助",
                            "婦女福利",
                            "公益募款",
                            "社會福利"
                        ].map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setKeyword(item),
                                className: "border rounded-full px-4 py-2 text-sm hover:bg-gray-100",
                                children: item
                            }, item, false, {
                                fileName: "[project]/app/components/CharityDevelopment.tsx",
                                lineNumber: 717,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                        lineNumber: 699,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/CharityDevelopment.tsx",
                lineNumber: 656,
                columnNumber: 9
            }, this),
            mode === "analyze" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-xl font-bold",
                        children: "🌐 分析公益組織"
                    }, void 0, false, {
                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                        lineNumber: 745,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-500 text-sm mt-1",
                        children: "輸入公益組織網站，自動分析線上捐款、實體據點與勸募資訊"
                    }, void 0, false, {
                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                        lineNumber: 749,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-5 flex flex-col md:flex-row gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: url,
                                onChange: (e)=>setUrl(e.target.value),
                                onKeyDown: handleKeyDown,
                                placeholder: "例如：https://www.hospice.org.tw",
                                className: "flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                            }, void 0, false, {
                                fileName: "[project]/app/components/CharityDevelopment.tsx",
                                lineNumber: 755,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: analyzeCharity,
                                disabled: loading,
                                className: "bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50",
                                children: loading ? "分析中..." : "開始分析"
                            }, void 0, false, {
                                fileName: "[project]/app/components/CharityDevelopment.tsx",
                                lineNumber: 769,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                        lineNumber: 753,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/CharityDevelopment.tsx",
                lineNumber: 743,
                columnNumber: 9
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-50 border border-red-200 text-red-700 rounded-xl p-4",
                children: error
            }, void 0, false, {
                fileName: "[project]/app/components/CharityDevelopment.tsx",
                lineNumber: 794,
                columnNumber: 9
            }, this),
            results.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col md:flex-row md:items-center md:justify-between gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-xl font-bold",
                                        children: "🏛️ 公益開發名單"
                                    }, void 0, false, {
                                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                                        lineNumber: 816,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-gray-500",
                                        children: [
                                            "共 ",
                                            results.length,
                                            " 筆"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                                        lineNumber: 820,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/components/CharityDevelopment.tsx",
                                lineNumber: 814,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: exportExcel,
                                className: "bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 transition",
                                children: "📊 匯出 Excel"
                            }, void 0, false, {
                                fileName: "[project]/app/components/CharityDevelopment.tsx",
                                lineNumber: 831,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                        lineNumber: 812,
                        columnNumber: 11
                    }, this),
                    results.map((item, index)=>{
                        const name = getName(item);
                        const website = getWebsite(item);
                        const category = getCategory(item);
                        const onlineDonation = hasOnlineDonation(item);
                        const recurring = hasRecurringDonation(item);
                        const physicalStore = hasPhysicalStore(item);
                        const fundraisingNumber = getFundraisingNumber(item);
                        const fundraising = hasFundraising(item);
                        const paymentScore = getPaymentScore(item);
                        const physicalScore = getPhysicalScore(item);
                        const recommendation = getRecommendation(item);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                    className: "text-xl font-bold",
                                                    children: name
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 912,
                                                    columnNumber: 23
                                                }, this),
                                                website && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: website,
                                                    target: "_blank",
                                                    rel: "noopener noreferrer",
                                                    className: "text-sm text-blue-600 hover:underline break-all",
                                                    children: website
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 919,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-2",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "inline-flex bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium",
                                                        children: [
                                                            "類別：",
                                                            category
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                        lineNumber: 937,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 935,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 910,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-wrap gap-2 shrink-0",
                                            children: [
                                                onlineDonation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold",
                                                    children: "💳 線上捐款"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 961,
                                                    columnNumber: 25
                                                }, this),
                                                physicalStore && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold",
                                                    children: "🏪 實體據點"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 969,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 957,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                    lineNumber: 908,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-6 grid grid-cols-1 md:grid-cols-3 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "border rounded-xl p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-400",
                                                    children: "線上捐款"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 993,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-bold mt-2",
                                                    children: onlineDonation ? "發現線上捐款" : "未發現"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 997,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-medium",
                                                            children: "Payment Score："
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                            lineNumber: 1008,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-bold",
                                                            children: paymentScore
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                            lineNumber: 1012,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1006,
                                                    columnNumber: 23
                                                }, this),
                                                onlineDonation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-green-600 font-bold mt-2",
                                                    children: "✓ 可作為合作切入點"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1021,
                                                    columnNumber: 25
                                                }, this),
                                                recurring && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-500 mt-2",
                                                    children: "✓ 偵測到定期捐款"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1030,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 991,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "border rounded-xl p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-400",
                                                    children: "實體據點"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1045,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-bold mt-2",
                                                    children: physicalStore ? "發現實體據點" : "未發現"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1049,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-medium",
                                                            children: "Physical Score："
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                            lineNumber: 1060,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-bold",
                                                            children: physicalScore
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                            lineNumber: 1064,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1058,
                                                    columnNumber: 23
                                                }, this),
                                                physicalStore && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-green-600 font-bold mt-2",
                                                    children: "✓ 可作為合作切入點"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1073,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 1043,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "border rounded-xl p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-400",
                                                    children: "勸募資訊"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1088,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-bold mt-2",
                                                    children: fundraisingNumber ? fundraisingNumber : "未發現"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1092,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-medium",
                                                            children: "勸募字號："
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                            lineNumber: 1103,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-bold",
                                                            children: fundraising ? "已取得" : "未取得"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                            lineNumber: 1107,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1101,
                                                    columnNumber: 23
                                                }, this),
                                                fundraising && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-green-600 font-bold mt-2",
                                                    children: "✓ 可作為合作切入點"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                    lineNumber: 1118,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 1086,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                    lineNumber: 984,
                                    columnNumber: 19
                                }, this),
                                (item.phone || item.address) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 text-sm text-gray-500 space-y-1",
                                    children: [
                                        item.phone && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                "📞",
                                                " ",
                                                item.phone
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 1140,
                                            columnNumber: 25
                                        }, this),
                                        item.address && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                "📍",
                                                " ",
                                                item.address
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 1149,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                    lineNumber: 1136,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-5 bg-gray-50 rounded-xl p-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-bold text-sm",
                                            children: "💡 開發建議"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 1167,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-600 mt-2 leading-relaxed",
                                            children: recommendation
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 1171,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                    lineNumber: 1165,
                                    columnNumber: 19
                                }, this),
                                Array.isArray(item.evidence) && item.evidence.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                    className: "mt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                            className: "cursor-pointer text-sm font-bold text-gray-700 hover:text-black",
                                            children: "查看辨識證據"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 1193,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-3 bg-gray-50 rounded-xl p-4",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap gap-2",
                                                children: item.evidence.map((evidence, evidenceIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "bg-white border rounded-lg px-3 py-1 text-xs text-gray-600",
                                                        children: evidence
                                                    }, `${evidence}-${evidenceIndex}`, false, {
                                                        fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                        lineNumber: 1207,
                                                        columnNumber: 33
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/CharityDevelopment.tsx",
                                                lineNumber: 1199,
                                                columnNumber: 27
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                                            lineNumber: 1197,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/CharityDevelopment.tsx",
                                    lineNumber: 1191,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, website || `${name}-${index}`, true, {
                            fileName: "[project]/app/components/CharityDevelopment.tsx",
                            lineNumber: 895,
                            columnNumber: 17
                        }, this);
                    })
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/CharityDevelopment.tsx",
                lineNumber: 807,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/CharityDevelopment.tsx",
        lineNumber: 578,
        columnNumber: 5
    }, this);
}
_s(CharityDevelopment, "xtffJHL3vg+GbGw5mhN0XRp10d4=");
_c = CharityDevelopment;
var _c;
__turbopack_context__.k.register(_c, "CharityDevelopment");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/GeneralMerchant.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GeneralMerchant
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function GeneralMerchant() {
    _s();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("search");
    const [keyword, setKeyword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [url, setUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [aiLoading, setAiLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // =========================================================
    // AI 產業建議
    // =========================================================
    const [industrySuggestions, setIndustrySuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // =========================================================
    // 篩選
    // =========================================================
    const [platformFilter, setPlatformFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("全部");
    const [ecFilter, setEcFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("全部");
    const [posFilter, setPosFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("全部");
    // =========================================================
    // 取得 AI 產業建議
    // =========================================================
    async function getIndustrySuggestions() {
        try {
            setAiLoading(true);
            const response = await fetch("/api/industry-suggestions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                throw new Error("取得產業建議失敗");
            }
            const data = await response.json();
            if (data.success && Array.isArray(data.suggestions)) {
                const suggestions = data.suggestions.map((item)=>{
                    if (typeof item === "string") {
                        return {
                            name: item
                        };
                    }
                    return {
                        name: item?.name || ""
                    };
                }).filter((item)=>item.name);
                setIndustrySuggestions(suggestions);
            }
        } catch (error) {
            console.error("取得 AI 產業建議失敗：", error);
        } finally{
            setAiLoading(false);
        }
    }
    // =========================================================
    // 頁面載入時取得產業建議
    // =========================================================
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GeneralMerchant.useEffect": ()=>{
            getIndustrySuggestions();
        }
    }["GeneralMerchant.useEffect"], []);
    // =========================================================
    // 搜尋商戶
    // =========================================================
    async function searchMerchants(customKeyword) {
        const searchKeyword = (customKeyword || keyword).trim();
        if (!searchKeyword) {
            setError("請輸入產業關鍵字");
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
            const response = await fetch("/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    keyword: searchKeyword
                })
            });
            const data = await response.json();
            if (!response.ok || data.success === false) {
                throw new Error(data.error || "搜尋失敗");
            }
            const searchResults = Array.isArray(data.results) ? data.results : [];
            setResults(searchResults);
        } catch (error) {
            console.error("搜尋失敗：", error);
            setError(error instanceof Error ? error.message : "搜尋發生錯誤");
        } finally{
            setLoading(false);
        }
    }
    // =========================================================
    // 點擊產業建議
    // =========================================================
    function selectIndustry(industry) {
        setKeyword(industry);
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
    // =========================================================
    // 單一網站分析
    // =========================================================
    async function analyzeWebsite() {
        if (!url.trim()) {
            setError("請輸入網站網址");
            return;
        }
        setLoading(true);
        setError("");
        setResults([]);
        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    url: url.trim()
                })
            });
            const data = await response.json();
            if (!response.ok || data.success === false) {
                throw new Error(data.error || "網站分析失敗");
            }
            setResults([
                data
            ]);
        } catch (error) {
            console.error("網站分析失敗：", error);
            setError(error instanceof Error ? error.message : "網站分析失敗");
        } finally{
            setLoading(false);
        }
    }
    // =========================================================
    // EC / APP 判斷
    // =========================================================
    function getECStatus(result) {
        if (result.hasPaymentNeed || (result.paymentScore ?? 0) >= 20) {
            return "有";
        }
        return "未發現";
    }
    // =========================================================
    // POS 判斷
    // =========================================================
    function getPOSStatus(result) {
        return result.physicalStore?.hasPhysicalStore ? "有" : "未發現";
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
        "waca"
    ];
    // =========================================================
    // 合作切入點
    // =========================================================
    function getCooperationTypes(result) {
        const types = [];
        // 開店平台
        if (result.platform && cooperationPlatforms.some((platform)=>platform.toLowerCase() === result.platform?.toLowerCase())) {
            types.push("開店平台");
        }
        // EC / APP
        if (result.hasPaymentNeed || (result.paymentScore ?? 0) >= 20) {
            types.push("EC / APP");
        }
        // POS
        if (result.physicalStore?.hasPhysicalStore) {
            types.push("POS");
        }
        return types;
    }
    // =========================================================
    // 合作切入點 Badge
    // =========================================================
    function CooperationBadge({ result }) {
        const types = getCooperationTypes(result);
        if (types.length === 0) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-sm font-bold",
                children: "暫無明確合作切入點"
            }, void 0, false, {
                fileName: "[project]/app/components/GeneralMerchant.tsx",
                lineNumber: 454,
                columnNumber: 17
            }, this);
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-wrap justify-end gap-2",
            children: types.map((type)=>{
                let className = "px-3 py-1.5 rounded-full text-sm font-bold";
                if (type === "開店平台") {
                    className += " bg-purple-100 text-purple-700";
                }
                if (type === "EC / APP") {
                    className += " bg-blue-100 text-blue-700";
                }
                if (type === "POS") {
                    className += " bg-green-100 text-green-700";
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: className,
                    children: type
                }, type, false, {
                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                    lineNumber: 490,
                    columnNumber: 25
                }, this);
            })
        }, void 0, false, {
            fileName: "[project]/app/components/GeneralMerchant.tsx",
            lineNumber: 461,
            columnNumber: 13
        }, this);
    }
    // =========================================================
    // 篩選結果
    // =========================================================
    const filteredResults = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GeneralMerchant.useMemo[filteredResults]": ()=>{
            return results.filter({
                "GeneralMerchant.useMemo[filteredResults]": (result)=>{
                    if (platformFilter !== "全部" && result.platform !== platformFilter) {
                        return false;
                    }
                    if (ecFilter !== "全部") {
                        if (getECStatus(result) !== ecFilter) {
                            return false;
                        }
                    }
                    if (posFilter !== "全部") {
                        if (getPOSStatus(result) !== posFilter) {
                            return false;
                        }
                    }
                    return true;
                }
            }["GeneralMerchant.useMemo[filteredResults]"]);
        }
    }["GeneralMerchant.useMemo[filteredResults]"], [
        results,
        platformFilter,
        ecFilter,
        posFilter
    ]);
    // =========================================================
    // 平台選項
    // =========================================================
    const platforms = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GeneralMerchant.useMemo[platforms]": ()=>{
            const values = results.map({
                "GeneralMerchant.useMemo[platforms].values": (item)=>item.platform || "Unknown"
            }["GeneralMerchant.useMemo[platforms].values"]).filter({
                "GeneralMerchant.useMemo[platforms].values": (value, index, array)=>array.indexOf(value) === index
            }["GeneralMerchant.useMemo[platforms].values"]);
            return [
                "全部",
                ...values
            ];
        }
    }["GeneralMerchant.useMemo[platforms]"], [
        results
    ]);
    // =========================================================
    // Excel / CSV
    // =========================================================
    function exportExcel() {
        if (filteredResults.length === 0) {
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
            "開發建議"
        ];
        const rows = filteredResults.map((result)=>[
                result.brand || result.title || "",
                result.url || "",
                result.platform || "Unknown",
                result.confidence ?? "",
                getECStatus(result),
                getPOSStatus(result),
                getCooperationTypes(result).join("、"),
                result.hasPaymentNeed ? "有" : "未發現",
                (result.paymentSignals || []).join("、"),
                (result.physicalStore?.signals || []).join("、"),
                result.recommendation || ""
            ]);
        const csv = [
            header,
            ...rows
        ].map((row)=>row.map((value)=>`"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([
            "\uFEFF" + csv
        ], {
            type: "text/csv;charset=utf-8;"
        });
        const fileUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `PayLead_${keyword || "商戶名單"}.csv`;
        link.click();
        URL.revokeObjectURL(fileUrl);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl shadow-sm p-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-3xl",
                            children: "🌐"
                        }, void 0, false, {
                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                            lineNumber: 730,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-bold",
                                    children: "一般商戶"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                    lineNumber: 735,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-500 text-sm mt-1",
                                    children: "尋找具 EC／APP、POS 與支付合作機會的潛在商戶"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                    lineNumber: 739,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                            lineNumber: 734,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                    lineNumber: 728,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/GeneralMerchant.tsx",
                lineNumber: 726,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl shadow-sm p-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                setMode("search");
                                setError("");
                            },
                            className: mode === "search" ? "bg-black text-white rounded-xl px-5 py-4 font-bold" : "bg-white text-gray-600 rounded-xl px-5 py-4 font-medium hover:bg-gray-50",
                            children: "🔎 搜尋潛在商戶"
                        }, void 0, false, {
                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                            lineNumber: 756,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                setMode("analyze");
                                setError("");
                            },
                            className: mode === "analyze" ? "bg-black text-white rounded-xl px-5 py-4 font-bold" : "bg-white text-gray-600 rounded-xl px-5 py-4 font-medium hover:bg-gray-50",
                            children: "🌐 分析網站"
                        }, void 0, false, {
                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                            lineNumber: 773,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                    lineNumber: 754,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/GeneralMerchant.tsx",
                lineNumber: 752,
                columnNumber: 13
            }, this),
            mode === "search" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xl font-bold",
                                children: "🔎 搜尋潛在商戶"
                            }, void 0, false, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 804,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-500 text-sm mt-1",
                                children: "輸入產業，搜尋具支付、EC／APP 或 POS 合作潛力的商戶"
                            }, void 0, false, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 808,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                        lineNumber: 803,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-5 flex flex-col md:flex-row gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: keyword,
                                onChange: (e)=>setKeyword(e.target.value),
                                onKeyDown: (e)=>{
                                    if (e.key === "Enter") {
                                        searchMerchants();
                                    }
                                },
                                placeholder: "例如：電動車充電、寵物用品、健身房",
                                className: "flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                            }, void 0, false, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 815,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>searchMerchants(),
                                disabled: loading,
                                className: "bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50",
                                children: loading ? "搜尋分析中..." : "搜尋並分析"
                            }, void 0, false, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 837,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                        lineNumber: 813,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-5 border rounded-xl bg-gray-50 p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between gap-3 mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "font-bold text-gray-800",
                                                children: "🤖 AI 產業建議"
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                lineNumber: 863,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs text-gray-500 mt-0.5",
                                                children: "不知道要搜尋什麼？選一個有金流開發潛力的產業"
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                lineNumber: 867,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                                        lineNumber: 861,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: getIndustrySuggestions,
                                        disabled: aiLoading,
                                        className: "text-sm font-bold text-gray-600 hover:text-black whitespace-nowrap",
                                        children: "🔄 換一批"
                                    }, void 0, false, {
                                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                                        lineNumber: 873,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 859,
                                columnNumber: 25
                            }, this),
                            aiLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 md:grid-cols-4 gap-2",
                                children: Array.from({
                                    length: 8
                                }).map((_, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-12 rounded-lg bg-gray-200 animate-pulse"
                                    }, index, false, {
                                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                                        lineNumber: 894,
                                        columnNumber: 41
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 888,
                                columnNumber: 29
                            }, this) : industrySuggestions.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 md:grid-cols-4 gap-2",
                                children: industrySuggestions.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>selectIndustry(item.name),
                                        className: "text-left bg-white border border-gray-200 hover:border-black hover:shadow-sm rounded-lg px-3 py-2.5 transition",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "font-bold text-sm text-gray-800",
                                            children: item.name
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 924,
                                            columnNumber: 45
                                        }, this)
                                    }, `${item.name}-${index}`, false, {
                                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                                        lineNumber: 913,
                                        columnNumber: 41
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 906,
                                columnNumber: 29
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm text-gray-400 py-3",
                                children: "暫時沒有產業建議"
                            }, void 0, false, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 935,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                        lineNumber: 857,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/GeneralMerchant.tsx",
                lineNumber: 799,
                columnNumber: 17
            }, this),
            mode === "analyze" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-xl font-bold",
                        children: "🌐 分析網站"
                    }, void 0, false, {
                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                        lineNumber: 952,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-500 text-sm mt-1",
                        children: "輸入商戶網址，自動分析開店平台、EC／APP 與 POS"
                    }, void 0, false, {
                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                        lineNumber: 956,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-6 flex flex-col md:flex-row gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: url,
                                onChange: (e)=>setUrl(e.target.value),
                                onKeyDown: (e)=>{
                                    if (e.key === "Enter") {
                                        analyzeWebsite();
                                    }
                                },
                                placeholder: "例如：https://www.example.com",
                                className: "flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                            }, void 0, false, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 962,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: analyzeWebsite,
                                disabled: loading,
                                className: "bg-black text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50",
                                children: loading ? "分析中..." : "開始分析"
                            }, void 0, false, {
                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                lineNumber: 982,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                        lineNumber: 960,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/GeneralMerchant.tsx",
                lineNumber: 950,
                columnNumber: 17
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-50 border border-red-200 text-red-700 rounded-xl p-4",
                children: error
            }, void 0, false, {
                fileName: "[project]/app/components/GeneralMerchant.tsx",
                lineNumber: 1006,
                columnNumber: 17
            }, this),
            results.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl shadow-sm p-5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-xl font-bold",
                                            children: "搜尋結果"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1026,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-500 mt-1",
                                            children: [
                                                "顯示",
                                                " ",
                                                filteredResults.length,
                                                " ",
                                                "/",
                                                " ",
                                                results.length,
                                                " ",
                                                "筆商戶"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1030,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                    lineNumber: 1024,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-wrap gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: platformFilter,
                                            onChange: (e)=>setPlatformFilter(e.target.value),
                                            className: "border rounded-lg px-3 py-2 text-sm",
                                            children: platforms.map((platform)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: platform,
                                                    children: [
                                                        "開店平台：",
                                                        platform
                                                    ]
                                                }, platform, true, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1062,
                                                    columnNumber: 45
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1046,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: ecFilter,
                                            onChange: (e)=>setEcFilter(e.target.value),
                                            className: "border rounded-lg px-3 py-2 text-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "全部",
                                                    children: "EC / APP：全部"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1091,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "有",
                                                    children: "EC / APP：有"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1095,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "未發現",
                                                    children: "EC / APP：未發現"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1099,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1079,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: posFilter,
                                            onChange: (e)=>setPosFilter(e.target.value),
                                            className: "border rounded-lg px-3 py-2 text-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "全部",
                                                    children: "POS：全部"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1116,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "有",
                                                    children: "POS：有"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1120,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "未發現",
                                                    children: "POS：未發現"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1124,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1104,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: exportExcel,
                                            className: "bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700",
                                            children: "📊 匯出 Excel"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1129,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                    lineNumber: 1044,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                            lineNumber: 1022,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                        lineNumber: 1020,
                        columnNumber: 21
                    }, this),
                    filteredResults.map((result, index)=>{
                        const cooperationTypes = getCooperationTypes(result);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-2xl shadow-sm border p-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                    className: "text-xl font-bold",
                                                    children: result.brand || result.title || "未知商戶"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1174,
                                                    columnNumber: 45
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: result.url,
                                                    target: "_blank",
                                                    rel: "noreferrer",
                                                    className: "text-sm text-blue-600 hover:underline mt-1 block break-all",
                                                    children: result.url
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1182,
                                                    columnNumber: 45
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1172,
                                            columnNumber: 41
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-shrink-0",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CooperationBadge, {
                                                result: result
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                lineNumber: 1198,
                                                columnNumber: 45
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1197,
                                            columnNumber: 41
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                    lineNumber: 1170,
                                    columnNumber: 37
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-3 gap-4 mt-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `rounded-xl p-5 border ${cooperationTypes.includes("開店平台") ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-100"}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-gray-500",
                                                    children: "開店平台"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1225,
                                                    columnNumber: 45
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xl font-bold mt-2",
                                                    children: result.platform || "Unknown"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1229,
                                                    columnNumber: 45
                                                }, this),
                                                result.confidence !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-gray-500 mt-1",
                                                    children: [
                                                        "信心度",
                                                        " ",
                                                        result.confidence,
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1238,
                                                    columnNumber: 49
                                                }, this),
                                                cooperationTypes.includes("開店平台") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-purple-700 font-bold mt-3",
                                                    children: "✓ 可作為合作切入點"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1250,
                                                    columnNumber: 49
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1215,
                                            columnNumber: 41
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `rounded-xl p-5 border ${cooperationTypes.includes("EC / APP") ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-gray-500",
                                                    children: "EC / APP"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1269,
                                                    columnNumber: 45
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xl font-bold mt-2",
                                                    children: getECStatus(result)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1273,
                                                    columnNumber: 45
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-gray-500 mt-1",
                                                    children: [
                                                        "Payment Score：",
                                                        " ",
                                                        result.paymentScore ?? 0
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1279,
                                                    columnNumber: 45
                                                }, this),
                                                cooperationTypes.includes("EC / APP") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-blue-700 font-bold mt-3",
                                                    children: "✓ 可作為合作切入點"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1291,
                                                    columnNumber: 49
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1259,
                                            columnNumber: 41
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `rounded-xl p-5 border ${cooperationTypes.includes("POS") ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-gray-500",
                                                    children: "POS"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1310,
                                                    columnNumber: 45
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xl font-bold mt-2",
                                                    children: getPOSStatus(result)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1314,
                                                    columnNumber: 45
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-gray-500 mt-1",
                                                    children: [
                                                        "Physical Score：",
                                                        " ",
                                                        result.physicalScore ?? 0
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1320,
                                                    columnNumber: 45
                                                }, this),
                                                cooperationTypes.includes("POS") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-green-700 font-bold mt-3",
                                                    children: "✓ 可作為合作切入點"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1332,
                                                    columnNumber: 49
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1300,
                                            columnNumber: 41
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                    lineNumber: 1211,
                                    columnNumber: 37
                                }, this),
                                result.recommendation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "font-bold text-blue-900 mb-1",
                                            children: "💡 開發建議"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1348,
                                            columnNumber: 45
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm text-blue-800 leading-6",
                                            children: result.recommendation
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1352,
                                            columnNumber: 45
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                    lineNumber: 1346,
                                    columnNumber: 41
                                }, this),
                                result.evidence && result.evidence.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                    className: "mt-5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                            className: "cursor-pointer text-sm font-bold text-gray-600",
                                            children: "查看平台辨識證據"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1370,
                                            columnNumber: 49
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-wrap gap-2 mt-3",
                                            children: result.evidence.map((signal, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "px-2 py-1 rounded-lg bg-gray-100 text-xs text-gray-600",
                                                    children: signal
                                                }, i, false, {
                                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                                    lineNumber: 1381,
                                                    columnNumber: 61
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                                            lineNumber: 1374,
                                            columnNumber: 49
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/GeneralMerchant.tsx",
                                    lineNumber: 1368,
                                    columnNumber: 45
                                }, this)
                            ]
                        }, result.url || index, true, {
                            fileName: "[project]/app/components/GeneralMerchant.tsx",
                            lineNumber: 1160,
                            columnNumber: 33
                        }, this);
                    }),
                    filteredResults.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl p-10 text-center text-gray-500",
                        children: "沒有符合目前篩選條件的商戶"
                    }, void 0, false, {
                        fileName: "[project]/app/components/GeneralMerchant.tsx",
                        lineNumber: 1406,
                        columnNumber: 25
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/GeneralMerchant.tsx",
                lineNumber: 1016,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/GeneralMerchant.tsx",
        lineNumber: 720,
        columnNumber: 9
    }, this);
}
_s(GeneralMerchant, "r88uFUh7uiA6HxBgxSO+jIMeH58=");
_c = GeneralMerchant;
var _c;
__turbopack_context__.k.register(_c, "GeneralMerchant");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$GeneralMerchant$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/GeneralMerchant.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$CharityDevelopment$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/CharityDevelopment.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function Page() {
    _s();
    const [mainMode, setMainMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("merchant");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen bg-gray-100",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-black text-white",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-6 py-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl font-bold",
                            children: "PayLead Finder"
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 19,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-300 mt-1",
                            children: "全支付開發名單工具"
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 23,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 17,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 16,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-7xl mx-auto px-6 py-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl shadow-sm p-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setMainMode("merchant"),
                                    className: mainMode === "merchant" ? "bg-black text-white rounded-xl px-6 py-5 font-bold text-lg" : "bg-white text-gray-600 rounded-xl px-6 py-5 font-medium text-lg hover:bg-gray-50",
                                    children: "🌐 一般商戶"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 41,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setMainMode("charity"),
                                    className: mainMode === "charity" ? "bg-black text-white rounded-xl px-6 py-5 font-bold text-lg" : "bg-white text-gray-600 rounded-xl px-6 py-5 font-medium text-lg hover:bg-gray-50",
                                    children: "🏛️ 公益開發"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 57,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 37,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 35,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-8",
                        children: [
                            mainMode === "merchant" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$GeneralMerchant$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 80,
                                columnNumber: 25
                            }, this),
                            mainMode === "charity" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$CharityDevelopment$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 84,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 77,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 31,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 13,
        columnNumber: 9
    }, this);
}
_s(Page, "f3CfkQUABFO/U/zyts3F95TsBiU=");
_c = Page;
var _c;
__turbopack_context__.k.register(_c, "Page");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_1ycu-dk._.js.map