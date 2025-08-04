import { Handle, Position, type NodeProps } from "reactflow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export const UserNode = ({ data }: NodeProps) => {
  return (
    <Card className="min-w-[250px] shadow-lg border-2 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={data.user.image || "/placeholder.svg"} />
            <AvatarFallback>
              {data.user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">
              {data.user.name || "Unknown User"}
            </h3>
            <p className="text-sm text-muted-foreground">{data.user.email}</p>
          </div>
        </div>
        <Handle
          type="source"
          position={data.isHorizontal ? Position.Right : Position.Bottom}
          className="w-3 h-3"
        />
      </CardContent>
    </Card>
  );
};
