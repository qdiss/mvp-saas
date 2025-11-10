"use client"

import * as React from "react"
import { OrganizationSwitcher, useOrganization, useUser } from "@clerk/clerk-react"
import {
    BookOpen,
    Bot,
    Command,
    Frame,
    LifeBuoy,
    Map,
    PieChart,
    Send,
    Settings2,
    SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/features/sidebar/nav-main"
import { NavProjects } from "@/features/sidebar/nav-projects"
import { NavSecondary } from "@/features/sidebar/nav-secondary"
import { NavUser } from "@/features/sidebar/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

interface SidebarUser {
    name: string
    email: string
    avatar: string
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useUser()
    const pathname = usePathname()
    const { organization } = useOrganization()

    if (!user) return null

    const userData: SidebarUser = {
        name: user.fullName ?? user.firstName ?? "User",
        email: user.emailAddresses[0]?.emailAddress ?? "unknown@example.com",
        avatar: user.imageUrl ?? "/avatars/default.jpg",
    }

    const navMain = [
        {
            title: "Dashboard",
            url: "#",
            icon: PieChart,
            items: [
                { title: "Overview", url: "#" },
                { title: "Recent Activity", url: "#" },
            ],
        },
        {
            title: "Keywords",
            url: "#",
            icon: Command,
            items: [
                { title: "Search / Add Keyword", url: "#" },
                { title: "Keyword List", url: "#" },
            ],
        },
        {
            title: "Products",
            url: "#",
            icon: SquareTerminal,
            items: [
                { title: "All Products", url: "#" },
                { title: "Annotated Products", url: "#" },
            ],
        },
        {
            title: "Briefs",
            url: "#",
            icon: BookOpen,
            items: [
                { title: "Create Brief", url: "#" },
                { title: "All Briefs", url: "#" },
            ],
        },
        {
            title: "Comments",
            url: "#",
            icon: LifeBuoy,
            items: [
                { title: "All Comments", url: "#" },
                { title: "By Keyword / Product", url: "#" },
            ],
        },
    ]

    const navSecondary = [
        { title: "Support", url: "#", icon: LifeBuoy },
        { title: "Feedback", url: "#", icon: Send },
    ]

    const projects = [
        { name: "Recent Project 1", url: "#", icon: Frame },
        { name: "Recent Project 2", url: "#", icon: PieChart },
        { name: "Recent Project 3", url: "#", icon: Map },
    ]

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader className="pb-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <OrganizationSwitcher
                            appearance={{
                                elements: {
                                    rootBox: 'w-full',
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

                                    // Avatar with gradient ring
                                    organizationPreviewAvatarBox: 'size-11 shrink-0 relative',
                                    organizationPreviewAvatarImage: `
                            size-11 rounded-xl object-cover
                            ring-2 ring-primary/20 group-hover:ring-primary/40
                            shadow-lg transition-all duration-300
                            group-hover:scale-105
                        `,

                                    // Text styling
                                    organizationPreviewTextContainer: 'flex flex-col gap-1 text-left min-w-0',
                                    organizationPreviewMainIdentifier: `
                            truncate font-bold text-sm
                            bg-gradient-to-r from-foreground to-foreground/80 
                            bg-clip-text text-transparent
                        `,
                                    organizationPreviewSecondaryIdentifier: 'hidden',
                                },
                            }}
                            createOrganizationMode="modal"
                            afterCreateOrganizationUrl="/dashboard"
                            afterSelectOrganizationUrl="/dashboard"
                            hidePersonal={false}
                        />
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Premium badge */}
                {organization && (
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                                <div className="size-1.5 rounded-full bg-violet-500 animate-pulse" />
                                <span className="text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                    Enterprise
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                {organization.membersCount} {organization.membersCount === 1 ? 'member' : 'members'}
                            </span>
                        </div>
                    </div>
                )}
            </SidebarHeader>

            <SidebarContent className="pt-0">
                <NavMain items={navMain} />
                <NavProjects projects={projects} />
                <NavSecondary items={navSecondary} className="mt-auto" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    )
}