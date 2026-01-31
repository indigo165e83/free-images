"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";

interface DownloadButtonProps {
  imageUrl: string;
  fileName?: string; // 元のファイル名（例: "description.png"）
}

export default function DownloadButton({ imageUrl, fileName = "image.png" }: DownloadButtonProps) {
  const t = useTranslations('HomePage');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("original");
  const [isOpen, setIsOpen] = useState(false);

  // 選択肢の定義
  const sizeOptions = [
    { label: "Original", value: "original" },
    { label: "Large (1920px)", value: "1920" },
    { label: "Medium (1080px)", value: "1080" },
    { label: "Small (640px)", value: "640" },
  ];

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // --- ファイル名の生成ロジック ---
      // 1. 拡張子 (.pngなど) を除去してベース名を取得
      const baseName = fileName.replace(/\.[^/.]+$/, "");
      
      // 2. サイズごとのサフィックスを作成 (例: "_1080", "_original")
      const sizeSuffix = `_${selectedSize}`;
      
      // 3. 新しいファイル名 (例: "my-image_1080.webp")
      const newFileName = `${baseName}${sizeSuffix}.webp`;

      // APIにリクエスト (新しいファイル名を渡す)
      const apiUrl = `/api/download?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(newFileName)}&width=${selectedSize}`;

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = newFileName; // ダウンロード属性にも新しい名前を設定
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsOpen(false);

    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download image.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full relative">
      <div className="flex w-full rounded-lg shadow-sm">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-grow bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-l-lg font-bold transition flex items-center justify-center gap-2 border-r border-blue-500"
        >
          <Download size={20} />
          {isDownloading ? t('downloading') : `${t('downloadButton')} (${sizeOptions.find(o => o.value === selectedSize)?.label})`}
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-r-lg transition flex items-center"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
          {sizeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSelectedSize(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition flex justify-between items-center ${
                selectedSize === option.value ? "bg-gray-700 text-blue-400 font-bold" : "text-gray-200"
              }`}
            >
              <span>{option.label}</span>
              {selectedSize === option.value && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}