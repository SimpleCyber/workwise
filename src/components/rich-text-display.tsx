"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export const RichTextDisplay = ({
  content,
  className = "",
}: RichTextDisplayProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const processContent = (text: string) => {
    // Process markdown-style formatting
    const processed = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/!\[([^\]]*)\]$$([^)]+)$$/g, (match, alt, src) => {
        return `<Image  src="${src}" alt="${alt}" class="inline-image cursor-pointer max-w-full h-auto rounded border" onclick="window.openImage('${src}')" />`;
      });

    return processed;
  };

  // Make openImage function available globally for the onclick handler
  if (typeof window !== "undefined") {
    (window as any).openImage = (src: string) => {
      setSelectedImage(src);
    };
  }

  return (
    <>
      <div
        className={`prose prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: processContent(content) }}
      />

      {/* Image Modal */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          {selectedImage && (
            <div className="relative">
              <Image
                src={selectedImage || "/placeholder.svg"}
                alt="Full size"
                className="w-full h-auto max-h-[80vh] object-contain rounded"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setSelectedImage(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
