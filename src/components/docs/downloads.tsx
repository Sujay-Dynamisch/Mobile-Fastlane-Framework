import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CONSOLES, TOOLS, type ConsoleId, type OsKey, type Tool, type ToolId } from "@/content/tools";
import { Cmd, CodeBlock, Icon } from "./ui";

const OS_META: Record<OsKey | "all", { label: string; icon: string }> = {
  windows: { label: "Windows", icon: "desktop_windows" },
  mac: { label: "macOS", icon: "laptop_mac" },
  linux: { label: "Linux", icon: "terminal" },
  all: { label: "All platforms", icon: "public" },
};
const OS_ORDER: OsKey[] = ["windows", "mac", "linux"];

/** The reader's OS, detected in the browser (null during SSR / unknown). */
function useReaderOs(): OsKey | null {
  const [os, setOs] = useState<OsKey | null>(null);
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setOs(ua.includes("windows") ? "windows" : ua.includes("mac") ? "mac" : ua.includes("linux") ? "linux" : null);
  }, []);
  return os;
}

function ToolCard({ tool, os }: { tool: Tool; os: OsKey | null }) {
  const downloads = (Object.entries(tool.download) as [OsKey | "all", { label: string; href: string }][])
    .sort(([a], [b]) => (a === os ? -1 : b === os ? 1 : 0));
  const installOrder = OS_ORDER.filter((k) => tool.install?.[k]).sort((a, b) => (a === os ? -1 : b === os ? 1 : 0));
  return (
    <div className="no-prose rounded-xl border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-primary"><Icon name={tool.icon} className="text-[22px]" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{tool.name}</span>
            <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{tool.version}</span>
          </div>
          <p className="m-0 mt-0.5 text-[14px] text-muted-foreground">{tool.why}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {downloads.map(([k, d]) => {
          const mine = k === os;
          return (
            <a key={k + d.href} href={d.href} target="_blank" rel="noreferrer"
              className={cn("no-prose inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium",
                mine ? "bg-primary text-primary-foreground hover:opacity-90" : "border text-primary hover:bg-primary-container")}>
              <Icon name={k === "all" ? "download" : OS_META[k].icon} className="text-[16px]" />
              {d.label}
              {mine && <span className="rounded-full bg-white/25 px-1.5 text-[10px] uppercase tracking-wide">your OS</span>}
              <Icon name="open_in_new" className="text-[14px] opacity-80" />
            </a>
          );
        })}
      </div>

      {installOrder.length > 0 && (
        <div className="[&>div]:my-3">
          <CodeBlock tabs={installOrder.map((k) => ({ label: `${OS_META[k].label} · ${tool.install![k]!.label}`, code: tool.install![k]!.code, language: k === "windows" ? "powershell" : "bash" }))} />
        </div>
      )}

      {(tool.verify || tool.note || tool.docs) && (
        <div className="mt-1 flex flex-col gap-1 text-[13px] text-muted-foreground">
          {tool.verify && <div className="flex flex-wrap items-center gap-1">Verify: <Cmd>{tool.verify}</Cmd></div>}
          {tool.note && <div className="flex gap-1"><Icon name="info" className="text-[16px]" /><span>{tool.note}</span></div>}
          {tool.docs && <a href={tool.docs} target="_blank" rel="noreferrer" className="no-prose inline-flex items-center gap-1 text-primary hover:underline">Official install guide <Icon name="open_in_new" className="text-[14px]" /></a>}
        </div>
      )}
    </div>
  );
}

/** Download + install cards for the given tools, ordered so the reader's OS comes first. */
export function ToolDownloads({ ids, title = "Download & install" }: { ids: ToolId[]; title?: string | null }) {
  const os = useReaderOs();
  return (
    <section className="no-prose my-6">
      {title && <div className="mb-3 flex items-center gap-2 font-medium"><Icon name="download" className="text-primary" />{title}</div>}
      <div className="grid gap-3">
        {ids.map((id) => <ToolCard key={id} tool={TOOLS[id]} os={os} />)}
      </div>
    </section>
  );
}

/** One-click buttons to the web consoles a step needs (open in a new tab). */
export function ConsoleButtons({ ids, label = "Open" }: { ids: ConsoleId[]; label?: string }) {
  return (
    <div className="no-prose my-4 flex flex-wrap gap-2">
      {ids.map((id) => {
        const c = CONSOLES[id];
        return (
          <a key={id} href={c.href} target="_blank" rel="noreferrer"
            className="no-prose inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-2 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary">
            <Icon name={c.icon} className="text-[18px] text-primary" />
            <span className="text-muted-foreground">{label}</span> {c.name}
            <Icon name="open_in_new" className="text-[14px] text-muted-foreground" />
          </a>
        );
      })}
    </div>
  );
}
