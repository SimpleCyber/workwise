import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons/lib";
import type { ButtonHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon | IconType;
  label: string;
  isActive?: boolean;
  badgeCount?: number;
}

export const SidebarButton = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  badgeCount,
  ...props
}: SidebarButtonProps) => {
  return (
    <div className="group relative flex cursor-pointer flex-col items-center justify-center gap-y-0.5">
      {/* Tooltip on hover */}
      <div className="absolute left-full ml-2 hidden group-hover:block z-50">
        <div className="whitespace-nowrap rounded-md bg-gray-300 px-2 py-1 text-xs text-black shadow-lg border border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200">
          {label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-300 -ml-1" />
        </div>
      </div>

      {/* Active indicator */}
      {/* <div 
        className={cn(
          "absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-300",
          isActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
        )} 
      /> */}

      {/* Ripple effect container */}
      <div className="relative overflow-hidden rounded-lg">
        <Button
          variant="transparent"
          className={cn(
            "size-9 p-2 relative overflow-hidden transition-all duration-300 ease-out",
            "hover:bg-accent/20 hover:scale-105 hover:shadow-lg",
            "active:scale-95 active:transition-all active:duration-100",
            isActive && "bg-accent/20 shadow-md",
            // Subtle glow effect on hover
            "hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]",
          )}
          onClick={onClick}
          {...props}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Icon with enhanced animations */}
          <div className="relative">
            <Icon
              className={cn(
                "size-5 text-white transition-all duration-300 ease-out relative z-10",
                "group-hover:scale-110 group-hover:rotate-2 group-hover:text-accent",
                "group-active:scale-95",
                isActive && "text-accent scale-105",
              )}
            />

            {badgeCount && badgeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center z-20">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </div>

          {/* Subtle inner glow on active */}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent/10 rounded-lg" />
          )}
        </Button>
      </div>

      {/* Label with enhanced animations */}
      <span
        className={cn(
          "text-[11px] transition-all duration-300 ease-out",
          "group-hover:text-accent group-hover:scale-105 group-hover:font-medium",
          "group-active:scale-95",
          isActive ? "text-accent font-medium" : "text-white/80",
        )}
      >
        {/* {label} */}
      </span>

      {/* Subtle pulse animation for active state */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg bg-accent/10 animate-pulse" />
      )}
    </div>
  );
};
