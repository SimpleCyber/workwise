import { Calendar, Shield, User } from "lucide-react";
import { useGetNodeDetails } from "../../api/use-get-node-details";

const statusColors = [
  { name: "Open", class: "bg-blue-100 text-blue-800" },
  { name: "In Progress", class: "bg-yellow-100 text-yellow-800" },
  { name: "Completed", class: "bg-green-100 text-green-800" },
  { name: "Blocked", class: "bg-red-100 text-red-800" },
  { name: "Review", class: "bg-purple-100 text-purple-800" },
];

interface DetailsTabProps {
  description: string;
  status: string;
  uniqueId: string;
  workspaceId: any;
}

export function DetailsTab({
  description,
  status,
  uniqueId,
  workspaceId,
}: DetailsTabProps) {
  const { data: nodeDetails, isLoading } = useGetNodeDetails({
    nodeId: uniqueId,
    workspaceId: workspaceId,
  });

  // Access the creator information
  const creatorName = nodeDetails?.creator?.name;
  const creatorRole = nodeDetails?.creator?.role;
  const nodeMembers = nodeDetails?.assignedUsers || [];
  // console.log("Node Members:", nodeMembers);

  const membersExcludingCreator = nodeMembers.filter(
    (member) => member.role !== "creator",
  );
  const memberCount = membersExcludingCreator.length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Creator */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <User className="w-3 h-3" />
          Creator
        </div>
        <div className="flex items-center gap-2 ml-5">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            {creatorName ? getInitials(creatorName) : "JS"}
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">
              {creatorName}
            </div>
            <div className="text-xs text-muted-foreground">{creatorRole}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Shield className="w-3 h-3" />
          Members ({memberCount})
        </div>
        <div className="ml-5 space-y-1">
          {membersExcludingCreator.length > 0 ? (
            membersExcludingCreator.map((member, index) => (
              <div
                key={member.memberId || index}
                className="flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
                  {getInitials(member.name)}
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">
                    {member.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(new Date(member.addedAt).toISOString())}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">
              No members assigned
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">
          Description
        </div>
        <div className="text-xs text-foreground/80 leading-relaxed ml-2">
          {description}
        </div>
      </div>

      {/* Table Data */}
      {/* <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <Table className="w-3 h-3" />
          Details
        </div>
        <div className="ml-5 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Priority:</span>
            <span className="font-medium">High</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Department:</span>
            <span className="font-medium">Engineering</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Budget:</span>
            <span className="font-medium">$25,000</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Timeline:</span>
            <span className="font-medium">3 months</span>
          </div>
        </div>
      </div> */}

      {/* ID */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">Node ID</div>
        <div className="text-xs font-mono text-muted-foreground ml-2">
          {uniqueId}
        </div>
      </div>

      {/* Created At */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Calendar className="w-3 h-3" />
          Created At
        </div>
        <div className="text-xs text-muted-foreground ml-5">
          1/15/2024, 10:30 AM
        </div>
      </div>
    </>
  );
}
