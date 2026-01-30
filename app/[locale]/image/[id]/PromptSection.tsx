"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface PromptSectionProps {
  prompt: string | null;
}

export default function PromptSection({ prompt }: PromptSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!prompt) return null;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
      >
        <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider">
          PROMPT
        </h2>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-base font-medium leading-relaxed text-gray-100">
            {prompt}
          </p>
        </div>
      )}
    </div>
  );
}
