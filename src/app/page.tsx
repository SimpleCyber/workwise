"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader,
  Plus,
  ArrowRight,
  Briefcase,
  LogOut,
  LayoutGrid,
  Settings,
  Search,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeatureFlag } from "@/components/feature-flags";

export default function Home() {
  const router = useRouter();
  const [open, setOpen] = useCreateWorkspaceModal();
  const { data: workspaces, isLoading } = useGetWorkspaces();
  const { enabled: treePlanningEnabled, isLoading: flagsLoading } =
    useFeatureFlag("tree_planning");
  const { signOut } = useAuthActions();

  const workspaceId = useMemo(() => workspaces?.[0]?._id, [workspaces]);

  useEffect(() => {
    if (isLoading || flagsLoading) return;

    if (workspaces && workspaces.length > 0) {
      const lastActive = localStorage.getItem("lastActiveWorkspaceId");
      const targetWorkspace =
        workspaces.find((w) => w._id === lastActive) || workspaces[0];

      const defaultRoute = treePlanningEnabled
        ? `/test/${targetWorkspace._id}`
        : `/projects/${targetWorkspace._id}`;

      router.replace(defaultRoute);
    } else if (!open) {
      // If no workspaces and modal not open, open it
      setOpen(true);
    }
  }, [
    workspaces,
    isLoading,
    flagsLoading,
    treePlanningEnabled,
    open,
    setOpen,
    router,
  ]);
  if (isLoading || flagsLoading || workspaceId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <Loader className="size-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-white selection:bg-purple-500/30 overflow-hidden relative">
      {/* Background Ambient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl p-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="text-gray-400 text-lg">
              Manage your workspaces and teams.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search workspaces..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-purple-500 rounded-full w-64"
              />
            </div>
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 size-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Workspace Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-purple-500" />
              Your Workspaces
            </h2>
            <Button
              onClick={() => setOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-6"
            >
              <Plus className="mr-2 size-4" />
              New Workspace
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Create New Workspace Card (Visual) */}
            <button
              onClick={() => setOpen(true)}
              className="group relative flex h-full min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 transition-all hover:border-purple-500/50 hover:bg-purple-500/10"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-white/5 transition-colors group-hover:bg-purple-500/20 group-hover:scale-110">
                <Plus className="size-6 text-gray-400 group-hover:text-purple-400" />
              </div>
              <h3 className="mt-4 text-base font-medium text-gray-300 group-hover:text-white">
                Create new workspace
              </h3>
            </button>

            {/* Existing Workspaces */}
            {workspaces?.map((workspace) => (
              <div
                key={workspace._id}
                onClick={() =>
                  router.push(
                    treePlanningEnabled
                      ? `/test/${workspace._id}`
                      : `/projects/${workspace._id}`,
                  )
                }
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-900/20 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="flex items-start justify-between">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 font-bold text-xl text-white shadow-lg">
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-200 transition-colors">
                      {workspace.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Briefcase className="size-3" />
                      {/* <span>{workspace.members?.length || 1} Member{workspace.members?.length !== 1 && 's'}</span> */}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs font-medium text-gray-500 group-hover:text-gray-400">
                      Active today
                    </span>
                    <div className="flex items-center text-purple-400 text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      Open <ArrowRight className="ml-1 size-3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
