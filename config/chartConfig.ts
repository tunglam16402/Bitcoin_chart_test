// src/config/chartConfig.ts
import { Timeframe, ChartTheme } from '@/types';
import { DeepPartial, GridOptions, LayoutOptions, PriceScaleOptions, TimeScaleOptions, CrosshairMode, LineStyle } from 'lightweight-charts';

export const BINANCE_API_BASE = 'https://api.binance.com';
export const SYMBOL = 'BTCUSDT';
export const INITIAL_LIMIT = 500; // Số nến tải ban đầu
export const LOAD_MORE_LIMIT = 500; // Số nến tải thêm mỗi lần kéo
export const VISIBLE_RANGE_LOAD_THRESHOLD = 20; // Ngưỡng nến còn lại để tải thêm

export const timeframes: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];

export const getChartOptions = (theme: ChartTheme, currentTf: Timeframe): DeepPartial<any> => { // Sử dụng DeepPartial cho options
    const isLight = theme === 'light';

    const layoutOptions: DeepPartial<LayoutOptions> = {
        background: { color: isLight ? '#FFFFFF' : '#131722' },
        textColor: isLight ? '#191919' : '#D1D4DC',
    };

    const gridOptions: DeepPartial<GridOptions> = {
        vertLines: { color: isLight ? '#E6E6E6' : '#2B2B43', style: LineStyle.Solid },
        horzLines: { color: isLight ? '#E6E6E6' : '#2B2B43', style: LineStyle.Solid },
    };

    const rightPriceScaleOptions: DeepPartial<PriceScaleOptions> = {
        borderColor: isLight ? '#C8C8C8' : '#424551',
        visible: true,
    };

    const timeScaleOptions: DeepPartial<TimeScaleOptions> = {
        borderColor: isLight ? '#C8C8C8' : '#424551',
        timeVisible: true,
        secondsVisible: ['1m', '5m', '15m'].includes(currentTf),
    };

    // Cấu hình cho Price Scale của Volume (sẽ được áp dụng riêng)
    const volumePriceScaleOptions: DeepPartial<PriceScaleOptions> = {
         scaleMargins: { top: 0.75, bottom: 0 }, // Volume chiếm ~25% dưới cùng
         // visible: false, // Ẩn trục giá của volume nếu muốn
         borderColor: isLight ? '#E0E0E0' : '#363A45',
    };


    return {
        layout: layoutOptions,
        grid: gridOptions,
        rightPriceScale: rightPriceScaleOptions, // ID mặc định cho giá
        timeScale: timeScaleOptions,
        crosshair: { mode: CrosshairMode.Normal },
        // Thêm các options khác nếu cần
        localization: { // Ví dụ: Định dạng số và thời gian Việt Nam
             locale: 'vi-VN',
             // dateFormat: 'dd/MM/yyyy', // lightweight-charts tự động xử lý format tốt
        },
        handleScroll: { // Cho phép cuộn ngang/dọc bằng chuột
             mouseWheel: true,
             pressedMouseMove: true,
             horzTouchDrag: true,
             vertTouchDrag: true,
        },
        handleScale: { // Cho phép zoom bằng chuột/touch
            mouseWheel: true,
            pinch: true,
            axisPressedMouseMove: true, // Cho phép scale bằng cách kéo trục giá/thời gian
        },
         // Chứa cấu hình riêng cho price scale 'volume' để dễ truy cập
         volumePriceScale: volumePriceScaleOptions
    };
};

// Cấu hình màu sắc cho series (có thể đưa vào getChartOptions nếu muốn)
export const candlestickSeriesOptions = {
    upColor: '#26a69a', downColor: '#ef5350',
    borderDownColor: '#ef5350', borderUpColor: '#26a69a',
    wickDownColor: '#ef5350', wickUpColor: '#26a69a',
};

export const volumeSeriesOptions = {
    priceFormat: { type: 'volume', precision: 0 },
    priceScaleId: 'volume', // Quan trọng: Gán vào price scale riêng
    // color: '#26a69a', // Base color, sẽ bị ghi đè bởi data.color
};