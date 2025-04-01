// src/hooks/useBitcoinChartData.ts
import { useState, useCallback, useRef } from "react";
import { Time, UTCTimestamp } from "lightweight-charts";
import {
  Timeframe,
  PriceInfo,
  CandlestickData,
  HistogramData,
  BitcoinChartDataState,
  BitcoinChartDataActions,
} from "@/types";
import {
  getKlines,
  getTickerPrice,
  getPreviousMinuteClosePrice,
} from "@/lib/binanceApi";
import { transformKlineData } from "@/lib/utils";
import { INITIAL_LIMIT, LOAD_MORE_LIMIT } from "@/config/chartConfig";

const initialState: BitcoinChartDataState = {
  candlestickData: [],
  volumeData: [],
  loadingInitial: false,
  loadingOlder: false,
  error: null,
  currentPrices: { current: null, previous: null },
  hasMoreOlderData: true, // Mặc định là true, sẽ set false nếu API trả về ít hơn yêu cầu hoặc lỗi 400
};

export const useBitcoinChartData = (
  initialTimeframe: Timeframe
): BitcoinChartDataState & BitcoinChartDataActions => {
  const [state, setState] = useState<BitcoinChartDataState>(initialState);
  const oldestTimestampMs = useRef<number | null>(null); // Dùng ref để không trigger re-render khi timestamp thay đổi
  const currentFetchingTimeframe = useRef<Timeframe>(initialTimeframe); // Lưu timeframe đang fetch để tránh race condition

  const processAndSetData = (
    klines: BinanceKlineData[],
    isPrepending: boolean = false
  ) => {
    const newCandles: CandlestickData<Time>[] = [];
    const newVolumes: HistogramData<Time>[] = [];
    let batchOldestTimestampMs: number | null = null;

    for (const kline of klines) {
      const transformed = transformKlineData(kline);
      if (transformed) {
        newCandles.push(transformed.candle);
        newVolumes.push(transformed.volume);
        const timestampMs = kline[0] as number;
        if (
          batchOldestTimestampMs === null ||
          timestampMs < batchOldestTimestampMs
        ) {
          batchOldestTimestampMs = timestampMs;
        }
      }
    }

    // Sắp xếp lô mới trước
    newCandles.sort((a, b) => (a.time as number) - (b.time as number));
    newVolumes.sort((a, b) => (a.time as number) - (b.time as number));

    setState((prevState) => {
      let combinedCandles: CandlestickData<Time>[];
      let combinedVolumes: HistogramData<Time>[];

      if (isPrepending) {
        // Kết hợp dữ liệu mới và cũ
        combinedCandles = [...newCandles, ...prevState.candlestickData];
        combinedVolumes = [...newVolumes, ...prevState.volumeData];
      } else {
        // Dữ liệu ban đầu
        combinedCandles = newCandles;
        combinedVolumes = newVolumes;
      }

      // **BƯỚC 1: Sắp xếp lại toàn bộ (Đã làm ở phiên bản trước)**
      combinedCandles.sort((a, b) => (a.time as number) - (b.time as number));
      // Giả định volume và candle luôn tương ứng index sau khi sort time
      // Cần đảm bảo logic này đúng hoặc tìm cách map volume với candle chắc chắn hơn
      combinedVolumes.sort((a, b) => (a.time as number) - (b.time as number));

      // **BƯỚC 2: Lọc bỏ các timestamp trùng lặp**
      const uniqueCandles: CandlestickData<Time>[] = [];
      const uniqueVolumes: HistogramData<Time>[] = [];
      const seenTimestamps = new Set<Time>(); // Dùng Set để kiểm tra hiệu quả

      for (let i = 0; i < combinedCandles.length; i++) {
        const candle = combinedCandles[i];
        // Cố gắng lấy volume tương ứng - cần đảm bảo chúng luôn khớp index
        const volume = combinedVolumes[i];

        if (candle && volume && !seenTimestamps.has(candle.time)) {
          uniqueCandles.push(candle);
          uniqueVolumes.push(volume); // Chỉ thêm volume nếu candle tương ứng được thêm
          seenTimestamps.add(candle.time);
        } else if (candle && seenTimestamps.has(candle.time)) {
          // Log ra để biết có trùng lặp xảy ra
          console.warn(
            `Duplicate timestamp detected and removed: ${candle.time}`
          );
        }
        // Trường hợp volume không khớp index hoặc candle/volume bị null cũng sẽ bị bỏ qua
        else if (!candle || !volume) {
          console.warn(
            `Mismatch or null data at index ${i} during duplicate removal.`
          );
        }
      }

      const finalCandles = uniqueCandles;
      const finalVolumes = uniqueVolumes;
      // **KẾT THÚC LỌC TRÙNG LẶP**

      // Cập nhật ref timestamp cũ nhất dựa trên mảng cuối cùng (đã lọc)
      if (finalCandles.length > 0) {
        const absoluteOldestTimestamp =
          (finalCandles[0].time as UTCTimestamp) * 1000;
        oldestTimestampMs.current = absoluteOldestTimestamp;
      } else {
        oldestTimestampMs.current = null;
      }

      return {
        ...prevState,
        candlestickData: finalCandles,
        volumeData: finalVolumes,
      };
    });
  };

  const fetchInitialData = useCallback(async (tf: Timeframe) => {
    console.log(`Hook: Fetching initial data for ${tf}`);
    currentFetchingTimeframe.current = tf; // Set timeframe hiện tại
    setState((prev) => ({
      ...initialState,
      loadingInitial: true,
      hasMoreOlderData: true,
    })); // Reset state khi đổi timeframe
    oldestTimestampMs.current = null;

    try {
      const klines = await getKlines(tf, INITIAL_LIMIT);
      // Kiểm tra lại timeframe trước khi set state để tránh race condition nếu người dùng đổi tf nhanh
      if (tf !== currentFetchingTimeframe.current) {
        console.log(
          `Hook: Timeframe changed during fetch (${tf} vs ${currentFetchingTimeframe.current}). Aborting set state.`
        );
        return;
      }

      if (klines.length < INITIAL_LIMIT) {
        console.log(
          "Hook: Initial fetch returned fewer items than limit, assuming no more older data."
        );
        setState((prev) => ({ ...prev, hasMoreOlderData: false }));
      }
      processAndSetData(klines, false);
    } catch (err) {
      if (tf === currentFetchingTimeframe.current) {
        // Chỉ set lỗi nếu lỗi thuộc về timeframe hiện tại
        console.error("Hook: Error fetching initial data:", err);
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Unknown error",
          candlestickData: [],
          volumeData: [],
        }));
      }
    } finally {
      if (tf === currentFetchingTimeframe.current) {
        setState((prev) => ({ ...prev, loadingInitial: false }));
      }
    }
  }, []); // Dependencies trống vì hàm tự chứa logic, không phụ thuộc state ngoài timeframe

  const fetchOlderData = useCallback(async () => {
    if (
      state.loadingOlder ||
      !oldestTimestampMs.current ||
      !state.hasMoreOlderData
    ) {
      // console.log("Hook: Skipping fetch older data", { loadingOlder: state.loadingOlder, hasTimestamp: !!oldestTimestampMs.current, hasMore: state.hasMoreOlderData });
      return;
    }

    console.log(
      `Hook: Fetching older data before ${oldestTimestampMs.current}`
    );
    setState((prev) => ({ ...prev, loadingOlder: true, error: null })); // Xóa lỗi cũ khi thử tải lại

    const tf = currentFetchingTimeframe.current; // Lấy timeframe hiện tại đang hiển thị

    try {
      // endTime là timestamp của nến *cũ nhất* hiện có, trừ 1ms để không lấy lại nến đó
      const endTime = oldestTimestampMs.current - 1;
      const klines = await getKlines(tf, LOAD_MORE_LIMIT, endTime);

      // Kiểm tra nếu timeframe đã thay đổi trong lúc fetch
      if (tf !== currentFetchingTimeframe.current) {
        console.log(
          `Hook: Timeframe changed during fetch older data (${tf} vs ${currentFetchingTimeframe.current}). Aborting set state.`
        );
        setState((prev) => ({ ...prev, loadingOlder: false })); // Dừng loading
        return;
      }

      if (klines.length === 0) {
        console.log("Hook: No more older data found.");
        setState((prev) => ({ ...prev, hasMoreOlderData: false }));
      } else {
        processAndSetData(klines, true); // Nối dữ liệu cũ vào đầu
        // Nếu API trả về ít hơn yêu cầu, có thể là đã hết dữ liệu cũ
        if (klines.length < LOAD_MORE_LIMIT) {
          console.log(
            "Hook: Fetched older data returned fewer items than limit, assuming no more older data."
          );
          setState((prev) => ({ ...prev, hasMoreOlderData: false }));
        }
      }
    } catch (err: any) {
      if (tf === currentFetchingTimeframe.current) {
        // Chỉ set lỗi nếu lỗi thuộc về timeframe hiện tại
        console.error("Hook: Error fetching older data:", err);
        // Nếu lỗi 400 Bad Request, thường là do endTime quá xa trong quá khứ -> hết dữ liệu
        if (err.message && err.message.includes("status 400")) {
          console.log("Hook: Received 400 error, assuming no more older data.");
          setState((prev) => ({
            ...prev,
            hasMoreOlderData: false,
            error: "Không tìm thấy dữ liệu cũ hơn.",
          }));
        } else {
          setState((prev) => ({
            ...prev,
            error:
              err instanceof Error
                ? err.message
                : "Unknown error fetching older data",
          }));
        }
      }
    } finally {
      if (tf === currentFetchingTimeframe.current) {
        setState((prev) => ({ ...prev, loadingOlder: false }));
      }
    }
  }, [state.loadingOlder, state.hasMoreOlderData]); // Phụ thuộc vào các cờ state

  const fetchCurrentPrices = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null })); // Clear previous price errors
    try {
      const [tickerData, prevClose] = await Promise.all([
        getTickerPrice(),
        getPreviousMinuteClosePrice(),
      ]);

      const currentPrice = parseFloat(tickerData.price);
      setState((prev) => ({
        ...prev,
        currentPrices: {
          current: isNaN(currentPrice) ? null : currentPrice,
          previous: prevClose,
        },
      }));
    } catch (err) {
      console.error("Hook: Error fetching current prices:", err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Error fetching prices",
        currentPrices: { current: null, previous: null }, // Reset prices on error
      }));
    }
  }, []);

  return {
    ...state,
    fetchInitialData,
    fetchOlderData,
    fetchCurrentPrices,
  };
};
