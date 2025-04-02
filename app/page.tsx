"use client";

import { useState } from "react";
import { ChartContainer } from "@/components/BitcoinChart/ChartContainer";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Timeframe, Theme } from "@/types";

const timeframes: Timeframe[] = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
  "1w",
  "1M",
];

export default function Home() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");

  const toggleTheme = () =>
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));

  const renderTimeframeButton = (tf: Timeframe) => {
    const isActive = timeframe === tf;
    const themeClasses =
      theme === "dark"
        ? isActive
          ? "bg-blue-600 text-white"
          : "bg-gray-700 text-gray-300"
        : isActive
        ? "bg-blue-500 text-white"
        : "bg-gray-200 text-gray-700";

    return (
      <button
        key={tf}
        onClick={() => setTimeframe(tf)}
        className={`px-3 py-1 rounded ${themeClasses}`}
      >
        {tf}
      </button>
    );
  };

  return (
    <main
      className={`min-h-screen ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Biểu Đồ Bitcoin</h1>

          <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
            {timeframes.map(renderTimeframeButton)}
          </div>

          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded ${
              theme === "dark"
                ? "bg-gray-700 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {theme === "dark" ? "🌞 Sáng" : "🌙 Tối"}
          </button>
        </div>
        {/* giá hiện tại + 1 phút trc */}
        <PriceDisplay theme={theme} timeframe={timeframe} />

        <div
          className={`h-[680px] rounded-lg overflow-hidden ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <ChartContainer timeframe={timeframe} theme={theme} />
        </div>
      </div>
    </main>
  );
}
