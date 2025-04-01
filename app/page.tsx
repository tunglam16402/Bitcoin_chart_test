// src/app/page.tsx
"use client"; // This page interacts with hooks and state, needs to be a client component

import React, { useState, useEffect } from "react";
import { BitcoinChart } from "@/components/BitcoinChart/BitcoinChart";
import { ChartControls } from "@/components/BitcoinChart/ChartControls";
import { useBitcoinChartData } from "@/hooks/useBitcoinChartData";
import { useTheme } from "@/components/Providers/ThemeProvider"; // Use the theme hook
// import { timeframes } from "@/config/chartConfig";
import { Timeframe } from "@/types";

export default function ChartPage() {
  const { theme, toggleTheme } = useTheme(); // Get theme state and toggle function
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>("1h"); // Default timeframe

  const {
    candlestickData,
    volumeData,
    loadingInitial,
    loadingOlder,
    error,
    currentPrices,
    hasMoreOlderData,
    fetchInitialData,
    fetchOlderData,
    fetchCurrentPrices,
  } = useBitcoinChartData(currentTimeframe); // Initialize hook with default timeframe

  // Fetch initial data when component mounts or timeframe changes
  useEffect(() => {
    fetchInitialData(currentTimeframe);
  }, [currentTimeframe, fetchInitialData]); // fetchInitialData is memoized by useCallback in the hook

  const handleTimeframeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCurrentTimeframe(event.target.value as Timeframe);
    // The useEffect above will trigger fetchInitialData
  };

  // State for price loading indicator (optional, hook doesn't track this)
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const handleFetchPrices = async () => {
    setIsLoadingPrices(true);
    await fetchCurrentPrices();
    setIsLoadingPrices(false);
  };

  return (
    // Use theme for background of the whole page container
    <div
      className={`p-4 ${
        theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-gray-100 text-gray-800"
      } transition-colors duration-300 min-h-screen`}
    >
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center sm:text-left">
        Biểu đồ Bitcoin (BTC/USDT) - Binance
      </h1>

      <ChartControls
        theme={theme}
        currentTimeframe={currentTimeframe}
        currentPrices={currentPrices}
        isLoadingPrices={isLoadingPrices}
        onThemeToggle={toggleTheme} // Pass toggle function from context
        onTimeframeChange={handleTimeframeChange}
        onFetchPrices={handleFetchPrices}
      />

      <BitcoinChart
        theme={theme}
        timeframe={currentTimeframe}
        candlestickData={candlestickData}
        volumeData={volumeData}
        onLoadOlderData={fetchOlderData} // Pass fetchOlderData from hook
        hasMoreOlderData={hasMoreOlderData}
        isLoadingOlder={loadingOlder}
        isLoadingInitial={loadingInitial}
        error={error}
      />

      {/* Instructions/Info */}
      <div
        className={`mt-3 text-xs sm:text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        * Sử dụng chuột/touch để kéo (pan) và lăn chuột/pinch để phóng to
        (zoom). Kéo sang trái để tải thêm dữ liệu cũ.
      </div>
    </div>
  );
}
