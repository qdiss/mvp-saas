"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
}

interface Props {
  userId: string;
  displayName?: string;
}

export function NotificationBadge({ userId, displayName }: Props) {
  const [items, setItems] = useState<Notification[]>([
    {
      id: "1",
      title: "New comment on your post",
      body: "Someone replied to your update in PulseMap.",
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: "2",
      title: "Asset status updated",
      body: "Vehicle #A-204 was marked as inactive.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      read: false,
    },
    {
      id: "3",
      title: "Weekly summary ready",
      body: "Your operational summary is available.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
    },
  ]);

  const unreadCount = items.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.items ?? []);
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // useEffect(() => {
  //   if (!userId) return;
  //   fetchNotifications();
  //   const i = setInterval(fetchNotifications, 30000);
  //   return () => clearInterval(i);
  // }, [userId]);
  //TODO- Uncomment above and implement API routes with best practices for production use.

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-2xl">
          <Bell className="h-5 w-5" />

          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-medium flex items-center justify-center rounded-full"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 rounded-2xl p-0 shadow-xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-7 gap-1 text-xs"
            >
              <Check className="h-3 w-3" />
              Mark all
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {items.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Inbox zero. Operational excellence.
            </div>
          )}

          <ul className="divide-y">
            {items.map((n) => (
              <li
                key={n.id}
                className={`px-4 py-3 text-sm transition hover:bg-muted ${
                  !n.read ? "bg-muted/50" : ""
                }`}
              >
                <p className="font-medium leading-tight">{n.title}</p>

                {n.body && (
                  <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                )}

                <p className="mt-2 text-[10px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
