"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, X, Send } from "lucide-react";

interface AIExpandInputProps {
  onGenerate: (prompt: string) => void;
  onCancel: () => void;
  isGenerating?: boolean;
}

export function AIExpandInput({
  onGenerate,
  onCancel,
  isGenerating,
}: AIExpandInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt.trim());
    }
  };

  return (
    <Card className="absolute top-full left-0 mt-2 p-4 w-80 shadow-lg border z-50 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-medium text-gray-700">
          Expand with AI
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="ml-auto h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Describe what child nodes you want to create..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="text-sm"
          autoFocus
          disabled={isGenerating}
        />

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!prompt.trim() || isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="h-3 w-3 mr-1" />
                Generate
              </>
            )}
          </Button>
        </div>
      </form>

      <p className="text-xs text-gray-500 mt-2">
        Example: {'"Create marketing tasks for social media campaign"'} or{" "}
        {'"Breakdown frontend development phases"'}
      </p>
    </Card>
  );
}
