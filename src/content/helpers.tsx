import type { ComponentType, ReactNode } from "react";

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
export function H2({ children, id }: { children: string; id?: string }) {
  return <h2 id={id ?? slugify(children)}>{children}</h2>;
}
export function H3({ children, id }: { children: string; id?: string }) {
  return <h3 id={id ?? slugify(children)}>{children}</h3>;
}
export function C({ children }: { children: ReactNode }) {
  return <code>{children}</code>;
}

export type DocPage = {
  /** Path relative to /docs, "" for the intro */
  slug: string;
  title: string;
  description: string;
  badge?: "preview" | "android" | "ios";
  body: ComponentType;
};
