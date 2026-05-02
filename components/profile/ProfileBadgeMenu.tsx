"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  grade?: number | null;
  settingsLabel: string;
  signOutLabel: string;
}

export function ProfileBadgeMenu({
  displayName,
  email,
  avatarUrl,
  grade,
  settingsLabel,
  signOutLabel,
}: Props) {
  const { setTheme, theme } = useTheme();
  
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 rounded-full border border-border p-0"
          aria-label="Open profile menu"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">{settingsLabel}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {/* Theme Selection */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">Appearance</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 px-1 pb-1">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`rounded px-2 py-1 text-xs transition ${theme === "light" ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-accent hover:text-accent-foreground"}`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded px-2 py-1 text-xs transition ${theme === "dark" ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-accent hover:text-accent-foreground"}`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`rounded px-2 py-1 text-xs transition ${theme === "system" ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-accent hover:text-accent-foreground"}`}
          >
            Auto
          </button>
        </div>
        <DropdownMenuSeparator />
        <form action="/api/logout" method="post" className="w-full">
          <button
            type="submit"
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {signOutLabel}
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
