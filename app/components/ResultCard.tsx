"use client";

import { useState } from "react";

type ResultItem = {
  url?: string;
  website?: string;
  name?: string;
  title?: string;
  companyName?: string;
  organizationName?: string;

  platform?: string;
  confidence?: number;
  score?: number;
  level?: string;

  features?: string[];
  reasons?: string[];

  phone?: string;
  address?: string;
  email?: string;

  [key: string]: any;
};

type Props = {
  item: ResultItem;
};

export default function ResultCard({ item }: Props) {
  const [expanded, setExpanded] = useState(false);

  const name =
    item.companyName ||
    item.name ||
    item.title ||
    item.organizationName ||
    "未命名商戶";

  const website =
    item.url ||
    item.website ||
    "";

  const platform =
    item.platform ||
    "未知平台";

  const confidence =
    typeof item.confidence === "number"
      ? item.confidence
      : null;

  const score =
    typeof item.score === "number"
      ? item.score
      : null;

  const features = Array.isArray(item.features)
    ? item.features
    : [];

  const reasons = Array.isArray(item.reasons)
    ? item.reasons
    : [];

  function getPlatformLabel() {
    const map: Record<string, string> = {
      shopline: "SHOPLINE",
      Shopify: "Shopify",
      shopify: "Shopify",
      "91APP": "91APP",
      Cyberbiz: "Cyberbiz",
      cyberbiz: "Cyberbiz",
      WACA: "WACA",
      easystore: "EasyStore",
      EasyStore: "EasyStore",
      gogoshop: "GoGoShop",
      meepShop: "meepShop",
    };

    return map[platform] || platform;
  }

  function getLevelLabel() {
    if (item.level) {
      return item.level;
    }

    if (score !== null) {
      if (score >= 80) return "高";
      if (score >= 50) return "中";
      return "低";
    }

    return "";
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">

      {/* ================================================== */}
      {/* Header */}
      {/* ================================================== */}

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
              🏪
            </div>

            <div className="min-w-0">

              <h3 className="text-lg font-bold text-gray-900 truncate">
                {name}
              </h3>

              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {website}
                </a>
              )}

            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* 開發等級 */}
        {/* ================================================== */}

        <div className="flex items-center gap-2 shrink-0">

          {getLevelLabel() && (
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
              {getLevelLabel()}
            </span>
          )}

          {confidence !== null && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
              {confidence}%
            </span>
          )}

        </div>

      </div>

      {/* ================================================== */}
      {/* Main information */}
      {/* ================================================== */}

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Platform */}

        <div className="border rounded-xl p-4">

          <p className="text-xs text-gray-400">
            平台
          </p>

          <p className="font-bold text-gray-900 mt-1">
            {getPlatformLabel()}
          </p>

        </div>

        {/* Score */}

        <div className="border rounded-xl p-4">

          <p className="text-xs text-gray-400">
            分數
          </p>

          <p className="font-bold text-gray-900 mt-1">
            {score !== null
              ? score
              : "-"}
          </p>

        </div>

        {/* 開發狀態 */}

        <div className="border rounded-xl p-4">

          <p className="text-xs text-gray-400">
            開發狀態
          </p>

          <p className="font-bold text-gray-900 mt-1">
            {score !== null
              ? score >= 80
                ? "值得優先開發"
                : score >= 50
                  ? "可以開發"
                  : "待觀察"
              : "待分析"}
          </p>

        </div>

      </div>

      {/* ================================================== */}
      {/* Features */}
      {/* ================================================== */}

      {features.length > 0 && (

        <div className="mt-5">

          <p className="text-sm font-bold text-gray-700 mb-2">
            🔍 偵測特徵
          </p>

          <div className="flex flex-wrap gap-2">

            {features.map(
              (feature, index) => (

                <span
                  key={`${feature}-${index}`}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                >
                  {feature}
                </span>

              )
            )}

          </div>

        </div>

      )}

      {/* ================================================== */}
      {/* Contact */}
      {/* ================================================== */}

      {(item.phone ||
        item.address ||
        item.email) && (

        <div className="mt-5 border-t pt-4">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">

            {item.phone && (
              <div>
                📞 {item.phone}
              </div>
            )}

            {item.address && (
              <div>
                📍 {item.address}
              </div>
            )}

            {item.email && (
              <div className="break-all">
                ✉️ {item.email}
              </div>
            )}

          </div>

        </div>

      )}

      {/* ================================================== */}
      {/* Reasons */}
      {/* ================================================== */}

      {reasons.length > 0 && (

        <div className="mt-5">

          <button
            onClick={() =>
              setExpanded(!expanded)
            }
            className="text-sm font-bold text-gray-700 hover:text-black"
          >
            {expanded
              ? "▲ 隱藏分析原因"
              : "▼ 查看分析原因"}
          </button>

          {expanded && (

            <div className="mt-3 bg-gray-50 rounded-xl p-4">

              <ul className="space-y-2">

                {reasons.map(
                  (reason, index) => (

                    <li
                      key={`${reason}-${index}`}
                      className="text-sm text-gray-600"
                    >
                      • {reason}
                    </li>

                  )
                )}

              </ul>

            </div>

          )}

        </div>

      )}

      {/* ================================================== */}
      {/* Footer */}
      {/* ================================================== */}

      <div className="mt-5 flex items-center justify-between">

        <div className="text-xs text-gray-400">
          商戶開發名單
        </div>

        {website && (

          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800"
          >
            開啟網站 →
          </a>

        )}

      </div>

    </div>
  );
}