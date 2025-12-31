"use client";

import {
  Building,
  CheckCircle,
  Clock,
  Home,
  XCircle,
  MapPin,
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
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
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
      <ResizablePanel defaultSize={70} minSize={50}>
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          
          {/* Today's Status */}
          {todayAttendance && (
            <Card>
              <CardHeader>
                <CardTitle>Today Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex  justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Check In</p>
                      <p className="font-medium">
                        {new Date(todayAttendance.checkInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <div className="flex items-center gap-1">
                        {todayAttendance.workLocation === "home" ? (
                          <>
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                          </>
                        ) : (
                          <>
                            <Building className="w-4 h-4" />
                            <span>Office</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(todayAttendance.status)}
                    </div>
                  </div>
                  
                  {todayAttendance.checkOutTime && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Check Out</p>
                          <p className="font-medium">
                            {new Date(todayAttendance.checkOutTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-green-500">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check In */}
          {!todayAttendance && (
            <Card>
              <CardHeader>
                <CardTitle>Check In</CardTitle>
                <CardDescription>Start your workday</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Work Location</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setWorkLocation("office")}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        workLocation === "office"
                          ? "border-blue-500 bg-blue-500/10 text-blue-500"
                          : "border-border hover:border-gray-500/30"
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      Office
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkLocation("home")}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        workLocation === "home"
                          ? "border-blue-500 bg-blue-500/10 text-blue-500"
                          : "border-border hover:border-gray-500/30"
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      Home
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="Enter location or leave blank for auto-detection"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any notes for today..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1"
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

          {/* Check Out */}
          {todayAttendance && !todayAttendance.checkOutTime && (
            <Card>
              <CardHeader>
                <CardTitle>Check Out</CardTitle>
                <CardDescription>End your workday and submit your tasks</CardDescription>
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
                      <Label className="text-sm font-medium">Today Tasks</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Describe what you accomplished today
                      </p>
                      <div className="border rounded-md">
                        <Editor
                          placeholder="What did you work on today?"
                          onSubmit={handleCheckOut}
                          disabled={isCheckingOutPending}
                          innerRef={editorRef}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Already Checked Out */}
          {todayAttendance && todayAttendance.checkOutTime && (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Work Day Complete</h3>
                <p className="text-muted-foreground">
                  Checked out at {" "}
                  {new Date(todayAttendance.checkOutTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />
    </ResizablePanelGroup>
  );
};