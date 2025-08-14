"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, MapPin } from "lucide-react";

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  type: "title" | "description" | "id";
  placeholder: string;
  displayValue?: string;
}

export function EditableField({
  value,
  onChange,
  type,
  placeholder,
  displayValue,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "description") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {type === "description" ? (
          <Textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="text-xs min-h-[60px]"
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
          />
        ) : type === "id" ? (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-gray-500" />
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="text-xs font-mono h-6 w-20"
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus
            />
          </div>
        ) : (
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={type === "title" ? "text-sm font-semibold" : "text-xs"}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
          />
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            className="p-1 h-6 w-6"
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="p-1 h-6 w-6"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  if (type === "id") {
    return (
      <div
        className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => setIsEditing(true)}
        title="Click to edit ID"
      >
        <MapPin className="w-3 h-3" />
        <span className="font-mono">{value}</span>
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer hover:bg-gray-50 p-1 rounded ${
        type === "title"
          ? "font-semibold text-sm leading-tight"
          : "text-xs text-gray-600 leading-relaxed"
      }`}
      onClick={() => setIsEditing(true)}
      title={`Click to edit ${type}`}
    >
      {displayValue || value}
    </div>
  );
}
