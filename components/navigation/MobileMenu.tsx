"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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

interface NavItem {
  href: string;
  label: string;
  iconName: string;
}

interface MobileMenuProps {
  navItems: NavItem[];
  title: string;
  subtitle: string;
}

export function MobileMenu({ navItems, title, subtitle }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 lg:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div className="fixed left-0 top-0 z-50 h-screen w-[280px] bg-white shadow-2xl lg:hidden">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-6">
                <div>
                  <h2 className="text-xl font-bold text-primary">{title}</h2>
                  <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
                <button
                  onClick={closeMenu}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = iconMap[item.iconName];

                  if (!Icon) return null;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
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
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
