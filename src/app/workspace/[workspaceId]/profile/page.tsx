"use client";

import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useJoinWorkspaceModal } from "@/features/workspaces/store/use-join-workspace-modal";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { useAuthActions } from "@convex-dev/auth/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronLeft, 
  Plus, 
  LogOut, 
  Moon, 
  Sun, 
  ChevronRight,
  Bell,
  Settings,
  User as UserIcon,
  Circle,
  Loader,
  LayoutGrid,
  Users,
  UserPlus,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InviteModal } from "@/features/members/components/invite-modal";

const MobileProfilePage = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { setTheme, theme } = useTheme();
  const { signOut } = useAuthActions();
  const [_open, setOpen] = useCreateWorkspaceModal();
  const [_joinOpen, setJoinOpen] = useJoinWorkspaceModal();
  
  const [workspacesOpen, setWorkspacesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });
  const { data: workspaces } = useGetWorkspaces();

  const handleLogout = async () => {
    await signOut();
    router.replace("/auth");
  };

  const handleWorkspaceSwitch = (id: string) => {
    router.push(`/workspace/${id}`);
  };

  if (userLoading || workspaceLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const NavItem = ({ 
    icon: Icon, 
    label, 
    onClick, 
    rightElement, 
    danger 
  }: { 
    icon: any; 
    label: string; 
    onClick?: () => void; 
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between p-4 transition-colors active:bg-muted/60 text-left",
        danger ? "text-rose-500" : "text-foreground"
      )}
    >
      <div className="flex items-center gap-x-3 overflow-hidden">
        <Icon className="size-5 shrink-0" />
        <span className="text-[15px] font-medium truncate">{label}</span>
      </div>
      <div className="flex items-center gap-x-2 shrink-0">
        {rightElement || <ChevronRight className="size-4 text-muted-foreground/50" />}
      </div>
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-background md:hidden overflow-y-auto pb-24">
      <InviteModal 
        open={inviteOpen} 
        setOpen={setInviteOpen} 
        name={workspace?.name || ""} 
        workspaceId={workspaceId as any} 
        joinCode={workspace?.joinCode || ""}
      />

      {/* Slack-like Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="size-8"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <h1 className="text-xl font-bold">You</h1>
        </div>
        <Button variant="ghost" size="icon" className="size-9 rounded-full">
          <Settings className="size-5 text-muted-foreground" />
        </Button>
      </header>

      {/* User Summary Section */}
      <section className="px-5 py-6 flex items-center gap-x-4">
        <Avatar className="size-16 border-2 border-primary/10">
          <AvatarImage alt={user.name} src={user.image} />
          <AvatarFallback className="text-xl bg-orange-100 text-orange-700 font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <div className="flex items-center gap-x-1.5 mt-0.5">
            <Circle className="size-2 fill-emerald-500 text-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">Active</span>
          </div>
        </div>
      </section>

      <Separator className="mx-4 w-auto bg-muted/50" />

      {/* Quick Actions Grid */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => { /* Open notifications */ }}
          className="flex flex-col items-center justify-center gap-y-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition active:scale-95"
        >
          <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200/50">
            <Bell className="size-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Alerts</span>
        </button>

        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center justify-center gap-y-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition active:scale-95 text-orange-600"
        >
          <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center shadow-sm border border-orange-200/50">
            <Plus className="size-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Create</span>
        </button>

        <button
          onClick={() => setJoinOpen(true)}
          className="flex flex-col items-center justify-center gap-y-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition active:scale-95 text-indigo-600"
        >
          <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm border border-indigo-200/50">
            <Users className="size-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Join</span>
        </button>

        <button
          onClick={() => router.push(`/test/${workspaceId}`)}
          className="flex flex-col items-center justify-center gap-y-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition active:scale-95 text-purple-600"
        >
          <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center shadow-sm border border-purple-200/50">
            <LayoutGrid className="size-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Planning</span>
        </button>

        <button
          onClick={() => router.push(`/attendance/${workspaceId}`)}
          className="flex flex-col items-center justify-center gap-y-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition active:scale-95 text-emerald-600"
        >
          <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm border border-emerald-200/50">
            <Calendar className="size-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Attendance</span>
        </button>
        
        <button
          onClick={() => setInviteOpen(true)}
          className="flex flex-col items-center justify-center gap-y-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition active:scale-95 text-rose-600"
        >
          <div className="size-10 rounded-full bg-rose-100 flex items-center justify-center shadow-sm border border-rose-200/50">
            <UserPlus className="size-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Invite</span>
        </button>
      </div>

      <Separator className="mx-4 w-auto bg-muted/50" />

      {/* Preferences List */}
      <div className="py-2">
        <h3 className="px-5 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Settings</h3>
        <NavItem 
          icon={theme === "dark" ? Sun : Moon} 
          label={theme === "dark" ? "Light Mode" : "Dark Mode"} 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          rightElement={
            <Switch 
              checked={theme === "dark"} 
              onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")} 
            />
          }
        />
      </div>

      <div className="h-2 bg-muted/20 border-y" />

      {/* Workspaces Section */}
      <div className="py-2">
        <h3 className="px-5 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Your Workspaces</h3>
        
        {/* Active Workspace */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 active:bg-muted/60 transition-colors">
          <div className="flex items-center gap-x-3 overflow-hidden">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0">
              {workspace?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold truncate">{workspace?.name}</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Active</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-8 text-muted-foreground"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="size-4" />
            </Button>
          </div>
        </div>

        {/* Other Workspaces List */}
        <div className="mt-1">
          {workspaces?.filter(ws => ws._id !== workspaceId).map((ws) => (
            <NavItem 
              key={ws._id}
              icon={() => (
                <div className="size-9 rounded-lg bg-muted flex items-center justify-center font-bold text-sm border shrink-0">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
              )}
              label={ws.name}
              onClick={() => handleWorkspaceSwitch(ws._id)}
            />
          ))}
        </div>
      </div>

      <div className="h-2 bg-muted/20 border-y" />

      {/* Account Actions */}
      <div className="py-2">
        <NavItem 
          icon={LogOut} 
          label="Sign out" 
          onClick={handleLogout}
          danger
        />
      </div>

      {/* Version/App info footer */}
      <div className="mt-auto px-5 py-10 flex flex-col items-center gap-y-1 bg-muted/5">
        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">WorkWise</p>
        <p className="text-[10px] text-muted-foreground/40">Powered by simplecyber</p>
      </div>
    </div>
  );
};

export default MobileProfilePage;
