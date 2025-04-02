"use client";

import { useState, useEffect, useCallback } from "react";
import { Theme, Timeframe } from "@/types";
import { getCurrentPrice } from "@/lib/binanceApi";

interface PriceDisplayProps {
  theme: Theme;
  timeframe: Timeframe;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  theme,
  timeframe,
}) => {
  // Khai báo state cho giá hiện tại, giá một phút trước và trạng thái tải
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceOneMinuteAgo, setPriceOneMinuteAgo] = useState<number | null>(
    null
  );
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(false);

  // Hàm lấy giá mới và cập nhật cả hai giá
  const fetchPrices = useCallback(async () => {
    try {
      setIsLoadingPrice(true);
      const newPrice = await getCurrentPrice();

      if (currentPrice !== null) {
        setPriceOneMinuteAgo(currentPrice);
      }

      setCurrentPrice(newPrice);
    } catch (error) {
      console.error("Lỗi khi lấy giá Bitcoin:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  }, [currentPrice]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Cập nhật giá tự động sau mỗi 10 giây nếu bật tính năng autoUpdate
  useEffect(() => {
    if (autoUpdate) {
      const interval = setInterval(fetchPrices, 10000);
      return () => clearInterval(interval);
    }
  }, [autoUpdate, fetchPrices]);

  useEffect(() => {
    setPriceOneMinuteAgo(null);
  }, [timeframe]);

  const buttonClass = (active: boolean) =>
    `px-3 py-1 rounded ${
      active ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
    }`;

  return (
    <div className="mb-6">
      {/* Nút bật/tắt tự động cập nhật */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setAutoUpdate(!autoUpdate)} // Chuyển đổi trạng thái autoUpdate khi nhấn
          className={`px-3 py-1 rounded text-sm ${
            autoUpdate
              ? "bg-green-500 text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {autoUpdate ? "Tắt tự động cập nhật" : "Bật tự động cập nhật"}
        </button>
      </div>

      {/* Hiển thị thông tin giá và biến động */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Giá hiện tại */}
        <div
          className={`p-4 rounded ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <h2 className="text-lg font-semibold mb-2">Giá Hiện Tại</h2>
          {isLoadingPrice ? (
            <p>Đang tải...</p>
          ) : currentPrice ? (
            <div>
              <p className="text-xl font-bold">
                ${currentPrice.toLocaleString()}
              </p>
              <button onClick={fetchPrices} className={buttonClass(true)}>
                Làm mới
              </button>
            </div>
          ) : (
            <button onClick={fetchPrices} className={buttonClass(false)}>
              Lấy Giá
            </button>
          )}
        </div>

        {/* Giá 1 phút trước */}
        <div
          className={`p-4 rounded ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <h2 className="text-lg font-semibold mb-2">Giá 1 Phút Trước</h2>
          {isLoadingPrice ? (
            <p>Đang tải...</p>
          ) : priceOneMinuteAgo ? (
            <p className="text-xl font-bold">
              ${priceOneMinuteAgo.toLocaleString()}
            </p>
          ) : currentPrice ? (
            <p className="text-gray-500 italic">Chờ cập nhật...</p>
          ) : (
            <p>Không có dữ liệu</p>
          )}
        </div>

        {/* Biến động giá */}
        <div
          className={`p-4 rounded ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <h2 className="text-lg font-semibold mb-2">Biến Động</h2>
          {currentPrice && priceOneMinuteAgo ? (
            <div>
              <p className="text-xl font-bold">
                {(
                  ((currentPrice - priceOneMinuteAgo) / priceOneMinuteAgo) *
                  100
                ).toFixed(2)}
                %
              </p>
              <p
                className={
                  currentPrice >= priceOneMinuteAgo
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {currentPrice >= priceOneMinuteAgo ? "Tăng" : "Giảm"}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 italic">
              {currentPrice ? "Chờ cập nhật..." : "Không có dữ liệu"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
