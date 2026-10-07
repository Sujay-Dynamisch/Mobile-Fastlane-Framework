import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LAST_UPDATED, type FlatPage } from "@/content/nav";
import { cn } from "@/lib/utils";
import { Toc } from "./shell";
import { Badge, DocLink, Icon, useCopy } from "./ui";

function Feedback({ slug }: { slug: string }) {
  const key = `mff-feedback:${slug || "intro"}`;
  const [vote, setVote] = useState<string | null>(null);
  useEffect(() => setVote(localStorage.getItem(key)), [key]);
  const cast = (v: "up" | "down") => { localStorage.setItem(key, v); setVote(v); toast.success("Thanks for the feedback"); };
  return (
    <div className="mt-12 flex flex-wrap items-center gap-3 border-t pt-6 text-[14px]">
      <span className="font-medium">Was this helpful?</span>
      {(["up", "down"] as const).map((v) => (
        <button key={v} onClick={() => cast(v)} aria-pressed={vote === v} aria-label={v === "up" ? "Yes" : "No"}
          className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full border", vote === v ? "border-primary bg-primary-container text-primary" : "text-muted-foreground hover:bg-surface-variant")}>
          <Icon name={v === "up" ? "thumb_up" : "thumb_down"} className="text-[18px]" />
        </button>
      ))}
    </div>
  );
}

function PageCard({ p, dir }: { p: FlatPage; dir: "prev" | "next" }) {
  return (
    <DocLink to={p.slug} className={cn("flex flex-1 flex-col rounded-xl border p-4 hover:border-primary hover:shadow-card", dir === "next" && "text-right")}>
      <span className="flex items-center gap-1 text-[13px] text-muted-foreground" style={{ justifyContent: dir === "next" ? "flex-end" : "flex-start" }}>
        {dir === "prev" && <Icon name="arrow_back" className="text-[16px]" />}{dir === "prev" ? "Previous" : "Next"}{dir === "next" && <Icon name="arrow_forward" className="text-[16px]" />}
      </span>
      <span className="mt-1 font-medium text-primary">{p.title}</span>
    </DocLink>
  );
}

export function DocView({ page, prev, next }: { page: FlatPage; prev: FlatPage | null; next: FlatPage | null }) {
  const Body = page.body;
  const { copied, tick, copy } = useCopy();
  const copyMd = () => {
    const el = document.getElementById("doc-article");
    if (!el) return;
    copy(`# ${page.title}\n\n${el.innerText}`);
    toast.success("Page copied as Markdown");
  };
  return (
    <div className="flex gap-10">
      <article className="min-w-0 max-w-[840px] flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-[14px] text-muted-foreground" aria-label="Breadcrumb">
          <DocLink to="" className="hover:text-foreground">Docs</DocLink>
          <Icon name="chevron_right" className="text-[18px]" />
          <DocLink to={page.section.pages[0]!.slug} className="hover:text-foreground">{page.section.label}</DocLink>
          <Icon name="chevron_right" className="text-[18px]" />
          <span>{page.title}</span>
        </nav>
        <div className="doc-prose">
          <h1 className="flex flex-wrap items-center gap-3">{page.title}{page.badge && <Badge variant={page.badge} />}</h1>
        </div>
        <div className="mt-3 mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-b pb-4 text-[13px] text-muted-foreground">
          <span>Last updated {LAST_UPDATED}</span>
          <button onClick={copyMd} className="inline-flex items-center gap-1 hover:text-primary"><Icon key={tick} name={copied ? "check" : "content_copy"} className={cn("text-[16px]", copied && "animate-copy-pop text-success-border")} />{copied ? "Copied!" : "Copy page as Markdown"}</button>
        </div>
        <div id="doc-article" className="doc-prose">
          <Body />
        </div>
        <Feedback slug={page.slug} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {prev ? <PageCard p={prev} dir="prev" /> : <span className="flex-1" />}
          {next ? <PageCard p={next} dir="next" /> : <span className="flex-1" />}
        </div>
      </article>
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[220px] shrink-0 overflow-y-auto py-8 pr-4 xl:block">
        <Toc deps={page.slug} />
      </aside>
    </div>
  );
}
