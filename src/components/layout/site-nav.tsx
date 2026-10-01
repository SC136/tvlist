"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  Film,
  LogOut,
  Menu,
  NotebookPen,
  Search,
  Settings,
  Star,
  Tv,
  User,
  Users,
  X,
  ListVideo,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Logo } from "./logo";
import { QuickSearch } from "./quick-search";

export interface NavViewer {
  username: string;
  name: string;
  image: string | null;
  unread: number;
}

const BANNER_PAGES = /^\/(movie|tv|user)\/[^/]+/;

export function SiteNav({ viewer }: { viewer: NavViewer | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const overBanner = BANNER_PAGES.test(pathname);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y > 200 && y > last + 4) setHidden(true);
      else if (y < last - 4 || y <= 200) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    // Close the mobile menu whenever the route changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  const transparent = overBanner && !scrolled && !mobileOpen;

  const links = viewer
    ? [
        { href: "/", label: "Home" },
        { href: `/user/${viewer.username}`, label: "Profile" },
        { href: `/user/${viewer.username}/movielist`, label: "Movie List" },
        { href: `/user/${viewer.username}/tvlist`, label: "TV List" },
      ]
    : [{ href: "/", label: "Home" }];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const linkClass = (active: boolean) =>
    cn("px-3 py-2 text-[14px] font-semibold transition hover:text-white", active ? "text-white" : "text-nav-text");

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[transform,background-color] duration-300",
          hidden && !mobileOpen && !searchOpen ? "-translate-y-full" : "translate-y-0",
          transparent ? "bg-gradient-to-b from-black/45 to-transparent" : "bg-nav shadow-[0_2px_10px_rgb(0_0_0/0.15)]",
        )}
      >
        <div className="container-page flex h-[60px] items-center justify-between gap-4 md:h-[68px]">
          <Link href="/" aria-label="tvlist home" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center lg:flex" aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))}>
                {l.label}
              </Link>
            ))}
            <Dropdown
              hover
              align="center"
              trigger={() => (
                <button type="button" className={cn(linkClass(pathname.startsWith("/search")), "flex items-center gap-1")}>
                  Browse <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
              panelClassName="mt-0 w-[260px] p-3"
            >
              {(close) => (
                <div className="grid gap-1">
                  <BrowseLink href="/search/movie" icon={<Film />} title="Movies" sub="Trending, top 100, upcoming" onClick={close} />
                  <BrowseLink href="/search/tv" icon={<Tv />} title="TV Shows" sub="Airing, popular, top 100" onClick={close} />
                  <BrowseLink href="/search/people" icon={<Users />} title="People" sub="Actors, directors, writers" onClick={close} />
                  <BrowseLink href="/reviews" icon={<Star />} title="Reviews" sub="Written by the community" onClick={close} />
                  <BrowseLink href="/lists" icon={<ListVideo />} title="Lists" sub="Curated collections" onClick={close} />
                </div>
              )}
            </Dropdown>
            <Link href="/forum" className={linkClass(isActive("/forum"))}>
              Forum
            </Link>
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search (press /)"
              className="rounded-full p-2 text-nav-text transition hover:text-white"
            >
              <Search className="h-5 w-5" />
            </button>

            {viewer ? (
              <>
                <Link
                  href="/notifications"
                  aria-label={`Notifications${viewer.unread ? ` (${viewer.unread} unread)` : ""}`}
                  className="relative rounded-full p-2 text-nav-text transition hover:text-white"
                >
                  <Bell className="h-5 w-5" />
                  {viewer.unread > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
                      {viewer.unread > 99 ? "99+" : viewer.unread}
                    </span>
                  )}
                </Link>
                <Dropdown
                  trigger={(open) => (
                    <button type="button" className="ml-1 flex items-center gap-1 text-nav-text hover:text-white" aria-expanded={open} aria-label="Account menu">
                      <Avatar src={viewer.image} name={viewer.name} size={36} />
                      <ChevronDown className="hidden h-4 w-4 md:block" />
                    </button>
                  )}
                >
                  {(close) => (
                    <>
                      <div className="px-3 pt-1 pb-2 text-[12px] text-text-lighter">
                        Signed in as <span className="font-semibold text-text">{viewer.name}</span>
                      </div>
                      <MenuLink href={`/user/${viewer.username}`} onClick={close} icon={<User className="h-4 w-4" />}>
                        Profile
                      </MenuLink>
                      <MenuLink href={`/user/${viewer.username}/diary`} onClick={close} icon={<NotebookPen className="h-4 w-4" />}>
                        Diary
                      </MenuLink>
                      <MenuLink href="/notifications" onClick={close} icon={<Bell className="h-4 w-4" />}>
                        Notifications
                      </MenuLink>
                      <MenuLink href="/settings" onClick={close} icon={<Settings className="h-4 w-4" />}>
                        Settings
                      </MenuLink>
                      <div className="my-1 h-px bg-fg-grey-dark" />
                      <DropdownItem
                        onClick={() => {
                          close();
                          void signOut();
                        }}
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </DropdownItem>
                    </>
                  )}
                </Dropdown>
              </>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Link href="/login" className="px-3 py-2 text-[14px] font-semibold text-nav-text transition hover:text-white">
                  Login
                </Link>
                <Link href="/signup" className="btn btn-primary px-4 py-2">
                  Sign Up
                </Link>
              </div>
            )}

            <button
              type="button"
              className="rounded-full p-2 text-nav-text transition hover:text-white lg:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="animate-fade border-t border-white/5 bg-nav pb-4 lg:hidden" aria-label="Mobile">
            <div className="container-page grid grid-cols-2 gap-1 pt-3 sm:grid-cols-3">
              {[
                ...links,
                { href: "/search/movie", label: "Browse Movies" },
                { href: "/search/tv", label: "Browse TV" },
                { href: "/search/people", label: "People" },
                { href: "/reviews", label: "Reviews" },
                { href: "/lists", label: "Lists" },
                { href: "/forum", label: "Forum" },
                ...(viewer ? [{ href: "/settings", label: "Settings" }] : [{ href: "/login", label: "Login" }, { href: "/signup", label: "Sign Up" }]),
              ].map((l) => (
                <Link key={l.href} href={l.href} className={cn("rounded px-3 py-2.5", linkClass(isActive(l.href)), "hover:bg-white/5")}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function BrowseLink({ href, icon, title, sub, onClick }: { href: string; icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="group flex items-start gap-3 rounded p-2 transition hover:bg-fg-grey">
      <span className="mt-0.5 text-text-lighter transition group-hover:text-accent [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span>
        <span className="block text-[13px] font-bold text-bright transition group-hover:text-accent">{title}</span>
        <span className="block text-[11px] text-text-lighter">{sub}</span>
      </span>
    </Link>
  );
}

function MenuLink({ href, children, icon, onClick }: { href: string; children: React.ReactNode; icon: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded px-3 py-2 text-[13px] font-semibold text-text transition hover:bg-fg-grey hover:text-accent"
    >
      {icon}
      {children}
    </Link>
  );
}
