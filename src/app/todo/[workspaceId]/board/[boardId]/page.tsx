"use client";

import { useRouter } from "next/navigation";
import { Loader, TriangleAlert, ChevronLeft } from "lucide-react";

import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

import { useGetBoard } from "@/features/todos/api/use-get-board";
import { useGetLists } from "@/features/todos/api/use-get-lists";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { KanbanBoard } from "@/features/todos/components/todoboard";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { Id } from "../../../../../../convex/_generated/dataModel";

interface BoardPageProps {
  params: {
    workspaceId: string;
    boardId: string;
  };
}

const BoardPage = ({ params }: BoardPageProps) => {
  const router = useRouter();
  const isMobile = useMobile();
  const boardId = params.boardId as Id<"todoBoards">;

  const { data: board, isLoading: boardLoading } = useGetBoard({ boardId });
  const { data: lists, isLoading: listsLoading } = useGetLists({ boardId });
  const { data: members, isLoading: membersLoading } = useGetMembers({
    workspaceId: params.workspaceId as Id<"workspaces">,
  });

  if (boardLoading || listsLoading || membersLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Board not found.</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center border-b bg-background px-4">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => router.push(`/todo/${params.workspaceId}`)}
          >
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold">{board.name}</h1>
        {board.description && (
          <span className="ml-4 text-sm text-muted-foreground">
            {board.description}
          </span>
        )}
        <div className="ml-auto flex items-center gap-x-2 mr-4">
          {members
            ?.filter((member) => {
              if (!board) return false;
              // Always show owner
              if (board.memberId === member._id) return true;
              // Show allowed members if public and list exists
              if (
                board.visibility === "public" &&
                board.allowedMembers &&
                board.allowedMembers.includes(member._id)
              ) {
                return true;
              }
              return false;
            })
            .map((member) => (
              <TooltipProvider key={member._id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar
                      className="h-8 w-8 cursor-pointer hover:opacity-75 transition"
                      onClick={() =>
                        router.push(
                          `/workspace/${params.workspaceId}/member/${member._id}`,
                        )
                      }
                    >
                      <AvatarImage src={member.user.image} />
                      <AvatarFallback>
                        {member.user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{member.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Click to chat
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard boardId={boardId} lists={lists || []} />
      </div>
    </div>
  );
};

export default BoardPage;
