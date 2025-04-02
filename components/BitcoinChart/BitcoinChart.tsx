"use client"; 

import React, { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
} from "lightweight-charts";
import { Timeframe, Theme } from "@/types";
import { useChartData } from "@/hooks/useChartData";
import debounce from "lodash/debounce";

export interface ChartColors {
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  volumeUpColor: string;
  volumeDownColor: string;
}

interface BitcoinChartProps {
  timeframe: Timeframe;
  theme: Theme;
  volumeHeight?: number; // Chiều cao của biểu đồ khối lượng (0-1)
  colors?: Partial<ChartColors>;
  onColorsChange?: (colors: ChartColors) => void;
}

const DEFAULT_COLORS: ChartColors = {
  upColor: "#26a69a",
  downColor: "#ef5350",
  wickUpColor: "#26a69a",
  wickDownColor: "#ef5350",
  volumeUpColor: "#26a69a",
  volumeDownColor: "#ef5350",
};

export const BitcoinChart: React.FC<BitcoinChartProps> = ({
  timeframe,
  theme,
  volumeHeight = 0.3, // Mặc định là 30% chiều cao
  colors: customColors,
  // onColorsChange,
}) => {
  const colors = { ...DEFAULT_COLORS, ...customColors };
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const { candlestickData, volumeData, hasMore, isLoading, loadOlderData } =
    useChartData(timeframe);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Xóa chart cũ nếu có
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Khởi tạo chart mới
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: theme === "dark" ? "#1e222d" : "#ffffff",
        },
        textColor: theme === "dark" ? "#d1d4dc" : "#191919",
      },
      grid: {
        vertLines: { color: theme === "dark" ? "#2B2B43" : "#f0f0f0" },
        horzLines: { color: theme === "dark" ? "#2B2B43" : "#f0f0f0" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: colors.upColor,
      downColor: colors.downColor,
      borderVisible: false,
      wickUpColor: colors.wickUpColor,
      wickDownColor: colors.wickDownColor,
    });

    const volumeSeries = chart.addHistogramSeries({
      color: colors.volumeUpColor,
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 1 - volumeHeight,
        bottom: 0,
      },
    });

    // Cập nhật dữ liệu ngay sau khi tạo series
    if (candlestickData.length > 0) {
      const sortedCandlesticks = [...candlestickData].sort(
        (a, b) => Number(a.time) - Number(b.time)
      );
      const sortedVolumes = [...volumeData].sort(
        (a, b) => Number(a.time) - Number(b.time)
      );

      // Cập nhật màu sắc cho volume dựa trên giá đóng cửa và mở cửa
      const coloredVolumes = sortedVolumes.map((volume, index) => ({
        ...volume,
        color:
          sortedCandlesticks[index]?.close >= sortedCandlesticks[index]?.open
            ? colors.volumeUpColor
            : colors.volumeDownColor,
      }));

      candlestickSeries.setData(sortedCandlesticks);
      volumeSeries.setData(coloredVolumes);
      chart.timeScale().fitContent();
    }

    // Xử lý sự kiện kéo chart
    const handleTimeRangeChange = debounce((params: { from: number }) => {
      if (
        hasMore &&
        !isLoading &&
        candlestickData.length > 0 &&
        params.from <= Number(candlestickData[0].time)
      ) {
        loadOlderData();
      }
    }, 300);

    chart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
      if (timeRange) {
        handleTimeRangeChange({ from: Number(timeRange.from) });
      }
    });

    // Lưu references
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Cleanup
    return () => {
      handleTimeRangeChange.cancel();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, [theme, volumeHeight, timeframe, candlestickData, volumeData, colors]);

  // Xử lý responsive
  useEffect(() => {
    const handleResize = debounce(() => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    }, 300);

    window.addEventListener("resize", handleResize);
    return () => {
      handleResize.cancel();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white">Đang tải dữ liệu...</div>
        </div>
      )}
    </div>
  );
};
