"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function NotificationsBell({
  initialItems,
}: {
  initialItems: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    const res = await fetch("/api/notifications/read", { method: "POST" });
    if (res.ok) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 hover:bg-black/5"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-black/10 bg-white p-2 shadow-lg">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-2 py-3 text-sm text-ink/50">No notifications yet.</p>
            )}
            {items.map((n) => (
              <div key={n.id} className={`rounded-lg px-2 py-2 ${n.read ? "bg-white" : "bg-primary-50"}`}>
                <p className="text-sm font-medium text-ink">{n.title}</p>
                {n.body && <p className="text-xs text-ink/60">{n.body}</p>}
                {n.link && (
                  <Link href={n.link} className="mt-1 inline-block text-xs font-medium text-primary hover:underline" onClick={() => setOpen(false)}>
                    Open
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
