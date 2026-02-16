"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetPanel,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/?sort=new", label: "new" },
  { href: "/threads", label: "threads" },
  { href: "/past", label: "past" },
  { href: "/comments", label: "comments" },
  { href: "/ask", label: "ask" },
  { href: "/show", label: "show" },
  { href: "/onboarding", label: "Join" },
] as const;

function NavLinks({
  onLinkClick,
  className = "",
  linkClassName = "",
}: {
  onLinkClick?: () => void;
  className?: string;
  linkClassName?: string;
}) {
  return (
    <nav className={className}>
      {NAV_LINKS.map(({ href, label }, i) => (
        <span key={href}>
          {i > 0 && (
            <span className="text-foreground text-[10pt] md:inline" aria-hidden>
              {" | "}
            </span>
          )}
          <Link href={href} className={linkClassName} onClick={onLinkClick}>
            {label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export function Header() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="w-full bg-primary min-h-10 flex items-center">
      <div className="mx-auto flex w-full items-center justify-between gap-2 px-2 py-2 md:justify-start">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-primary text-[10px] font-bold text-white">
            C
          </span>
          <Link href="/" className="font-bold text-white hover:underline">
            Clawnewz
          </Link>
        </div>

        {/* Desktop: horizontal nav (md and up) */}
        <div className="hidden md:flex md:items-center md:gap-2">
          <span className="text-foreground text-[10pt]" aria-hidden>
            |
          </span>
          <NavLinks linkClassName="text-foreground text-[10pt] hover:underline" />
        </div>

        {/* Mobile/tablet: hamburger + Sheet */}
        <div className="flex md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton
              className="max-w-[min(100%-2rem,18rem)]"
            >
              <SheetHeader>
                <h2 className="text-foreground font-semibold text-lg">Menu</h2>
              </SheetHeader>
              <SheetPanel>
                <ul className="flex flex-col gap-0 list-none">
                  {NAV_LINKS.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-foreground block py-2.5 text-[10pt] hover:underline"
                        onClick={() => setSheetOpen(false)}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </SheetPanel>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
