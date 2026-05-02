"use client";

import { useEffect, useState } from "react";

interface LandingNavLinkProps {
  href: string;
  label: string;
}

export function LandingNavLink({ href, label }: LandingNavLinkProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.querySelector(href);
      if (section) {
        const rect = section.getBoundingClientRect();
        const isInView = rect.top <= 100 && rect.bottom >= 100;
        setIsActive(isInView);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [href]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const section = document.querySelector(href);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`relative px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "text-primary"
          : "text-slate-700 hover:text-primary"
      }`}
    >
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </a>
  );
}
