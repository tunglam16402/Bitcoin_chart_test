import { CandlestickData, HistogramData, Time } from "lightweight-charts";

export type Timeframe =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d"
  | "1w"
  | "1M";

// Interface từ API Binance
export interface BinanceKlineData extends Array<string | number> {
  0: number;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: number;
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
  loadingOlder: boolean; // Loading khi kéo để tải thêm
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

export type { CandlestickData, HistogramData };

// Định nghĩa kiểu dữ liệu cho khối lượng giao dịch
export interface VolumeData {
  time: Time;
  value: number;
  color: string;
}

// Định nghĩa kiểu dữ liệu cho trạng thái chart
export interface ChartState {
  candlestickData: CandlestickData[];
  volumeData: VolumeData[];
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

// Định nghĩa kiểu dữ liệu cho theme
export type Theme = "light" | "dark";

// Định nghĩa kiểu dữ liệu cho cấu hình chart
export interface ChartConfig {
  theme: Theme;
  timeframe: Timeframe;
  volumeHeight: number; // Chiều cao của biểu đồ khối lượng (0-1)
}
