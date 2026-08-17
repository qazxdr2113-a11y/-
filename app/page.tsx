"use client";

import { useState } from "react";
import GeneralMerchant from "./components/GeneralMerchant";
import CharityDevelopment from "./components/CharityDevelopment";

export default function Page() {
    const [mainMode, setMainMode] = useState<
        "merchant" | "charity"
    >("merchant");

    return (
        <main className="min-h-screen bg-gray-100">

            {/* Header */}
            <header className="bg-black text-white">
                <div className="max-w-7xl mx-auto px-6 py-6">

                    <h1 className="text-3xl font-bold">
                        PayLead Finder
                    </h1>

                    <p className="text-gray-300 mt-1">
                        全支付開發名單工具
                    </p>

                </div>
            </header>


            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* 主分類 */}

                <div className="bg-white rounded-2xl shadow-sm p-2">

                    <div className="grid grid-cols-2 gap-2">

                        {/* 一般商戶 */}

                        <button
                            onClick={() =>
                                setMainMode("merchant")
                            }
                            className={
                                mainMode === "merchant"
                                    ? "bg-black text-white rounded-xl px-6 py-5 font-bold text-lg"
                                    : "bg-white text-gray-600 rounded-xl px-6 py-5 font-medium text-lg hover:bg-gray-50"
                            }
                        >
                            🌐 一般商戶
                        </button>


                        {/* 公益開發 */}

                        <button
                            onClick={() =>
                                setMainMode("charity")
                            }
                            className={
                                mainMode === "charity"
                                    ? "bg-black text-white rounded-xl px-6 py-5 font-bold text-lg"
                                    : "bg-white text-gray-600 rounded-xl px-6 py-5 font-medium text-lg hover:bg-gray-50"
                            }
                        >
                            🏛️ 公益開發
                        </button>

                    </div>

                </div>


                {/* 主內容 */}

                <div className="mt-8">

                    {mainMode === "merchant" && (
                        <GeneralMerchant />
                    )}

                    {mainMode === "charity" && (
                        <CharityDevelopment />
                    )}

                </div>

            </div>

        </main>
    );
}