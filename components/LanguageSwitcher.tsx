"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    
    startTransition(() => {
      // 現在のパス (例: /en/about) から言語プレフィックスを置換する
      // 正規表現で先頭の /en または /ja を探して置換
      const newPath = pathname.replace(/^\/(en|ja)/, `/${nextLocale}`);
      router.replace(newPath);
    });
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={handleCreate}
        disabled={isPending}
        className={`
          appearance-none cursor-pointer
          bg-white/10 hover:bg-white/20 
          text-white text-sm font-medium
          rounded-full py-2 pl-4 pr-8
          border border-transparent focus:border-indigo-500 focus:outline-none
          transition-colors
          ${isPending ? "opacity-50" : ""}
        `}
      >
        <option value="ja" className="bg-gray-800 text-white">🇯🇵 日本語</option>
        <option value="en" className="bg-gray-800 text-white">🇺🇸 English</option>
      </select>
      
      {/* 下矢印アイコン (見た目の調整用) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}