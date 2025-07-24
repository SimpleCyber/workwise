import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export const useUpdateAttendanceStatus = () => {
  return useMutation(api.attendance.updateAttendanceStatus);
};
