"use client";

import { useState } from "react";

type CharityResult = {
  organizationName?: string;
  name?: string;

  url?: string;
  website?: string;

  categories?: string[];
  category?: string;
  type?: string;

  confidence?: number;

  donation?: {
    online?: boolean;
    hasOnlineDonation?: boolean;
    hasRecurringDonation?: boolean;
    methods?: string[];
  };

  fundraising?: {
    hasFundraisingInfo?: boolean;
    signals?: string[];
  };

  fundraisingNumber?: string;
  fundraisingNo?: string;
  solicitationNumber?: string;

  development?: {
    ec?: boolean;
    pos?: boolean;
    app?: boolean;
  };

  physicalStore?: {
    hasPhysicalStore?: boolean;
    signals?: string[];
  };

  hasPhysicalStore?: boolean;

  paymentScore?: number;
  physicalScore?: number;

  recommendation?: string;

  evidence?: string[];

  phone?: string;
  address?: string;

  priority?: string;

  [key: string]: any;
};

export default function CharityDevelopment() {
  const [keyword, setKeyword] = useState("");
  const [url, setUrl] = useState("");

  const [mode, setMode] =
    useState<"search" | "analyze">("search");

  const [results, setResults] =
    useState<CharityResult[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

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
      const response = await fetch(
        "/api/charity/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keyword: keyword.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "公益搜尋失敗"
        );
      }

      const list = Array.isArray(
        data?.results
      )
        ? data.results
        : [];

      setResults(list);
    } catch (err) {
      console.error(
        "公益搜尋錯誤：",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "公益搜尋失敗"
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // 分析單一公益組織
  // ============================================================

  async function analyzeCharity() {
    if (!url.trim()) {
      setError(
        "請輸入公益組織網址"
      );
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(
        "/api/charity",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "公益組織分析失敗"
        );
      }

      setResults([data]);
    } catch (err) {
      console.error(
        "公益分析錯誤：",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "公益分析失敗"
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // Enter
  // ============================================================

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
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

  function getName(
    item: CharityResult
  ) {
    return (
      item.organizationName ||
      item.name ||
      "公益組織"
    );
  }

  // ============================================================
  // 網址
  // ============================================================

  function getWebsite(
    item: CharityResult
  ) {
    return (
      item.url ||
      item.website ||
      ""
    );
  }

  // ============================================================
  // 類別
  // ============================================================

  function getCategory(
    item: CharityResult
  ) {
    if (
      Array.isArray(item.categories) &&
      item.categories.length > 0
    ) {
      return item.categories.join(
        "、"
      );
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

  function hasOnlineDonation(
    item: CharityResult
  ) {
    return (
      item.donation?.online ===
        true ||
      item.donation
        ?.hasOnlineDonation === true ||
      item.onlineDonation === true ||
      item.donation === true
    );
  }

  // ============================================================
  // 定期捐款
  // ============================================================

  function hasRecurringDonation(
    item: CharityResult
  ) {
    return (
      item.donation
        ?.hasRecurringDonation ===
        true ||
      item.recurringDonation === true
    );
  }

  // ============================================================
  // 實體據點
  // ============================================================

  function hasPhysicalStore(
    item: CharityResult
  ) {
    return (
      item.physicalStore
        ?.hasPhysicalStore ===
        true ||
      item.hasPhysicalStore ===
        true ||
      item.physicalStore === true ||
      !!item.address
    );
  }

  // ============================================================
  // 勸募資訊
  // ============================================================

  function getFundraisingNumber(
    item: CharityResult
  ) {
    return (
      item.fundraisingNumber ||
      item.fundraisingNo ||
      item.solicitationNumber ||
      item["勸募字號"] ||
      item["勸募核准文號"] ||
      item["勸募許可字號"] ||
      ""
    );
  }

  function hasFundraising(
    item: CharityResult
  ) {
    return (
      item.fundraising
        ?.hasFundraisingInfo ===
        true ||
      !!getFundraisingNumber(item)
    );
  }

  // ============================================================
  // Payment Score
  // ============================================================

  function getPaymentScore(
    item: CharityResult
  ) {
    if (
      typeof item.paymentScore ===
      "number"
    ) {
      return item.paymentScore;
    }

    if (
      hasRecurringDonation(item)
    ) {
      return 25;
    }

    if (
      hasOnlineDonation(item)
    ) {
      return 18;
    }

    return 0;
  }

  // ============================================================
  // Physical Score
  // ============================================================

  function getPhysicalScore(
    item: CharityResult
  ) {
    if (
      typeof item.physicalScore ===
      "number"
    ) {
      return item.physicalScore;
    }

    if (
      hasPhysicalStore(item)
    ) {
      return 10;
    }

    return 0;
  }

  // ============================================================
  // 開發建議
  // ============================================================

  function getRecommendation(
    item: CharityResult
  ) {
    if (item.recommendation) {
      return item.recommendation;
    }

    const recommendations: string[] =
      [];

    const donation =
      hasOnlineDonation(item);

    const recurring =
      hasRecurringDonation(item);

    const physical =
      hasPhysicalStore(item);

    const fundraising =
      hasFundraising(item);

    if (donation) {
      recommendations.push(
        "網站已有線上捐款需求，可優先洽談 EC／APP 捐款金流合作。"
      );
    }

    if (recurring) {
      recommendations.push(
        "網站具有定期捐款需求，可進一步洽談定期扣款與會員型金流。"
      );
    }

    if (physical) {
      recommendations.push(
        "網站具有實體服務據點，可進一步確認現場收款、POS 或其他支付需求。"
      );
    }

    if (fundraising) {
      recommendations.push(
        "網站具有公益勸募資訊，可進一步確認 APP 捐款專區合作資格。"
      );
    }

    if (
      recommendations.length === 0
    ) {
      return "具有一定公益合作潛力，可進一步確認付款、會員、預約或收費流程。";
    }

    return recommendations.join(
      " "
    );
  }

  // ============================================================
  // Excel 匯出
  //
  // 不需要勾選
  // 直接匯出目前所有結果
  // ============================================================

  function exportExcel() {
    if (results.length === 0) {
      setError(
        "目前沒有可以匯出的資料"
      );
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
      "開發建議",
    ];

    const rows =
      results.map((item) => {
        return [
          getName(item),
          getWebsite(item),
          getCategory(item),

          hasOnlineDonation(item)
            ? "是"
            : "否",

          hasRecurringDonation(item)
            ? "是"
            : "否",

          hasPhysicalStore(item)
            ? "是"
            : "否",

          getPaymentScore(item),

          getPhysicalScore(item),

          getFundraisingNumber(
            item
          ) || "未取得",

          getRecommendation(item),
        ];
      });

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text =
              String(
                value ?? ""
              );

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    // UTF-8 BOM
    const blob =
      new Blob(
        [
          "\uFEFF" +
            csvContent,
        ],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const downloadUrl =
      URL.createObjectURL(blob);

    const link =
      document.createElement(
        "a"
      );

    link.href =
      downloadUrl;

    link.download =
      `公益開發名單_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      downloadUrl
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <section className="space-y-6">

      {/* ======================================================
          Header
      ====================================================== */}

      <div className="bg-white rounded-2xl shadow-sm p-6">

        <div className="flex items-center gap-3">

          <div className="text-3xl">
            🏛️
          </div>

          <div>

            <h2 className="text-2xl font-bold">
              公益開發
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              尋找具線上捐款、EC、APP、POS 與公益金流合作機會的組織
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          Mode
      ====================================================== */}

      <div className="bg-white rounded-2xl shadow-sm p-2">

        <div className="grid grid-cols-2 gap-2">

          <button
            onClick={() => {
              setMode("search");
              setError("");
            }}
            className={
              mode === "search"
                ? "bg-black text-white rounded-xl px-5 py-4 font-bold"
                : "bg-white text-gray-600 rounded-xl px-5 py-4 font-medium hover:bg-gray-50"
            }
          >
            🔎 搜尋公益組織
          </button>

          <button
            onClick={() => {
              setMode("analyze");
              setError("");
            }}
            className={
              mode === "analyze"
                ? "bg-black text-white rounded-xl px-5 py-4 font-bold"
                : "bg-white text-gray-600 rounded-xl px-5 py-4 font-medium hover:bg-gray-50"
            }
          >
            🌐 分析公益組織
          </button>

        </div>

      </div>


      {/* ======================================================
          Search
      ====================================================== */}

      {mode === "search" && (

        <div className="bg-white rounded-2xl shadow-sm p-6">

          <h3 className="text-xl font-bold">
            🔎 搜尋公益組織
          </h3>

          <p className="text-gray-500 text-sm mt-1">
            輸入公益類型，自動搜尋相關基金會、協會與公益組織
          </p>

          <div className="mt-5 flex flex-col md:flex-row gap-3">

            <input
              value={keyword}
              onChange={(e) =>
                setKeyword(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="例如：老人照護、失智、兒少、動物保護、癌症醫療"
              className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            />

            <button
              onClick={
                searchCharity
              }
              disabled={loading}
              className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? "搜尋中..."
                : "搜尋公益"}
            </button>

          </div>


          {/* 快速分類 */}

          <div className="mt-5 flex flex-wrap gap-2">

            {[
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
              "社會福利",
            ].map(
              (item) => (

                <button
                  key={item}
                  onClick={() =>
                    setKeyword(item)
                  }
                  className="border rounded-full px-4 py-2 text-sm hover:bg-gray-100"
                >
                  {item}
                </button>

              )
            )}

          </div>

        </div>

      )}


      {/* ======================================================
          Analyze
      ====================================================== */}

      {mode === "analyze" && (

        <div className="bg-white rounded-2xl shadow-sm p-6">

          <h3 className="text-xl font-bold">
            🌐 分析公益組織
          </h3>

          <p className="text-gray-500 text-sm mt-1">
            輸入公益組織網站，自動分析線上捐款、實體據點與勸募資訊
          </p>

          <div className="mt-5 flex flex-col md:flex-row gap-3">

            <input
              value={url}
              onChange={(e) =>
                setUrl(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="例如：https://www.hospice.org.tw"
              className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            />

            <button
              onClick={
                analyzeCharity
              }
              disabled={loading}
              className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? "分析中..."
                : "開始分析"}
            </button>

          </div>

        </div>

      )}


      {/* ======================================================
          Error
      ====================================================== */}

      {error && (

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>

      )}


      {/* ======================================================
          Results
      ====================================================== */}

      {results.length > 0 && (

        <div className="space-y-4">


          {/* Results Header */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div>

              <h3 className="text-xl font-bold">
                🏛️ 公益開發名單
              </h3>

              <span className="text-sm text-gray-500">
                共 {results.length} 筆
              </span>

            </div>


            {/* =================================================
                Excel
            ================================================= */}

            <button
              onClick={
                exportExcel
              }
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 transition"
            >
              📊 匯出 Excel
            </button>

          </div>


          {/* ==================================================
              Cards
          ================================================== */}

          {results.map(
            (item, index) => {

              const name =
                getName(item);

              const website =
                getWebsite(item);

              const category =
                getCategory(item);

              const onlineDonation =
                hasOnlineDonation(
                  item
                );

              const recurring =
                hasRecurringDonation(
                  item
                );

              const physicalStore =
                hasPhysicalStore(
                  item
                );

              const fundraisingNumber =
                getFundraisingNumber(
                  item
                );

              const fundraising =
                hasFundraising(item);

              const paymentScore =
                getPaymentScore(item);

              const physicalScore =
                getPhysicalScore(item);

              const recommendation =
                getRecommendation(
                  item
                );

              return (

                <div
                  key={
                    website ||
                    `${name}-${index}`
                  }
                  className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition"
                >


                  {/* =================================================
                      Top
                  ================================================= */}

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                    <div className="min-w-0">

                      <h4 className="text-xl font-bold">
                        {name}
                      </h4>


                      {website && (

                        <a
                          href={
                            website
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {website}
                        </a>

                      )}


                      {/* 類別 */}

                      <div className="mt-2">

                        <span className="inline-flex bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                          類別：{category}
                        </span>

                      </div>

                    </div>


                    {/* =================================================
                        右上角合作標籤
                        
                        只有：
                        💳 線上捐款
                        🏪 實體據點
                        
                        沒有勸募
                        沒有 ECPOSAPP
                    ================================================= */}

                    <div className="flex flex-wrap gap-2 shrink-0">

                      {onlineDonation && (

                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                          💳 線上捐款
                        </span>

                      )}

                      {physicalStore && (

                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                          🏪 實體據點
                        </span>

                      )}

                    </div>

                  </div>


                  {/* =================================================
                      三大合作切入點
                  ================================================= */}

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">


                    {/* =================================================
                        線上捐款
                    ================================================= */}

                    <div className="border rounded-xl p-4">

                      <p className="text-xs text-gray-400">
                        線上捐款
                      </p>

                      <p className="font-bold mt-2">

                        {onlineDonation
                          ? "發現線上捐款"
                          : "未發現"}

                      </p>


                      <div className="mt-3">

                        <span className="text-sm font-medium">
                          Payment Score：
                        </span>

                        <span className="text-sm font-bold">
                          {paymentScore}
                        </span>

                      </div>


                      {onlineDonation && (

                        <p className="text-xs text-green-600 font-bold mt-2">
                          ✓ 可作為合作切入點
                        </p>

                      )}


                      {recurring && (

                        <p className="text-xs text-gray-500 mt-2">
                          ✓ 偵測到定期捐款
                        </p>

                      )}

                    </div>


                    {/* =================================================
                        實體據點
                    ================================================= */}

                    <div className="border rounded-xl p-4">

                      <p className="text-xs text-gray-400">
                        實體據點
                      </p>

                      <p className="font-bold mt-2">

                        {physicalStore
                          ? "發現實體據點"
                          : "未發現"}

                      </p>


                      <div className="mt-3">

                        <span className="text-sm font-medium">
                          Physical Score：
                        </span>

                        <span className="text-sm font-bold">
                          {physicalScore}
                        </span>

                      </div>


                      {physicalStore && (

                        <p className="text-xs text-green-600 font-bold mt-2">
                          ✓ 可作為合作切入點
                        </p>

                      )}

                    </div>


                    {/* =================================================
                        勸募
                    ================================================= */}

                    <div className="border rounded-xl p-4">

                      <p className="text-xs text-gray-400">
                        勸募資訊
                      </p>

                      <p className="font-bold mt-2">

                        {fundraisingNumber
                          ? fundraisingNumber
                          : "未發現"}

                      </p>


                      <div className="mt-3">

                        <span className="text-sm font-medium">
                          勸募字號：
                        </span>

                        <span className="text-sm font-bold">
                          {fundraising
                            ? "已取得"
                            : "未取得"}
                        </span>

                      </div>


                      {fundraising && (

                        <p className="text-xs text-green-600 font-bold mt-2">
                          ✓ 可作為合作切入點
                        </p>

                      )}

                    </div>

                  </div>


                  {/* =================================================
                      Contact
                  ================================================= */}

                  {(item.phone ||
                    item.address) && (

                    <div className="mt-4 text-sm text-gray-500 space-y-1">

                      {item.phone && (

                        <div>
                          📞{" "}
                          {item.phone}
                        </div>

                      )}

                      {item.address && (

                        <div>
                          📍{" "}
                          {item.address}
                        </div>

                      )}

                    </div>

                  )}


                  {/* =================================================
                      Recommendation
                  ================================================= */}

                  <div className="mt-5 bg-gray-50 rounded-xl p-4">

                    <p className="font-bold text-sm">
                      💡 開發建議
                    </p>

                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {
                        recommendation
                      }
                    </p>

                  </div>


                  {/* =================================================
                      Evidence
                  ================================================= */}

                  {Array.isArray(
                    item.evidence
                  ) &&
                    item.evidence
                      .length >
                      0 && (

                      <details className="mt-4">

                        <summary className="cursor-pointer text-sm font-bold text-gray-700 hover:text-black">
                          查看辨識證據
                        </summary>

                        <div className="mt-3 bg-gray-50 rounded-xl p-4">

                          <div className="flex flex-wrap gap-2">

                            {item.evidence.map(
                              (
                                evidence,
                                evidenceIndex
                              ) => (

                                <span
                                  key={`${evidence}-${evidenceIndex}`}
                                  className="bg-white border rounded-lg px-3 py-1 text-xs text-gray-600"
                                >
                                  {
                                    evidence
                                  }
                                </span>

                              )
                            )}

                          </div>

                        </div>

                      </details>

                    )}

                </div>

              );
            }
          )}

        </div>

      )}

    </section>
  );
}