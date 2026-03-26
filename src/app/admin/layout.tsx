"use client";

import React, { useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAdmin = useQuery(api.admin.isAdmin);

  useEffect(() => {
    if (isAdmin === false) {
      router.replace("/");
    }
  }, [isAdmin, router]);

  if (isAdmin === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return null;
  }

  return <>{children}</>;
}
