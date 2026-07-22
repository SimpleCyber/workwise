"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface FeatureFlagContextValue {
  flags: FeatureFlag[];
  isLoading: boolean;
  isEnabled: (key: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  flags: [],
  isLoading: true,
  isEnabled: () => true, // Default to enabled if context not available
});

export const FeatureFlagProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const data = useQuery(api.admin.getFeatureFlags);
  const isLoading = data === undefined;

  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags: data ?? [],
      isLoading,
      isEnabled: (key: string) => {
        if (!data) return true; // Default to enabled while loading
        const flag = data.find((f: FeatureFlag) => f.key === key);
        return flag ? flag.enabled : true; // Default to enabled if flag not found
      },
    }),
    [data, isLoading],
  );

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => useContext(FeatureFlagContext);

export const useFeatureFlag = (key: string) => {
  const { isEnabled, isLoading } = useFeatureFlags();
  return { enabled: isEnabled(key), isLoading };
};

// Declarative component to gate features
export const FeatureGate = ({
  flag,
  children,
  fallback = null,
}: {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const { enabled } = useFeatureFlag(flag);
  return enabled ? <>{children}</> : <>{fallback}</>;
};

// Guard component that redirects to project page (or custom fallback / home) if feature is disabled
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export const FeatureGuard = ({
  flag,
  children,
  fallbackUrl,
}: {
  flag: string;
  children: React.ReactNode;
  fallbackUrl?: string;
}) => {
  const { enabled, isLoading } = useFeatureFlag(flag);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!isLoading && !enabled) {
      if (fallbackUrl) {
        router.push(fallbackUrl);
      } else {
        const workspaceId = params?.workspaceId as string | undefined;
        if (workspaceId) {
          router.push(`/projects/${workspaceId}`);
        } else {
          router.push("/");
        }
      }
    }
  }, [enabled, isLoading, router, fallbackUrl, params]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!enabled) return null;

  return <>{children}</>;
};
