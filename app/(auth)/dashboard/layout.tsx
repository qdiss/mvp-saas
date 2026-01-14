"use client";

import { AppSidebar } from "@/features/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useAuth } from "@clerk/nextjs";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userId } = useAuth();

  const segments = pathname.split("/").filter(Boolean);
  const [folderNames, setFolderNames] = useState<Record<string, string>>({});

  // Fetch folder names for folder IDs
  useEffect(() => {
    const fetchFolderNames = async () => {
      const newFolderNames: Record<string, string> = {};

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const prevSegment = segments[i - 1];

        // If previous segment is "folder" or "folders", this segment is a folder ID
        if (
          (prevSegment === "folder" || prevSegment === "folders") &&
          segment.length > 20
        ) {
          try {
            const response = await fetch(`/api/folders/${segment}`);
            if (response.ok) {
              const data = await response.json();
              if (data.folder?.name) {
                newFolderNames[segment] = data.folder.name;
              }
            }
          } catch (error) {
            console.error("Error fetching folder name:", error);
          }
        }
      }

      if (Object.keys(newFolderNames).length > 0) {
        setFolderNames((prev) => ({ ...prev, ...newFolderNames }));
      }
    };

    fetchFolderNames();
  }, [pathname]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center justify-between w-full">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />

            <Breadcrumb>
              <BreadcrumbList>
                {segments.map((segment, idx) => {
                  const isLast = idx === segments.length - 1;
                  const href = "/" + segments.slice(0, idx + 1).join("/");
                  const prevSegment = segments[idx - 1];

                  // Check if this is a folder ID
                  const isFolderId =
                    (prevSegment === "folder" || prevSegment === "folders") &&
                    segment.length > 20;

                  // Use folder name if available, otherwise capitalize segment
                  const label = isFolderId
                    ? folderNames[segment] || "Loading..."
                    : segment.charAt(0).toUpperCase() + segment.slice(1);

                  return (
                    <React.Fragment key={href}>
                      <BreadcrumbItem className="hidden md:block">
                        {isLast ? (
                          <BreadcrumbPage>{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="mr-4">
            {userId && <NotificationBadge userId={userId} />}
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
