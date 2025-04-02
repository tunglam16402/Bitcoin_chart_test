import { Timeframe } from "@/types";

export const BINANCE_API_BASE = "https://api.binance.com";
export const SYMBOL = "BTCUSDT";
export const INITIAL_LIMIT = 500; // Số nến tải ban đầu
export const LOAD_MORE_LIMIT = 500; // Số nến tải thêm mỗi lần kéo
export const VISIBLE_RANGE_LOAD_THRESHOLD = 5; // Ngưỡng nến còn lại để tải thêm

// Định nghĩa kiểu dữ liệu cho Kline từ Binance
export type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string
];

// Hàm xử lý phản hồi API
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error (${response.status}): ${errorText}`);
    throw new Error(
      `API request failed with status ${response.status}: ${errorText}`
    );
  }
  return response.json();
};

// Chuyển đổi timeframe sang định dạng của Binance
const getBinanceInterval = (timeframe: Timeframe): string => {
  const intervals: { [key in Timeframe]: string } = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
    "1w": "1w",
    "1M": "1M",
  };

  return intervals[timeframe] || "1h";
};

// Chuyển đổi timestamp từ UTC sang giờ Việt Nam (UTC+7)
const convertToVietnamTime = (timestamp: number): Date => {
  const date = new Date(timestamp);
  // Tạo một đối tượng mới với múi giờ Việt Nam (UTC+7)
  date.setHours(date.getHours() + 7); 
  return date;
};

// Lấy dữ liệu Kline từ Binance
export const getKlines = async (
  timeframe: Timeframe,
  limit: number = 500,
  endTime?: number
): Promise<BinanceKline[]> => {
  try {
    const interval = getBinanceInterval(timeframe);
    const url = new URL("/api/v3/klines", BINANCE_API_BASE);
    url.searchParams.append("symbol", SYMBOL);
    url.searchParams.append("interval", interval);
    url.searchParams.append("limit", limit.toString());

    if (endTime) {
      url.searchParams.append("endTime", endTime.toString());
    }

    const response = await fetch(url.toString());
    const data = await handleApiResponse(response);

    // Chuyển đổi thời gian của mỗi Kline từ UTC sang giờ Việt Nam
    return data.map((kline: BinanceKline) => {
      const timestamp = kline[0] as number;
      const vietnamTime = convertToVietnamTime(timestamp);
      return [
        vietnamTime.getTime(), 
        ...kline.slice(1), 
      ] as BinanceKline;
    });
  } catch (error) {
    console.error("Error fetching klines:", error);
    throw error;
  }
};

// Lấy giá hiện tại của Bitcoin
export const getCurrentPrice = async (): Promise<number> => {
  try {
    const response = await fetch(
      `${BINANCE_API_BASE}/api/v3/ticker/price?symbol=BTCUSDT`
    );
    const data = await handleApiResponse(response);
    return parseFloat(data.price);
  } catch (error) {
    console.error("Error fetching current price:", error);
    throw error;
  }
};

// Lấy giá ticker hiện tại
export const getTickerPrice = async (): Promise<{ price: string }> => {
  try {
    const url = `${BINANCE_API_BASE}/api/v3/ticker/price?symbol=${SYMBOL}`;
    const response = await fetch(url);
    const data = await handleApiResponse(response);
    if (typeof data?.price !== "string") {
      throw new Error("Invalid data format received from Ticker API");
    }
    return data;
  } catch (error) {
    console.error("Error fetching ticker price:", error);
    throw error;
  }
};

// Lấy giá đóng cửa 1 phút trước (sử dụng Klines 1m)
export const getPreviousMinuteClosePrice = async (): Promise<number | null> => {
  try {
    const now = Date.now();
    const endTime = Math.floor(now / 60000) * 60000 - 1; // Thời điểm cuối phút trước (ms)
    const klines = await getKlines("1m", 1, endTime);

    if (klines.length > 0) {
      const closePrice = parseFloat(klines[0][4] as string);
      return isNaN(closePrice) ? null : closePrice;
    }

    return null;
  } catch (error) {
    console.error("Error fetching previous minute kline:", error);
    return null; // Không làm gián đoạn các thao tác khác nếu lỗi
  }
};
