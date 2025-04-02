"use client";

import React, { useState } from "react";
import { BitcoinChart, ChartColors } from "./BitcoinChart";
import { ChartColorPicker } from "./ChartColorPicker";
import { Theme, Timeframe } from "@/types";

interface ChartContainerProps {
  timeframe: Timeframe;
  theme: Theme;
}

const DEFAULT_COLORS: ChartColors = {
  upColor: "#26a69a",
  downColor: "#ef5350",
  wickUpColor: "#26a69a",
  wickDownColor: "#ef5350",
  volumeUpColor: "#26a69a",
  volumeDownColor: "#ef5350",
};

export const ChartContainer: React.FC<ChartContainerProps> = ({
  timeframe,
  theme,
}) => {
  const [colors, setColors] = useState<ChartColors>(DEFAULT_COLORS);

  return (
    <div className="flex flex-col gap-4">
      {/* điều khiển màu sắc của biểu đồ */}
      <div className="flex justify-end px-4 mt-4">
        <ChartColorPicker colors={colors} onChange={setColors} />
      </div>
      {/*  hiển thị biểu đồ */}
      <div className="h-[600px]">
        <BitcoinChart
          timeframe={timeframe}
          theme={theme}
          colors={colors}
          volumeHeight={0.3}
        />
      </div>
    </div>
  );
};
