import { Link, RouterContextProvider, useLocation, useRouter } from "@tanstack/react-router";
import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { cn } from "@/lib/utils";
import { allPages, GITHUB_URL, sections, type NavSection } from "@/content/nav";
import { DocLink, Icon, IosIcon, Kbd } from "./ui";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-primary-foreground shadow-card">
        <Icon name="rocket_launch" className="text-[20px] text-surface dark:text-foreground" />
      </span>
      <span className="whitespace-nowrap font-display text-[18px] leading-tight text-foreground">
        Mobile Fastlane <span className="hidden sm:inline">Framework</span>
      </span>
    </Link>
  );
}

function sectionFromPath(path: string) {
  if (!path.startsWith("/docs")) return null;
  const rest = path.replace(/^\/docs\/?/, "");
  if (!rest || rest.startsWith("overview")) return "overview";
  return rest.split("/")[0];
}

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("mff-theme", next ? "dark" : "light");
  };
  return { dark, toggle };
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const active = sectionFromPath(pathname);
  const { dark, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName)) { e.preventDefault(); setSearchOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => setDrawer(false), [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-surface">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-variant lg:hidden" onClick={() => setDrawer(true)} aria-label="Open navigation">
            <Icon name="menu" />
          </button>
          <Logo />
          <nav className="ml-6 hidden h-16 items-stretch xl:flex" aria-label="Sections">
            {sections.map((s) => (
              <DocLink key={s.id} to={s.pages[0]!.slug}
                className={cn("flex items-center whitespace-nowrap border-b-2 px-3 text-[14px] font-medium transition-colors", active === s.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {s.label}
              </DocLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="flex h-10 items-center gap-2 rounded-full bg-surface-variant px-3 text-[14px] text-muted-foreground hover:bg-border/50 md:w-64" aria-label="Search">
              <Icon name="search" />
              <span className="hidden flex-1 text-left md:inline">Search</span>
              <span className="hidden md:inline"><Kbd>/</Kbd></span>
            </button>
            <button onClick={toggle} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-variant" aria-label="Toggle theme">
              <Icon name={dark ? "light_mode" : "dark_mode"} />
            </button>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hidden h-9 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium text-primary hover:bg-primary-container sm:inline-flex">
              GitHub <Icon name="open_in_new" className="text-[16px]" />
            </a>
          </div>
        </div>
      </header>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col bg-surface-variant shadow-card animate-in slide-in-from-left">
            <div className="flex h-16 items-center justify-between border-b px-4"><Logo /><button onClick={() => setDrawer(false)} aria-label="Close navigation" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-border/50"><Icon name="close" /></button></div>
            <div className="flex-1 overflow-y-auto"><SideNav /></div>
          </div>
        </div>
      )}
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
    </>
  );
}

function NavGroup({ s, pathname }: { s: NavSection; pathname: string }) {
  const contains = s.pages.some((p) => `/docs${p.slug ? "/" + p.slug : ""}` === pathname);
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-1">
      <button onClick={() => setOpen(!open)} className={cn("flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-[14px] font-medium hover:bg-border/40", contains && "text-foreground")}>
        {s.icon === "apple" ? <IosIcon className="opacity-70" /> : <Icon name={s.icon} className="text-[20px] text-muted-foreground" />}
        <span className="flex-1">{s.label}</span>
        <Icon name={open ? "expand_less" : "expand_more"} className="text-muted-foreground" />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5">
          {s.pages.map((p) => {
            const href = `/docs${p.slug ? "/" + p.slug : ""}`;
            const isActive = href === pathname;
            return (
              <li key={p.slug}>
                <DocLink to={p.slug} className={cn("ml-4 flex items-center gap-2 rounded-full py-1.5 pl-7 pr-3 text-[14px]", isActive ? "bg-primary-container font-medium text-primary" : "text-muted-foreground hover:bg-border/40 hover:text-foreground")}>
                  <span className="flex-1">{p.title}</span>
                  {p.badge === "preview" && <span className="rounded-full border border-accent-strong px-1.5 text-[10px] font-medium text-accent-strong">Preview</span>}
                </DocLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SideNav() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, "") || "/";
  return <nav className="px-3 py-4" aria-label="Documentation">{sections.map((s) => <NavGroup key={s.id} s={s} pathname={path} />)}</nav>;
}

/* ---------- Search ---------- */
type Entry = { slug: string; title: string; section: string; headings: string[]; body: string; description: string };

function SearchPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  const fuse = useMemo(() => {
    const entries: Entry[] = allPages.map((p) => {
      let html = "";
      try {
        html = renderToStaticMarkup(createElement(RouterContextProvider, { router, children: createElement(p.body) }));
      } catch { /* index metadata only */ }
      const headings = Array.from(html.matchAll(/<h[23][^>]*>(.*?)<\/h[23]>/g)).map((m) => (m[1] ?? "").replace(/<[^>]+>/g, ""));
      const body = html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ");
      return { slug: p.slug, title: p.title, section: p.section.label, headings, body, description: p.description };
    });
    return new Fuse(entries, { keys: [{ name: "title", weight: 3 }, { name: "headings", weight: 2 }, { name: "description", weight: 1.5 }, { name: "body", weight: 1 }], threshold: 0.35, ignoreLocation: true, includeMatches: true });
  }, [router]);

  const results = q.trim() ? fuse.search(q).slice(0, 10) : allPages.slice(0, 8).map((p) => ({ item: { slug: p.slug, title: p.title, section: p.section.label, description: p.description, headings: [], body: "" } as Entry, matches: undefined }));
  useEffect(() => setSel(0), [q]);

  const go = (r: (typeof results)[number]) => {
    const hm = r.matches?.find((m) => m.key === "headings");
    const hash = hm?.value ? hm.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : undefined;
    onClose();
    if (!r.item.slug) router.navigate({ to: "/docs", ...(hash ? { hash } : {}) });
    else router.navigate({ to: "/docs/$", params: { _splat: r.item.slug }, ...(hash ? { hash } : {}) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 pt-[10vh]" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-surface shadow-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search documentation">
        <div className="flex items-center gap-3 border-b px-4">
          <Icon name="search" className="text-muted-foreground" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search docs"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === "Enter" && results[sel]) go(results[sel]);
            }}
            className="h-14 flex-1 bg-transparent text-[16px] outline-none" />
          <Kbd>Esc</Kbd>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">No results for "{q}"</li>}
          {results.map((r, i) => {
            const hm = r.matches?.find((m) => m.key === "headings")?.value;
            return (
              <li key={r.item.slug + i}>
                <button onMouseEnter={() => setSel(i)} onClick={() => go(r)} className={cn("flex w-full items-start gap-3 px-4 py-2.5 text-left", i === sel && "bg-primary-container")}>
                  <Icon name={hm ? "tag" : "description"} className="mt-0.5 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium">{r.item.title}{hm && <span className="font-normal text-muted-foreground"> › {hm}</span>}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{r.item.section} · {r.item.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ---------- TOC ---------- */
export function Toc({ deps }: { deps: string }) {
  const [items, setItems] = useState<{ id: string; text: string; level: number }[]>([]);
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("#doc-article h2[id], #doc-article h3[id]"));
    setItems(els.map((e) => ({ id: e.id, text: e.textContent ?? "", level: e.tagName === "H2" ? 2 : 3 })));
    const onScroll = () => {
      let cur = els[0]?.id ?? "";
      for (const e of els) if (e.getBoundingClientRect().top < 120) cur = e.id;
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [deps]);
  if (!items.length) return null;
  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="mb-2 font-medium text-foreground">On this page</p>
      <ul className="border-l">
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className={cn("-ml-px block border-l-2 py-1 pr-2", it.level === 3 ? "pl-6" : "pl-3", active === it.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>{it.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-surface-variant">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-[14px] text-muted-foreground sm:grid-cols-[1fr_auto]">
        <div>
          <Logo />
          <p className="mt-3">Content licensed under MIT.</p>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 hover:text-foreground">GitHub <Icon name="open_in_new" className="text-[14px]" /></a>
        </div>
        <ul className="space-y-1.5">
          <li><Link to="/docs" className="hover:text-foreground">Docs</Link></li>
          <li><a href={`${GITHUB_URL}/commits/main`} target="_blank" rel="noreferrer" className="hover:text-foreground">Changelog</a></li>
          <li><a href={`${GITHUB_URL}/issues/new`} target="_blank" rel="noreferrer" className="hover:text-foreground">Report an issue</a></li>
        </ul>
      </div>
    </footer>
  );
}
