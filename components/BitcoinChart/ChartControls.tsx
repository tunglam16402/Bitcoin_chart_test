// src/components/BitcoinChart/ChartControls.tsx
import React from 'react';
import { timeframes } from '@/config/chartConfig';
import { ChartTheme, PriceInfo, Timeframe } from '@/types';

interface ChartControlsProps {
    theme: ChartTheme;
    currentTimeframe: Timeframe;
    currentPrices: PriceInfo;
    isLoadingPrices?: boolean; // Optional loading state for price button
    onThemeToggle: () => void;
    onTimeframeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    onFetchPrices: () => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
    theme,
    currentTimeframe,
    currentPrices,
    isLoadingPrices,
    onThemeToggle,
    onTimeframeChange,
    onFetchPrices
}) => {
    const themeIcon = theme === 'light' ? '☀️' : '🌙';
    const themeText = theme === 'light' ? 'Sáng' : 'Tối';

    return (
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 items-center">
            {/* Theme Toggle */}
            <button
                onClick={onThemeToggle}
                className={`px-3 py-1.5 rounded text-sm font-medium shadow-sm transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'}`}
                aria-label={`Chuyển sang theme ${theme === 'light' ? 'tối' : 'sáng'}`}
            >
                {themeIcon} {themeText}
            </button>

            {/* Timeframe Selector */}
            <div className="flex items-center">
                <label htmlFor="timeframe" className="mr-2 text-sm font-medium whitespace-nowrap">Khung giờ:</label>
                <select
                    id="timeframe"
                    value={currentTimeframe}
                    onChange={onTimeframeChange}
                     className={`px-3 py-1.5 rounded text-sm border shadow-sm w-full sm:w-auto ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-500 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'}`}
                >
                    {timeframes.map(tf => (
                        <option key={tf} value={tf}>{tf}</option>
                    ))}
                </select>
            </div>

            {/* Price Fetch Button */}
            <button
                onClick={onFetchPrices}
                disabled={isLoadingPrices}
                className={`px-3 py-1.5 rounded text-sm font-medium shadow-sm transition-colors ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isLoadingPrices ? 'Đang tải...' : 'Lấy Giá'}
            </button>

            {/* Price Display */}
            <div className="text-xs sm:text-sm ml-0 sm:ml-auto text-left sm:text-right space-x-2 sm:space-x-4 mt-2 sm:mt-0">
                {currentPrices.current !== null && (
                    <span>Hiện tại: <strong className="font-semibold">${currentPrices.current.toFixed(2)}</strong></span>
                )}
                {currentPrices.previous !== null && (
                    <span>1 phút trước: <strong className="font-semibold">${currentPrices.previous.toFixed(2)}</strong></span>
                )}
                 {/* Placeholder when no prices */}
                {(currentPrices.current === null && currentPrices.previous === null && !isLoadingPrices) && (
                     <span className="opacity-70 italic">Nhấn Lấy Giá</span>
                )}
                 {isLoadingPrices && (
                    <span className="opacity-70 italic">Đang tải giá...</span>
                )}
            </div>
        </div>
    );
};