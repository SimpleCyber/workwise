import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaChevronDown } from "react-icons/fa";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

interface HeaderProps {
  memberName?: string;
  memberImage?: string;
  onClick?: () => void;
}

export const Header = ({
  memberName = "Member",
  memberImage,
  onClick,
}: HeaderProps) => {
  const router = useRouter();
  const isMobile = useMobile();
  const workspaceId = useWorkspaceId();
  const avatarFallback = memberName.charAt(0).toUpperCase();

  return (
    <div className="flex h-[49px] items-center overflow-hidden border-b bg-background px-4">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.push(`/workspace/${workspaceId}`)}
        >
          <ChevronLeft className="size-5" />
        </Button>
      )}
      <Button
        variant="ghost"
        className="w-auto overflow-hidden px-2 text-lg font-semibold"
        size="sm"
        onClick={onClick}
      >
        <Avatar className="mr-2 size-6">
          <AvatarImage src={memberImage} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>

        <span className="truncate">{memberName}</span>
        <FaChevronDown className="ml-2 size-2.5" />
      </Button>
    </div>
  );
};
