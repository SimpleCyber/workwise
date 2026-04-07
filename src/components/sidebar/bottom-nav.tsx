"use client";

import { 
  MessagesSquare, 
  ListTodo, 
  Kanban, 
  Files, 
  UserCircle 
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  if (!workspaceId) return null;

  const tabs = [
    {
      icon: MessagesSquare,
      label: "Chat",
      path: `/workspace/${workspaceId}`,
    },
    {
      icon: ListTodo,
      label: "Projects",
      path: `/projects/${workspaceId}`,
    },
    {
      icon: Kanban,
      label: "ToDo",
      path: `/todo/${workspaceId}`,
    },
    {
      icon: Files,
      label: "Documents",
      path: `/data-room/${workspaceId}`,
    },
    {
      icon: UserCircle,
      label: "Profile",
      path: `/workspace/${workspaceId}/profile`,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-sidebar-border bg-sidebar md:hidden px-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || (tab.path !== `/workspace/${workspaceId}/profile` && pathname.startsWith(tab.path));
        
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-y-1 transition-colors duration-200",
              isActive 
                ? "text-sidebar-accent-foreground" 
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            )}
          >
            <tab.icon className={cn("size-5", isActive && "scale-110")} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
