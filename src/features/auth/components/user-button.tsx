"use client";

import { useTheme } from "next-themes";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader, LogOut, Crown, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "../api/use-current-user";

export const UserButton = () => {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { signOut } = useAuthActions();
  const { data, isLoading } = useCurrentUser();

  if (isLoading) {
    return <Loader className="size-4 animate-spin text-muted-foreground" />;
  }

  if (!data) {
    return null;
  }

  const { image, name, email } = data;
  const isPremium = true;
  const avatarFallback = name?.charAt(0).toUpperCase();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="relative outline-none">
        <Avatar className="size-10 transition hover:opacity-75">
          <AvatarImage alt={name} src={image} />
          <AvatarFallback className="text-base">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-64 p-4 space-y-3 ml-12 bg-popover text-popover-foreground border-border shadow-xl"
      >
        <div className="flex items-center space-x-3">
          <Avatar className="size-12">
            <AvatarImage alt={name} src={image} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
              {email}
            </p>
          </div>
        </div>

        <div className="rounded-md bg-muted p-2 text-sm flex items-center gap-2">
          <Crown className="size-4 text-yellow-500" />

          <span className="text-xs">
            {isPremium ? "Premium Member" : "Free Member"}
          </span>
        </div>

        {!isPremium && (
          <Button
            variant="outline"
            className="w-full text-xs"
            onClick={() => alert("Subscribe coming soon!")}
          >
            Subscribe to Premium
          </Button>
        )}

        <DropdownMenuItem
          className="h-10 cursor-pointer flex items-center justify-start gap-2"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <div className="flex items-center gap-2">
              <Sun className="size-4" />
              <span>Light Mode</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Moon className="size-4" />
              <span>Dark Mode</span>
            </div>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            router.replace("/");
          }}
          className="h-10 cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 transition-colors"
        >
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
