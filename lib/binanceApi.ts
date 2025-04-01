// src/lib/binanceApi.ts
import { BINANCE_API_BASE, SYMBOL } from "@/config/chartConfig";
import { BinanceKlineData, Timeframe } from "@/types";
// import { subMinutes } from 'date-fns';

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}): ${errorText}`);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    return response.json();
};

// Lấy dữ liệu Klines (nến)
export const getKlines = async (
    interval: Timeframe,
    limit: number,
    endTime?: number | null // ms timestamp
): Promise<BinanceKlineData[]> => {
    const params = new URLSearchParams({
        symbol: SYMBOL,
        interval: interval,
        limit: limit.toString(),
    });
    if (endTime) {
        params.append('endTime', endTime.toString());
    }

    try {
        const response = await fetch(`${BINANCE_API_BASE}/api/v3/klines?${params.toString()}`);
        const data = await handleApiResponse(response);
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format received from Kline API");
        }
        return data;
    } catch (error) {
        console.error("Error fetching klines:", error);
        throw error; // Re-throw để hook có thể bắt lỗi
    }
};

// Lấy giá ticker hiện tại
export const getTickerPrice = async (): Promise<{ price: string }> => {
    try {
        const response = await fetch(`${BINANCE_API_BASE}/api/v3/ticker/price?symbol=${SYMBOL}`);
        const data = await handleApiResponse(response);
         if (typeof data?.price !== 'string') {
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
         // Lấy nến 1m kết thúc 1 phút trước thời điểm hiện tại
        const now = Date.now();
        // endTime nên là thời điểm bắt đầu của phút hiện tại (hoặc cuối phút trước)
        const endTime = Math.floor(now / 60000) * 60000 - 1; // Lấy thời điểm cuối của phút trước đó (ms)

        // Chỉ cần lấy 1 nến là đủ
        const klines = await getKlines('1m', 1, endTime);

        if (klines && klines.length > 0) {
            const lastKline = klines[klines.length - 1]; // Nến cuối cùng trong response (chỉ có 1)
            const closePrice = parseFloat(lastKline[4] as string);
            return isNaN(closePrice) ? null : closePrice;
        }
        return null;
    } catch (error) {
        console.error("Error fetching previous minute kline:", error);
        // Không throw lỗi ở đây để không chặn việc lấy giá hiện tại nếu chỉ lỗi giá quá khứ
        return null;
    }
};