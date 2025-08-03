import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

// create a button and export it that will help me to expand and collaspe the workspacesidebar
export const WorkspaceManageButton = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      className="flex items-center justify-center p-2 text-gray-400 hover:text-white"
      onClick={onClick}
      aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
    >
      {isOpen ? (
        <PanelLeftClose className="size-5" />
      ) : (
        <PanelLeftOpen className="size-5" />
      )}
    </button>
  );
};
