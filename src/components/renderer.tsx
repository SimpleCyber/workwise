import Quill from "quill";
import { useEffect, useRef, useState } from "react";

const Embed = Quill.import("blots/embed") as any;

class MentionBlot extends Embed {
  static create(data: { id: string; value: string }) {
    const node = super.create() as HTMLElement;
    node.innerText = `@${data.value}`;
    node.setAttribute("data-id", data.id);
    node.setAttribute("data-value", data.value);
    node.setAttribute("spellcheck", "false");
    node.className =
      "mention cursor-pointer hover:underline bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 px-1 py-0.5 rounded-sm font-medium";
    return node;
  }

  static value(node: HTMLElement) {
    return {
      id: node.getAttribute("data-id"),
      value: node.getAttribute("data-value"),
    };
  }
}

MentionBlot.blotName = "mention";
MentionBlot.tagName = "span";

Quill.register(MentionBlot, true);

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMember } from "@/features/members/api/use-get-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import type { Id } from "../../convex/_generated/dataModel";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const MentionHoverCard = ({
  memberId,
  position,
}: {
  memberId: Id<"members">;
  position: { top: number; left: number };
}) => {
  const { data: member, isLoading } = useGetMember({ id: memberId });

  if (isLoading || !member || !member.user) return null;

  return (
    <div
      className="fixed z-[99999] bg-background border border-border rounded-lg shadow-xl p-3 flex flex-col gap-2 min-w-[200px]"
      style={{
        top: position.top - 8,
        left: position.left,
        transform: "translateY(-100%)",
        cursor: "default",
      }}
      onMouseOver={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 border shadow-sm">
          <AvatarImage src={member.user.image} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {member.user.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-bold truncate">{member.user.name}</span>
          <span className="text-xs text-muted-foreground truncate">
            {member.user.email}
          </span>
        </div>
      </div>
      <div className="text-[11px] font-semibold text-muted-foreground mt-1 px-2 py-0.5 bg-muted rounded-full w-fit uppercase tracking-wider">
        {member.role === "admin"
          ? "Admin"
          : member.role === "lead"
            ? "Lead"
            : "Member"}
      </div>
    </div>
  );
};

interface RendererProps {
  value: string;
}

const Renderer = ({ value }: RendererProps) => {
  const [isEmpty, setIsEmpty] = useState(false);
  const rendererRef = useRef<HTMLDivElement>(null);

  const [hoveredMemberId, setHoveredMemberId] = useState<Id<"members"> | null>(
    null,
  );
  const [hoverPos, setHoverPos] = useState({ top: 0, left: 0 });
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  
  const router = useRouter();

  const workspaceId = useWorkspaceId();

  useEffect(() => {
    if (!rendererRef.current) return;

    const container = rendererRef.current;

    const quill = new Quill(document.createElement("div"), {
      theme: "snow",
    });

    quill.enable(false);

    try {
      const contents = JSON.parse(value);
      quill.setContents(contents);

      const isEmptyContent =
        quill
          .getText()
          .replace(/<(.|\n)*?>/g, "")
          .trim().length === 0;

      setIsEmpty(isEmptyContent);

      container.innerHTML = quill.root.innerHTML;
    } catch (e) {
      console.error("Renderer failed to parse value", e);
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("mention")) {
        const id = target.getAttribute("data-id") as Id<"members">;
        if (id && id !== "all") {
          const rect = target.getBoundingClientRect();
          setHoverPos({
            top: rect.top,
            left: rect.left,
          });
          setHoveredMemberId(id);
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("mention")) {
        setHoveredMemberId(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toUpperCase() === "IMG") {
         setLightboxUrl((target as HTMLImageElement).src);
         return;
      }
      
      if (target.classList.contains("mention")) {
        const id = target.getAttribute("data-id") as Id<"members">;
        if (id && id !== "all" && workspaceId) {
          router.push(`/workspace/${workspaceId}/member/${id}`);
        }
      }
    };

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseout", handleMouseOut);
    container.addEventListener("click", handleClick);

    return () => {
      if (container) {
        container.removeEventListener("mouseover", handleMouseOver);
        container.removeEventListener("mouseout", handleMouseOut);
        container.removeEventListener("click", handleClick);
        container.innerHTML = "";
      }
    };
  }, [value, router, workspaceId]);

  if (isEmpty) return null;

  return (
    <>
      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-[800px] border-none bg-transparent p-0 shadow-none">
          {lightboxUrl && (
            <TransformWrapper>
              <TransformComponent wrapperStyle={{ width: "100%", maxHeight: "80vh" }}>
                <img src={lightboxUrl} alt="Enlarged" className="object-contain w-full h-full rounded-md" />
              </TransformComponent>
            </TransformWrapper>
          )}
        </DialogContent>
      </Dialog>
      {hoveredMemberId && (
        <MentionHoverCard memberId={hoveredMemberId} position={hoverPos} />
      )}
      <div ref={rendererRef} className="ql-editor ql-renderer max-w-full overflow-hidden [&_img]:cursor-zoom-in [&_img]:rounded-md [&_img]:border" />
    </>
  );
};

export default Renderer;
