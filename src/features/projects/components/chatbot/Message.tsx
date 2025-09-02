import type React from "react";
import { cls } from "./utils";
import { User, Sparkles } from "lucide-react";
import type { UIRole } from "./types";

type MessageProps = {
  role: UIRole;
  children: React.ReactNode;
};

export default function Message({ role, children }: MessageProps) {
  const isUser = role === "user";
  return (
    <div
      className={cls(
        "flex items-start gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="relative mt-0.5 grid h-8 w-8 place-items-center rounded-full">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-[1.5px]">
            <div className="h-full w-full rounded-full bg-white" />
          </div>
          <div className="relative z-10 grid h-8 w-8 place-items-center text-zinc-700">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      )}
      <div
        className={cls(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          isUser
            ? "bg-zinc-100 text-zinc-900"
            : "bg-white text-zinc-900 border border-zinc-200",
        )}
      >
        {children}
      </div>
      {isUser && (
        <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-white">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
