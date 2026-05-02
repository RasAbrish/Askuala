"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  House, 
  Settings, 
  Upload,
  BarChart3,
  Crown,
  GraduationCap,
  LayoutDashboard,
  Layers3,
  BookCopy,
  PlugZap,
  Users,
  LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  House,
  Upload,
  BookOpen,
  Settings,
  LayoutDashboard,
  GraduationCap,
  Layers3,
  BarChart3,
  Crown,
  Users,
  BookCopy,
  PlugZap,
};

interface NavLinkProps {
  href: string;
  iconName: string;
  label: string;
}

export function NavLink({ href, iconName, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const Icon = iconMap[iconName];

  if (!Icon) return null;

  return (
    <Link
      href={href}
      className={`group relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-base transition-all ${
        isActive
          ? "bg-primary-50 text-primary font-semibold"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      
      <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-700"}`} />
      <span>{label}</span>
    </Link>
  );
}
