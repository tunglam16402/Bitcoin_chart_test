// src/types/index.ts
import { CandlestickData, HistogramData, Time, UTCTimestamp } from 'lightweight-charts';

export type ChartTheme = 'light' | 'dark';
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M';

// Interface từ API Binance (có thể chi tiết hơn nếu cần)
export interface BinanceKlineData extends Array<string | number> {
    0: number; // Kline open time (ms)
    1: string; // Open price
    2: string; // High price
    3: string; // Low price
    4: string; // Close price
    5: string; // Volume
    6: number; // Kline close time (ms)
    // ... các trường khác nếu cần
}

// Dữ liệu giá hiện tại và quá khứ
export interface PriceInfo {
    current: number | null;
    previous: number | null;
}

// Kiểu dữ liệu đã được chuyển đổi cho chart
export interface TransformedKlineData {
    candle: CandlestickData<Time>;
    volume: HistogramData<Time>;
}

// Kiểu dữ liệu state trả về từ hook useBitcoinChartData
export interface BitcoinChartDataState {
    candlestickData: CandlestickData<Time>[];
    volumeData: HistogramData<Time>[];
    loadingInitial: boolean; // Chỉ loading cho lần tải đầu tiên hoặc khi đổi timeframe
    loadingOlder: boolean;   // Loading khi kéo để tải thêm
    error: string | null;
    currentPrices: PriceInfo;
    hasMoreOlderData: boolean; // Cờ báo còn dữ liệu cũ để tải không
}

// Kiểu dữ liệu các hàm trả về từ hook useBitcoinChartData
export interface BitcoinChartDataActions {
    fetchInitialData: (tf: Timeframe) => Promise<void>;
    fetchOlderData: () => Promise<void>;
    fetchCurrentPrices: () => Promise<void>;
}