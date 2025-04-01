// src/components/BitcoinChart/BitcoinChart.tsx
"use client"; // Mark this component as a Client Component

import React, { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
  DeepPartial,
  LogicalRangeChangeEventHandler,
  VisibleTimeRangeChangeEventHandler,
  TimeRange,
} from "lightweight-charts";
import {
  getChartOptions,
  candlestickSeriesOptions,
  volumeSeriesOptions,
  VISIBLE_RANGE_LOAD_THRESHOLD,
} from "@/config/chartConfig";
import { ChartTheme, Timeframe } from "@/types";

interface BitcoinChartProps {
  theme: ChartTheme;
  timeframe: Timeframe;
  candlestickData: CandlestickData<Time>[];
  volumeData: HistogramData<Time>[];
  onLoadOlderData: () => void; // Callback để trigger tải dữ liệu cũ từ hook
  hasMoreOlderData: boolean; // Cờ báo còn dữ liệu cũ không
  isLoadingOlder: boolean; // Cờ báo đang tải dữ liệu cũ
  isLoadingInitial: boolean; // Cờ báo đang tải dữ liệu ban đầu
  error: string | null; // Thông báo lỗi
}

export const BitcoinChart: React.FC<BitcoinChartProps> = ({
  theme,
  timeframe,
  candlestickData,
  volumeData,
  onLoadOlderData,
  hasMoreOlderData,
  isLoadingOlder,
  isLoadingInitial,
  error,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const isInitialLoadComplete = useRef<boolean>(false); // Track initial fitContent

  const memoizedChartOptions = useCallback(
    () => getChartOptions(theme, timeframe),
    [theme, timeframe]
  );

  // --- Initialize Chart and Handle Resize ---
  useEffect(() => {
    if (!chartContainerRef.current) return;
    isInitialLoadComplete.current = false; // Reset fit flag on re-init

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const chartOptions = memoizedChartOptions(); // Lấy options đã memoized
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = chart;

    // Add Series
    candlestickSeriesRef.current = chart.addCandlestickSeries(
      candlestickSeriesOptions
    );
    volumeSeriesRef.current = chart.addHistogramSeries(volumeSeriesOptions);

    // Apply specific volume price scale options
    chart.priceScale("volume").applyOptions(chartOptions.volumePriceScale);

    // Resize Observer
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // Visible Time Range Change Listener (for loading older data)
    const handleVisibleTimeRangeChange: VisibleTimeRangeChangeEventHandler = (
      timeRange: TimeRange | null
    ) => {
      if (
        !timeRange ||
        !chartRef.current ||
        isLoadingOlder ||
        !hasMoreOlderData ||
        !isInitialLoadComplete.current
      ) {
        return; // Don't trigger if loading, no more data, or initial load not finished fitting
      }
      const logicalRange = chartRef.current
        .timeScale()
        .getVisibleLogicalRange();
      if (logicalRange && logicalRange.from < VISIBLE_RANGE_LOAD_THRESHOLD) {
        console.log(
          "Chart: Visible range near start, triggering load older data."
        );
        onLoadOlderData(); // Gọi callback từ hook
      }
    };
    chart
      .timeScale()
      .subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        try {
          // It's good practice to unsubscribe, though remove() should handle it
          chartRef.current
            .timeScale()
            .unsubscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange);
        } catch (e) {
          console.warn("Error unsubscribing from time scale:", e);
        }
        chartRef.current.remove();
        chartRef.current = null;
      }
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      console.log("Chart removed");
    };
    // Dependencies: Chỉ re-init chart nếu theme hoặc timeframe thay đổi (do options thay đổi)
    // Hoặc nếu callback load older data thay đổi (ít khi xảy ra với useCallback)
  }, [
    theme,
    timeframe,
    onLoadOlderData,
    hasMoreOlderData,
    isLoadingOlder,
    memoizedChartOptions,
  ]); // Include memoized options

  // --- Effect for Updating Chart Data ---
  useEffect(() => {
    if (candlestickSeriesRef.current && candlestickData) {
      // console.log("Chart: Applying candlestick data", candlestickData.length);
      candlestickSeriesRef.current.setData(candlestickData);
    }
    if (volumeSeriesRef.current && volumeData) {
      // console.log("Chart: Applying volume data", volumeData.length);
      volumeSeriesRef.current.setData(volumeData);
    }

    // Fit content only once after the initial data for a timeframe is loaded and applied
    if (
      chartRef.current &&
      !isLoadingInitial &&
      candlestickData.length > 0 &&
      !isInitialLoadComplete.current
    ) {
      console.log("Chart: Initial data loaded, fitting content.");
      chartRef.current.timeScale().fitContent();
      isInitialLoadComplete.current = true; // Mark initial fit as done for this timeframe load
    }
  }, [candlestickData, volumeData, isLoadingInitial]); // Re-run when data changes or initial loading finishes

  // --- Effect for Applying Theme Options (without re-initializing) ---
  // This might be redundant if the main useEffect re-initializes on theme change,
  // but applyOptions is generally cheaper. Keeping it might be slightly faster if only theme changes.
  useEffect(() => {
    if (chartRef.current) {
      const chartOptions = memoizedChartOptions();
      chartRef.current.applyOptions({
        layout: chartOptions.layout,
        grid: chartOptions.grid,
        rightPriceScale: chartOptions.rightPriceScale,
        timeScale: chartOptions.timeScale,
        crosshair: chartOptions.crosshair,
      });
      chartRef.current
        .priceScale("volume")
        .applyOptions(chartOptions.volumePriceScale);
      // Note: Series options (like colors) are usually set once or within data.
      // If you need to dynamically change series colors with theme, do it here.
    }
  }, [theme, timeframe, memoizedChartOptions]); // Apply options if theme/timeframe changes

  return (
    <div className="relative h-[450px] sm:h-[550px] lg:h-[600px] w-full">
      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className={`absolute top-0 left-0 w-full h-full rounded shadow overflow-hidden ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      />

      {/* Loading Overlay */}
      {(isLoadingInitial || isLoadingOlder) && (
        <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-sm z-10 transition-opacity duration-300">
          <div
            className={`text-lg font-medium ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            {isLoadingInitial
              ? "Đang tải biểu đồ..."
              : "Đang tải dữ liệu cũ..."}
          </div>
          {/* Optional: Add a spinner here */}
        </div>
      )}

      {/* Error Overlay */}
      {error &&
        !isLoadingInitial && ( // Show error only if not initial loading
          <div className="absolute inset-0 flex items-center justify-center bg-opacity-70 bg-red-100 z-10 p-4 rounded transition-opacity duration-300">
            <p className="text-red-700 font-medium text-center">Lỗi: {error}</p>
          </div>
        )}

      {/* No More Data Indicator (Optional) */}
      {!hasMoreOlderData &&
        !isLoadingOlder &&
        !isLoadingInitial &&
        candlestickData.length > 0 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs rounded bg-gray-500 bg-opacity-70 text-white z-5">
            Đã tải hết dữ liệu cũ
          </div>
        )}
    </div>
  );
};
