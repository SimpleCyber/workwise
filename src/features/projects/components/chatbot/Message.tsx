import type React from "react";
import { cls } from "./utils";
import { Sparkles } from "lucide-react";
import type { UIRole } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MessageProps = {
  role: UIRole;
  children: React.ReactNode;
  currentUser?: { name?: string; email?: string; image?: string };
};

export default function Message({ role, children, currentUser }: MessageProps) {
  const isUser = role === "user";
  const initials = (currentUser?.name?.trim()?.[0]?.toUpperCase() ||
    currentUser?.email?.trim()?.[0]?.toUpperCase() ||
    "U") as string;

  return (
    <TooltipProvider>
      <div
        className={cls(
          "flex items-start gap-2",
          isUser ? "justify-end" : "justify-start",
        )}
      >
        {!isUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative mt-0.5 grid h-8 w-8 place-items-center rounded-full">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-[1.5px]">
                  <div className="h-full w-full rounded-full bg-background" />
                </div>
                <div className="relative z-10 grid h-8 w-8 place-items-center text-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>AI Assistant</TooltipContent>
          </Tooltip>
        )}
        <div
          className={cls(
            "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
            isUser
              ? "bg-muted text-foreground"
              : "bg-card text-foreground border border-border",
          )}
        >
          {children}
        </div>
        {isUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-0.5">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={currentUser?.image || undefined}
                    alt={currentUser?.name || currentUser?.email || "User"}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div className="font-medium">{currentUser?.name || "User"}</div>
                {currentUser?.email && (
                  <div className="text-muted-foreground">
                    {currentUser.email}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
