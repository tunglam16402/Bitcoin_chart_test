// src/lib/utils.ts
import { BinanceKlineData, TransformedKlineData } from "@/types";
import { CandlestickData, HistogramData, Time, UTCTimestamp } from "lightweight-charts";

// Hàm chuyển đổi dữ liệu từ Binance API
export const transformKlineData = (kline: BinanceKlineData): TransformedKlineData | null => {
    try {
        const time = (kline[0] / 1000) as UTCTimestamp; // ms to seconds
        const open = parseFloat(kline[1] as string);
        const high = parseFloat(kline[2] as string);
        const low = parseFloat(kline[3] as string);
        const close = parseFloat(kline[4] as string);
        const volume = parseFloat(kline[5] as string);

        // Kiểm tra dữ liệu hợp lệ
        if (isNaN(time) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || isNaN(volume) || volume < 0) {
            console.warn("Skipping invalid kline data:", kline);
            return null;
        }

        const candle: CandlestickData<Time> = { time, open, high, low, close };
        const volumeBar: HistogramData<Time> = {
            time,
            value: volume,
            color: close >= open ? 'rgba(38, 166, 154, 0.7)' : 'rgba(239, 83, 80, 0.7)', // Màu volume dựa trên giá đóng/mở
        };
        return { candle, volume: volumeBar };
    } catch (error) {
        console.error("Error transforming kline data:", kline, error);
        return null;
    }
};