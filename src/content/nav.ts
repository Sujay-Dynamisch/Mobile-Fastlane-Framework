import type { DocPage } from "./helpers";
import { overviewPages, startPages } from "./overview-start";
import { androidPages, iosPages } from "./platforms";
import { ciPages, configurePages, helpPages, referencePages } from "./configure-help";
import { setupPages } from "./interactive-setup";

export type NavSection = { id: string; label: string; icon: string; pages: DocPage[] };

export const sections: NavSection[] = [
  { id: "overview", label: "Overview", icon: "home", pages: overviewPages },
  { id: "get-started", label: "Get started", icon: "rocket_launch", pages: startPages },
  { id: "setup", label: "Interactive setup", icon: "terminal", pages: setupPages },
  { id: "android", label: "Android", icon: "android", pages: androidPages },
  { id: "ios", label: "iOS", icon: "apple", pages: iosPages },
  { id: "configure", label: "Configure", icon: "tune", pages: configurePages },
  { id: "ci", label: "CI/CD", icon: "sync", pages: ciPages },
  { id: "reference", label: "Reference", icon: "menu_book", pages: referencePages },
  { id: "help", label: "Help", icon: "help", pages: helpPages },
];

export const allPages = sections.flatMap((s) => s.pages.map((p) => ({ ...p, section: s })));
export type FlatPage = (typeof allPages)[number];

export function findPage(slug: string) {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  const i = allPages.findIndex((p) => p.slug === clean);
  if (i < 0) return null;
  return { page: allPages[i]!, prev: allPages[i - 1] ?? null, next: allPages[i + 1] ?? null };
}

export const LAST_UPDATED = "2026-10-14";
export const GITHUB_URL = "https://github.com/Sujay-Dynamisch/Mobile-Fastlane-Framework";
