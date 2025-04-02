import { useState, useEffect, useCallback } from "react";
import { getKlines } from "@/lib/binanceApi";
import { Timeframe, CandlestickData, VolumeData, ChartState } from "@/types";
import { Time } from "lightweight-charts";

// Số lượng nến tối đa mỗi lần tải
const CANDLES_PER_REQUEST = 500;

// Hook để quản lý dữ liệu chart
export const useChartData = (timeframe: Timeframe) => {
  const [state, setState] = useState<ChartState>({
    candlestickData: [],
    volumeData: [],
    hasMore: true,
    isLoading: false,
    error: null,
  });

  // Hàm chuyển đổi dữ liệu từ Binance sang định dạng chart
  const transformKlineData = useCallback(
    (klines: Array<(string | number)[]>) => {
      const candlestickData: CandlestickData[] = [];
      const volumeData: VolumeData[] = [];

      klines.forEach((kline) => {
        const timestamp = Math.floor(Number(kline[0]) / 1000);
        const open = Number(kline[1]);
        const high = Number(kline[2]);
        const low = Number(kline[3]);
        const close = Number(kline[4]);
        const volume = Number(kline[5]);

        candlestickData.push({
          time: timestamp as Time,
          open,
          high,
          low,
          close,
        });

        volumeData.push({
          time: timestamp as Time,
          value: volume,
          color: close >= open ? "#26a69a" : "#ef5350",
        });
      });

      // Sắp xếp dữ liệu theo thời gian tăng dần
      candlestickData.sort((a, b) => Number(a.time) - Number(b.time));
      volumeData.sort((a, b) => Number(a.time) - Number(b.time));

      return { candlestickData, volumeData };
    },
    []
  );

  // Hàm tải dữ liệu
  const fetchData = useCallback(
    async (isOlder: boolean = false) => {
      if (state.isLoading) return;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        let endTime: number | undefined;
        if (isOlder && state.candlestickData.length > 0) {
          const oldestCandle = state.candlestickData[0];
          endTime = Number(oldestCandle.time);
        }

        const klines = await getKlines(
          timeframe,
          CANDLES_PER_REQUEST,
          endTime ? endTime * 1000 : undefined
        );

        if (klines.length === 0) {
          setState((prev) => ({
            ...prev,
            hasMore: false,
            isLoading: false,
          }));
          return;
        }

        const { candlestickData: newCandlesticks, volumeData: newVolumes } =
          transformKlineData(klines);

        setState((prev) => {
          // Kết hợp dữ liệu mới và cũ
          const combinedCandlesticks = isOlder
            ? [...newCandlesticks, ...prev.candlestickData]
            : newCandlesticks;

          const combinedVolumes = isOlder
            ? [...newVolumes, ...prev.volumeData]
            : newVolumes;

          // Loại bỏ dữ liệu trùng lặp và sắp xếp lại
          const uniqueCandlesticks = Array.from(
            new Map(
              combinedCandlesticks.map((candle) => [
                Number(candle.time),
                candle,
              ])
            ).values()
          ).sort((a, b) => Number(a.time) - Number(b.time));

          const uniqueVolumes = Array.from(
            new Map(
              combinedVolumes.map((vol) => [Number(vol.time), vol])
            ).values()
          ).sort((a, b) => Number(a.time) - Number(b.time));

          return {
            candlestickData: uniqueCandlesticks,
            volumeData: uniqueVolumes,
            hasMore: klines.length >= CANDLES_PER_REQUEST,
            isLoading: false,
            error: null,
          };
        });
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Lỗi không xác định",
          isLoading: false,
        }));
      }
    },
    [timeframe, state.isLoading, state.candlestickData, transformKlineData]
  );

  // Tải dữ liệu ban đầu khi timeframe thay đổi
  useEffect(() => {
    setState({
      candlestickData: [],
      volumeData: [],
      hasMore: true,
      isLoading: false,
      error: null,
    });
    fetchData(false);
  }, [fetchData, timeframe]);

  // Hàm tải dữ liệu cũ hơn
  const loadOlderData = useCallback(() => {
    if (!state.isLoading && state.hasMore) {
      fetchData(true);
    }
  }, [state.isLoading, state.hasMore, fetchData]);

  return {
    ...state,
    loadOlderData,
  };
};
