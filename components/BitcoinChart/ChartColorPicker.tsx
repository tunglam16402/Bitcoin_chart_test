import React, { useState } from "react";
import { ChartColors } from "./BitcoinChart";

interface ColorPickerProps {
  colors: ChartColors;
  onChange: (colors: ChartColors) => void;
}

interface ColorOption {
  label: string;
  key: keyof ChartColors;
}

const COLOR_OPTIONS: ColorOption[] = [
  { label: "Nến tăng", key: "upColor" },
  { label: "Nến giảm", key: "downColor" },
  { label: "Bóng nến tăng", key: "wickUpColor" },
  { label: "Bóng nến giảm", key: "wickDownColor" },
  { label: "Khối lượng tăng", key: "volumeUpColor" },
  { label: "Khối lượng giảm", key: "volumeDownColor" },
];

export const ChartColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (key: keyof ChartColors, value: string) => {
    onChange({ ...colors, [key]: value });
  };

  const renderColorOption = (option: ColorOption) => (
    <div key={option.key} className="flex flex-col gap-1">
      <label className="text-sm font-medium dark:text-gray-200">
        {option.label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={colors[option.key]}
          onChange={(e) => handleColorChange(option.key, e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
        <input
          type="text"
          value={colors[option.key]}
          onChange={(e) => handleColorChange(option.key, e.target.value)}
          className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
        />
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Tùy chỉnh màu sắc
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 min-w-[250px]">
          <div className="space-y-4">
            {COLOR_OPTIONS.map(renderColorOption)}
          </div>
        </div>
      )}
    </div>
  );
};
