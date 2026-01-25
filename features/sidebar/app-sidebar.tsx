"use client";

import * as React from "react";
import {
  OrganizationSwitcher,
  useOrganization,
  useUser,
} from "@clerk/clerk-react";
import {
  Folder,
  LayoutDashboard,
  Plus,
  LifeBuoy,
  Send,
  MoreHorizontal,
  Trash2,
  Edit,
  FolderOpen,
  Command,
  BookOpen,
  MessageSquare,
  ChevronRight,
  Forward,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { NavUser } from "@/features/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

interface SidebarUser {
  name: string;
  email: string;
  avatar: string;
}

interface FolderData {
  id: string;
  name: string;
  category: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { organization } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const [folders, setFolders] = React.useState<FolderData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (organization?.id || user?.id) {
      fetchFolders();
    }
  }, [organization?.id, user?.id]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/folders");
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete "${folderName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
      } else {
        alert("Failed to delete folder");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete folder");
    }
  };

  if (!user) return null;

  const userData: SidebarUser = {
    name: user.fullName ?? user.firstName ?? "User",
    email: user.emailAddresses[0]?.emailAddress ?? "unknown@example.com",
    avatar: user.imageUrl ?? "/avatars/default.jpg",
  };

  const foldersByCategory = folders.reduce(
    (acc, folder) => {
      const category = folder.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(folder);
      return acc;
    },
    {} as Record<string, FolderData[]>,
  );

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Keywords",
      url: "#keywords",
      icon: Command,
    },
    {
      title: "Briefs",
      url: "#briefs",
      icon: BookOpen,
    },
    {
      title: "Comments",
      url: "#comments",
      icon: MessageSquare,
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <OrganizationSwitcher
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger: `
                    w-full justify-start gap-3 px-3 py-3 h-auto 
                    rounded-xl hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent/30
                    transition-all duration-300 group
                    shadow-sm hover:shadow-md
                  `,
                  organizationSwitcherTriggerIcon: `
                    ml-auto text-muted-foreground 
                    group-hover:text-foreground transition-colors
                  `,
                  organizationPreviewAvatarBox: "size-11 shrink-0 relative",
                  organizationPreviewAvatarImage: `
                    size-11 rounded-xl object-cover
                    ring-2 ring-primary/20 group-hover:ring-primary/40
                    shadow-lg transition-all duration-300
                    group-hover:scale-105
                  `,
                  organizationPreviewTextContainer:
                    "flex flex-col gap-1 text-left min-w-0",
                  organizationPreviewMainIdentifier: `
                    truncate font-bold text-sm
                    bg-gradient-to-r from-foreground to-foreground/80 
                    bg-clip-text text-transparent
                  `,
                  organizationPreviewSecondaryIdentifier: "hidden",
                },
              }}
              createOrganizationMode="modal"
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              hidePersonal={false}
            />
          </SidebarMenuItem>
        </SidebarMenu>

        {organization && (
          <div className="px-2 py-1">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-linear-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <div className="flex items-center gap-1.5">
                <div className="size-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs font-semibold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Enterprise
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {organization.membersCount}{" "}
                {organization.membersCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="pt-0">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  onClick={() => router.push(item.url)}
                  tooltip={item.title}
                  className={cn(pathname === item.url && "bg-accent")}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {/* Folders Collapsible */}
            <Collapsible
              asChild
              defaultOpen={pathname.startsWith("/folders/")}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Folders">
                    <Folder />
                    <span>Folders</span>
                    <div className="ml-auto flex items-center gap-1">
                      {folders.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {folders.length}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </div>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {loading ? (
                      <SidebarMenuSubItem>
                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          Loading...
                        </div>
                      </SidebarMenuSubItem>
                    ) : folders.length === 0 ? (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => router.push("/dashboard")}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Folder</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ) : (
                      <>
                        {/* Create New Button */}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            onClick={() => router.push("/dashboard")}
                            className="text-primary"
                          >
                            <Plus className="h-5 w-5" />
                            <span>Create New</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {/* All Folders */}
                        {Object.entries(foldersByCategory).map(
                          ([category, categoryFolders]) => (
                            <React.Fragment key={category}>
                              {Object.keys(foldersByCategory).length > 1 && (
                                <SidebarMenuSubItem>
                                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    {category}
                                  </div>
                                </SidebarMenuSubItem>
                              )}
                              {categoryFolders.map((folder) => {
                                const isActive =
                                  pathname === `/dashboard/folder/${folder.id}`;
                                return (
                                  <SidebarMenuSubItem key={folder.id}>
                                    <SidebarMenuSubButton
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/folder/${folder.id}`,
                                        )
                                      }
                                      className={cn(
                                        "group/folder",
                                        isActive && "bg-accent",
                                      )}
                                    >
                                      <div
                                        className="h-6 w-6 rounded flex items-center justify-center shrink-0"
                                        style={{
                                          backgroundColor:
                                            folder.color || "#10b981",
                                        }}
                                      >
                                        <FolderOpen className="h-4 w-4 text-white" />
                                      </div>
                                      <span className="truncate">
                                        {folder.name}
                                      </span>

                                      <DropdownMenu>
                                        <DropdownMenuTrigger
                                          onClick={(e) => e.stopPropagation()}
                                          className="ml-auto opacity-0 group-hover/folder:opacity-100 transition-opacity"
                                        >
                                          <MoreHorizontal className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          className="w-48 rounded-lg"
                                          side="right"
                                          align="start"
                                        >
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              router.push(
                                                `/dashboard/folder/${folder.id}`,
                                              );
                                            }}
                                          >
                                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                            <span>Open Folder</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              alert(
                                                "Edit functionality coming soon!",
                                              );
                                            }}
                                          >
                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                            <span>Edit Details</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteFolder(
                                                folder.id,
                                                folder.name,
                                              );
                                            }}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            <span>Delete Folder</span>
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </React.Fragment>
                          ),
                        )}
                      </>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>

        {/* Support & Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <a href="#support">
                  <LifeBuoy />
                  <span>Support</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <a href="#feedback">
                  <Send />
                  <span>Feedback</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <ModeToggle />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
