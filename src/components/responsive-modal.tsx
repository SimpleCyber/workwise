import * as React from "react";
import { useMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";

interface ResponsiveModalProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export const ModalClose = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useMobile();

  if (isMobile) {
    return <DrawerClose asChild>{children}</DrawerClose>;
  }

  return <DialogClose asChild>{children}</DialogClose>;
};

export const ResponsiveModal = ({
  children,
  open,
  onOpenChange,
  title,
  description,
}: ResponsiveModalProps) => {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="px-4 pb-12">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};
