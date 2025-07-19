import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

interface ThumbnailProps {
  url: string | null | undefined;
}

export const Thumbnail = ({ url }: ThumbnailProps) => {
  if (!url) return null;

  return (
    <Dialog>
      <DialogTrigger>
        <div className="relative my-2 max-w-[360px] cursor-zoom-in overflow-hidden rounded-lg border">
          <Image
            src={url}
            width={800}
            height={600}
            alt="Message image"
            className="size-full rounded-md object-cover"
          />
        </div>
      </DialogTrigger>

      <DialogContent
        isThumbnail
        className="max-w-[800px] border-none bg-transparent p-0 shadow-none"
      >
        <Image
          src={url}
          width={800}
          height={600}
          alt="Message image"
          className="size-full rounded-md object-cover"
        />
      </DialogContent>
    </Dialog>
  );
};
