"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface CalendarsViewProps {
  googleTokens: any[];
  hiddenCalendars: Set<string>;
  onToggleVisibility: (id: string) => void;
  onDisconnect: (tokenId: Id<"googleTokens">) => void;
  onConnectGoogle: () => void;
}

export const CalendarsView: React.FC<CalendarsViewProps> = ({
  googleTokens,
  hiddenCalendars,
  onToggleVisibility,
  onDisconnect,
  onConnectGoogle,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Connected Accounts */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Connected Calendars
        </h4>

        {/* Workwise Local */}
        <div
          className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => onToggleVisibility("local")}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Workwise Local
              </p>
              <p className="text-xs text-muted-foreground">
                Default workspace calendar
              </p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              !hiddenCalendars.has("local")
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/40"
            }`}
          >
            {!hiddenCalendars.has("local") && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Google Accounts */}
        {googleTokens.map((token: any) => {
          const id = token.email || token._id;
          const isHidden = hiddenCalendars.has(id);

          return (
            <div
              key={token._id}
              className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => onToggleVisibility(id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: token.color || "#3b82f6" }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {token.email || "Google Calendar"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Synced account
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDisconnect(token._id);
                  }}
                  className="p-1 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                  title="Disconnect"
                >
                  <X className="w-4 h-4" />
                </button>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    !isHidden
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {!isHidden && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Event Types
        </h4>

        {[
          {
            id: "category-google",
            label: "Meetings & Reminders",
            color: "#3b82f6",
          },
          { id: "category-birthday", label: "Birthdays", color: "#e11d48" },
          { id: "category-holiday", label: "Holidays", color: "#8b5cf6" },
          { id: "category-local", label: "Local Events", color: "#2563eb" },
        ].map((cat) => {
          const isHidden = hiddenCalendars.has(cat.id);
          return (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/60 cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => onToggleVisibility(cat.id)}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs font-medium text-foreground">
                  {cat.label}
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  !isHidden
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {!isHidden && <Check className="w-3 h-3" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Button */}
      <div className="pt-2">
        <Button
          variant="outline"
          className="w-full justify-center gap-2 rounded-xl h-10 text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          onClick={onConnectGoogle}
        >
          <Plus className="w-4 h-4" />
          Connect Google Calendar
        </Button>
      </div>
    </div>
  );
};
