"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { PIcon } from "@/features/public/icons";
import { searchShortcuts } from "@/features/public/data";

type NavEntry = { label: string; href: string; children?: { label: string; href: string }[] };

const NAV: NavEntry[] = [
  {
    label: "Invitations",
    href: "/invitations",
    children: [
      { label: "Wedding", href: "/invitations/wedding" },
      { label: "Celebrations", href: "/celebrations" },
      { label: "Devotional", href: "/devotional" },
      { label: "Corporate", href: "/corporate" },
      { label: "View all invitations", href: "/invitations" },
    ],
  },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Styles", href: "/styles" },
  { label: "Music", href: "/music" },
  { label: "Films", href: "/films" },
  { label: "Our Work", href: "/our-work" },
  { label: "Plans", href: "/plans" },
  { label: "Partners", href: "/partners" },
];

/**
 * Public navigation.
 *
 * `solid` renders the warm cream header from the top — for pages without a
 * full-bleed hero behind the bar. Otherwise the bar is transparent over the
 * hero and turns solid once scrolled past it. The search control is the one
 * glass element; its results panel is solid ivory and covers known
 * destinations only.
 */
export function SiteNav({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(solid);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  useEffect(() => {
    if (!searchOpen) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.body.style.overflow = "hidden";
    closeMenuRef.current?.focus();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const shortcuts = searchShortcuts.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  }));

  return (
    <header className={scrolled ? "nav navScrolled" : "nav"}>
      <div className="navBar">
        <Link href="/" className="brand" aria-label="Shivayonic Invites — home">
          <span className="brandName">SHIVAYONIC</span>
          <span className="brandSub">Invites</span>
        </Link>

        <nav className="navLinks" aria-label="Primary">
          {NAV.map((entry) =>
            entry.children ? (
              <div key={entry.label} className="navGroup">
                <a href={entry.href} className="navLink navLinkParent">
                  {entry.label}
                  <PIcon name="chevronDown" size={13} />
                </a>
                <div className="navMenu" role="menu">
                  {entry.children.map((child) => (
                    <a key={child.href + child.label} href={child.href} className="navMenuItem" role="menuitem">
                      {child.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <a key={entry.href} href={entry.href} className="navLink">
                {entry.label}
              </a>
            ),
          )}
        </nav>

        <span className="navSpacer" />

        <div className="searchWrap" ref={searchRef}>
          <button
            type="button"
            className="searchTrigger"
            aria-label="Search invitations, music and films"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <PIcon name="search" size={17} />
            <span className="searchTriggerLabel">Search invitations, music, films…</span>
          </button>

          {searchOpen ? (
            <div className="searchPanel" role="dialog" aria-label="Search">
              <input
                ref={inputRef}
                className="searchInput"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search invitations, music, films…"
                aria-label="Search invitations, music and films"
              />
              {shortcuts.map((group) =>
                group.items.length > 0 ? (
                  <div key={group.group} className="searchGroup">
                    <p className="searchGroupLabel">{group.group}</p>
                    <div className="searchChips">
                      {group.items.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          className="searchChip"
                          onClick={() => setSearchOpen(false)}
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
              {shortcuts.every((g) => g.items.length === 0) ? (
                <p className="searchGroupLabel" style={{ padding: "1rem 0.4rem" }}>
                  No destinations match “{query}”. Full catalogue search arrives with the shop.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="navIcon menuBtn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <PIcon name="menu" size={20} />
        </button>
      </div>

      {menuOpen ? (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="drawerTop">
            <span className="brandName" style={{ color: "var(--cocoa)" }}>
              SHIVAYONIC
            </span>
            <button
              ref={closeMenuRef}
              type="button"
              className="navIcon"
              style={{ display: "inline-flex", color: "var(--cocoa)", borderColor: "var(--cocoa-line)", background: "transparent" }}
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <PIcon name="close" size={20} />
            </button>
          </div>
          <nav className="drawerLinks" aria-label="Primary">
            {NAV.map((entry) => (
              <div key={entry.label}>
                <a href={entry.href} className="drawerLink" onClick={() => setMenuOpen(false)}>
                  {entry.label}
                </a>
                {entry.children ? (
                  <div className="drawerSub">
                    {entry.children.map((child) => (
                      <a
                        key={child.href + child.label}
                        href={child.href}
                        className="drawerSubLink"
                        onClick={() => setMenuOpen(false)}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <a href="/contact" className="drawerLink" onClick={() => setMenuOpen(false)}>
              Contact
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
