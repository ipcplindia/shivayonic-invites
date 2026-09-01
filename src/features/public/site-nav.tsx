"use client";

import { useEffect, useRef, useState } from "react";

import { PIcon } from "@/features/public/icons";
import { navLinks, searchShortcuts } from "@/features/public/data";

/**
 * Public navigation.
 *
 * Transparent over the hero (hard lock — no bar), warm solid once scrolled past
 * it. The search control is the one glass element; its results panel is solid
 * ivory for readability. Search covers only known destinations and says so —
 * there is no public search API to fake.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const shortcuts = searchShortcuts.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  }));

  return (
    <header className={scrolled ? "nav navScrolled" : "nav"}>
      <div className="navBar">
        <a href="#top" className="brand" aria-label="Shivayonic Invites — home">
          <span className="brandName">SHIVAYONIC</span>
          <span className="brandSub">Invites</span>
        </a>

        <nav className="navLinks" aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.href + link.label} href={link.href} className="navLink">
              {link.label}
            </a>
          ))}
        </nav>

        <span className="navSpacer" />

        <div className="searchWrap" ref={searchRef}>
          <button
            type="button"
            className="searchTrigger"
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
        <div className="drawer" role="dialog" aria-label="Menu">
          <div className="drawerTop">
            <span className="brandName" style={{ color: "var(--cocoa)" }}>
              SHIVAYONIC
            </span>
            <button
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
            {navLinks.map((link) => (
              <a
                key={link.href + link.label}
                href={link.href}
                className="drawerLink"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
