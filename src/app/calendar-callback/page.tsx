"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CalendarCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const exchangeCode = useAction(api.googleCalendarActions.exchangeCode);
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Google Calendar connection failed", {
        description: error,
      });
      router.push("/");
      return;
    }

    if (!code) {
      router.push("/");
      return;
    }

    const handleExchange = async () => {
      try {
        await exchangeCode({ code });
        toast.success("Google Calendar connected successfully!");
        // Redirect back to the calendar view (assuming it's on the dashboard or similar)
        // You might want to store the "return URL" in localStorage before redirecting to Google
        router.push("/");
      } catch (err: any) {
        console.error("Exchange error:", err);
        toast.error("Failed to connect Google Calendar", {
          description: err.message || "Something went wrong",
        });
        setStatus("Failed to connect.");
        // router.push("/"); // Optional: stay on page to show error or redirect
      }
    };

    handleExchange();
  }, [searchParams, exchangeCode, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center max-w-md w-full">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Connecting to Google Calendar
        </h2>
        <p className="text-slate-500">{status}</p>
      </div>
    </div>
  );
}
