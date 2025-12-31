"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { AIExpandInput } from "./ai-expand-input";
import { useState } from "react";

interface NodeActionsProps {
  isVisible: boolean;
  onAddChild: () => void;
  onDelete: () => void;
  onExpandWithAI?: (prompt: string) => void;
  canDelete: boolean;
}

export function NodeActions({
  isVisible,
  onAddChild,
  onDelete,
  onExpandWithAI,
  canDelete,
}: NodeActionsProps) {
  const [showAIInput, setShowAIInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIExpand = () => {
    setShowAIInput(true);
  };

  const handleAIGenerate = async (prompt: string) => {
    if (!onExpandWithAI) return;

    setIsGenerating(true);
    try {
      await onExpandWithAI(prompt);
      setShowAIInput(false);
    } catch (error) {
      // Handle error (you might want to show a toast here)
      console.error("AI generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAICancel = () => {
    setShowAIInput(false);
  };

  return (
    <div
      className={`absolute left-full ml-2 flex flex-col gap-1 transition-all duration-200 ${
        isVisible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-2 pointer-events-none"
      }`}
    >
      <Button
        size="sm"
        variant="outline"
        onClick={onAddChild}
        className="h-8 w-8 p-0 bg-background hover:bg-blue-50 border-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/50"
        aria-label="Add child node"
      >
        <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </Button>

      {onExpandWithAI && (
        <div className="relative">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAIExpand}
            disabled={isGenerating}
            className="h-8 w-8 p-0 bg-background hover:bg-purple-50 border-purple-200 dark:border-purple-800 dark:hover:bg-purple-900/50 disabled:opacity-50"
            aria-label="Expand with AI"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            )}
          </Button>

          {showAIInput && (
            <div className="absolute top-0 left-full ml-2 z-10">
              <AIExpandInput
                onGenerate={handleAIGenerate}
                onCancel={handleAICancel}
                isGenerating={isGenerating}
              />
            </div>
          )}
        </div>
      )}

      {canDelete && (
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="h-8 w-8 p-0 bg-background hover:bg-red-50 border-red-200 dark:border-red-800 dark:hover:bg-red-900/50"
          aria-label="Delete node"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </Button>
      )}
    </div>
  );
}
