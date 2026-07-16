export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 border-red-200";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getListIcon = (listName: string) => {
  const name = listName.toLowerCase();
  if (name.includes("todo") || name.includes("to do") || name.includes("remaining")) {
    return "list";
  } else if (name.includes("progress") || name.includes("doing")) {
    return "clock";
  } else if (name.includes("hold") || name.includes("blocked") || name.includes("unassigned")) {
    return "alert-circle";
  } else if (name.includes("review") || name.includes("testing")) {
    return "eye";
  } else if (name.includes("done") || name.includes("completed")) {
    return "check-square";
  } else if (name.includes("rejected")) {
    return "alert-circle";
  }
  return "list";
};

export const getListColor = (listName: string) => {
  const name = listName.toLowerCase();
  if (name.includes("todo") || name.includes("to do") || name.includes("remaining")) {
    return "border-blue-200 bg-blue-50";
  } else if (name.includes("progress") || name.includes("doing")) {
    return "border-yellow-200 bg-yellow-50";
  } else if (name.includes("hold") || name.includes("blocked") || name.includes("unassigned")) {
    return "border-orange-200 bg-orange-50";
  } else if (name.includes("review") || name.includes("testing")) {
    return "border-purple-200 bg-purple-50";
  } else if (name.includes("done") || name.includes("completed")) {
    return "border-green-200 bg-green-50";
  } else if (name.includes("rejected")) {
    return "border-red-200 bg-red-50";
  }
  return "border-gray-200 bg-gray-50";
};

export const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString();
};
