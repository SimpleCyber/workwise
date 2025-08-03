"use client";

import {
  Building,
  CheckCircle,
  Clock,
  Home,
  XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import type Quill from "quill";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import type { Id } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";

import { useAddComment } from "../api/use-add-comment";
import { useCheckIn } from "../api/use-check-in";
import { useCheckOut } from "../api/use-check-out";
import { useGetTodayAttendance } from "../api/use-get-today-attendance";

const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
});

interface CheckInOutProps {
  workspaceId: Id<"workspaces">;
}

export const CheckInOut = ({ workspaceId }: CheckInOutProps) => {
  const [workLocation, setWorkLocation] = useState<"office" | "home">("office");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [comment, setComment] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);

  const editorRef = useRef<Quill | null>(null);

  const { data: todayAttendance, isLoading } = useGetTodayAttendance({
    workspaceId,
  });
  const { mutate: checkIn, isPending: isCheckingIn } = useCheckIn();
  const { mutate: checkOut, isPending: isCheckingOutPending } = useCheckOut();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();




  const handleCheckIn = async () => {
    try {
      // Get current location if available
      let currentLocation = location;
      if (!currentLocation && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            },
          );
          currentLocation = `${position.coords.latitude}, ${position.coords.longitude}`;
        } catch (error) {
          console.log("Location access denied");
        }
      }

      await checkIn(
        {
          workspaceId,
          workLocation,
          location: currentLocation,
          notes: notes || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Checked in successfully!");
            setNotes("");
            setLocation("");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to check in");
          },
        },
      );
    } catch (error) {
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    if (!todayAttendance) return;

    try {
      let imageId: Id<"_storage"> | undefined;

      if (image) {
        const url = await generateUploadUrl({}, { throwError: true });
        if (!url) throw new Error("Failed to get upload URL");

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });

        if (!result.ok) throw new Error("Failed to upload image");
        const { storageId } = await result.json();
        imageId = storageId;
      }

      await checkOut(
        {
          attendanceId: todayAttendance._id,
          tasks: body,
          image: imageId,
        },
        {
          onSuccess: () => {
            toast.success("Checked out successfully!");
            setIsCheckingOut(false);
          },
          onError: (error) => {
            toast.error(error.message || "Failed to check out");
          },
        },
      );
    } catch (error) {
      toast.error("Failed to check out");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Main Content */}
      <ResizablePanel defaultSize={70} minSize={50}>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          {/* Current Status */}
          {todayAttendance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Today Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check In</p>
                    <p className="font-medium">
                      {new Date(
                        todayAttendance.checkInTime,
                      ).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {todayAttendance.workLocation === "home"
                        ? "Work from Home"
                        : "Office"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check Out</p>
                    <p className="font-medium">
                      {todayAttendance.checkOutTime
                        ? new Date(
                            todayAttendance.checkOutTime,
                          ).toLocaleTimeString()
                        : "Not checked out"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(todayAttendance.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check In Form */}
          {!todayAttendance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Check In
                </CardTitle>
                <CardDescription>
                  Start your workday by checking in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Work Location</Label>
                  <RadioGroup
                    value={workLocation}
                    onValueChange={(value) =>
                      setWorkLocation(value as "office" | "home")
                    }
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="office" id="office" />
                      <Label
                        htmlFor="office"
                        className="flex items-center gap-2"
                      >
                        <Building className="w-4 h-4" />
                        Office
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="home" id="home" />
                      <Label htmlFor="home" className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Work from Home
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="Enter your location or it will be detected automatically"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes for today..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="w-full"
                >
                  {isCheckingIn ? "Checking In..." : "Check In"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Check Out Form */}
          {todayAttendance && !todayAttendance.checkOutTime && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Check Out
                </CardTitle>
                <CardDescription>
                  End your workday by checking out and submitting your tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isCheckingOut ? (
                  <Button
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full"
                  >
                    Check Out
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        Today Tasks & Accomplishments
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Describe what you accomplished today. You can format
                        text and attach images.
                      </p>
                      <Editor
                        placeholder="Describe your tasks and accomplishments for today..."
                        onSubmit={handleCheckOut}
                        disabled={isCheckingOutPending}
                        innerRef={editorRef}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Already Checked Out */}
          {todayAttendance && todayAttendance.checkOutTime && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Work Day Complete
                </CardTitle>
                <CardDescription>
                  You have successfully completed your work day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Checked out at{" "}
                  {new Date(todayAttendance.checkOutTime).toLocaleTimeString()}
                </p>
                {todayAttendance.status === "pending" && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Your attendance is pending admin approval.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />


    </ResizablePanelGroup>
  );
};
