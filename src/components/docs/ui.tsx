import "./prism";
import { Highlight, themes } from "prism-react-renderer";
import { Link } from "@tanstack/react-router";
import { Children, isValidElement, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cn("material-symbols-outlined", className)} aria-hidden>{name}</span>;
}

/* ---------- Callout ---------- */
type CalloutType = "note" | "caution" | "warning" | "success" | "tip";
const calloutMeta: Record<CalloutType, { icon: string; label: string; cls: string; iconCls: string }> = {
  note: { icon: "info", label: "Note", cls: "bg-note-bg border-note-border", iconCls: "text-note-border" },
  tip: { icon: "lightbulb", label: "Tip", cls: "bg-note-bg border-note-border", iconCls: "text-note-border" },
  caution: { icon: "warning", label: "Caution", cls: "bg-caution-bg border-caution-border", iconCls: "text-caution-text" },
  warning: { icon: "error", label: "Warning", cls: "bg-warning-bg border-warning-border", iconCls: "text-warning-text" },
  success: { icon: "check_circle", label: "Key point", cls: "bg-success-bg border-success-border", iconCls: "text-success-text" },
};
export function Callout({ type = "note", title, children }: { type?: CalloutType; title?: string; children: ReactNode }) {
  const m = calloutMeta[type];
  return (
    <div className={cn("my-5 flex gap-3 rounded-lg border-l-4 px-4 py-3 text-[15px]", m.cls)} role="note">
      <Icon name={m.icon} className={cn("mt-0.5", m.iconCls)} />
      <div className="min-w-0 flex-1 [&>*:last-child]:mb-0 [&>p]:mb-2 [&>ul]:mb-0">
        <strong className="font-medium">{title ?? m.label}:</strong>{" "}
        {children}
      </div>
    </div>
  );
}

/* ---------- Code ---------- */
/** Copies text and exposes a counter so every click replays the copy animation. */
export function useCopy() {
  const [copied, setCopied] = useState(0);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(0), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied((n) => n + 1);
  };
  return { copied: copied > 0, tick: copied, copy };
}

/** Floating "Copied!" bubble shown beside (left of) a copy button, so containers with overflow:hidden never clip it. */
function CopiedBubble({ tick }: { tick: number }) {
  if (!tick) return null;
  return (
    <span key={tick} aria-hidden className="animate-copy-bubble pointer-events-none absolute right-full top-1/2 z-20 mr-1.5 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 font-sans text-[11px] font-medium text-background shadow">
      Copied!
    </span>
  );
}

/** Icon copy button (or a labelled pill with `label`), with pop + bubble feedback. */
export function CopyButton({ text, className, label, inline }: { text: string; className?: string; label?: string; inline?: boolean }) {
  const { copied, tick, copy } = useCopy();
  // `inline`: show "Copied!" beside the icon instead of a bubble (used where a bubble would be clipped).
  if (inline) {
    return (
      <button type="button" onClick={() => copy(text)} aria-label={copied ? "Copied" : "Copy"} title={copied ? "Copied" : "Copy"}
        className={cn("inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-full px-1 transition-colors", className)}>
        {copied && <span key={`t${tick}`} className="animate-copy-pop font-sans text-[11px] font-medium text-[#81c995]">Copied!</span>}
        <Icon key={tick} name={copied ? "check" : "content_copy"} className={cn("text-[15px]!", copied && "animate-copy-pop text-[#81c995]")} />
        <span role="status" className="sr-only">{copied ? "Copied to clipboard" : ""}</span>
      </button>
    );
  }
  const icon = <Icon key={tick} name={copied ? "check" : "content_copy"} className={cn("text-[18px]", copied && "animate-copy-pop text-success-border")} />;
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
        label ? "gap-1.5 rounded-full border bg-surface px-3 py-1.5 text-[13px] font-medium hover:border-primary hover:text-primary" : "h-8 w-8 rounded-full hover:bg-border/60",
        className,
      )}
      aria-label={copied ? "Copied" : label ?? "Copy"}
      title={copied ? "Copied" : label ?? "Copy"}
    >
      {icon}{label && <span>{copied ? "Copied" : label}</span>}
      <span role="status" className="sr-only">{copied ? "Copied to clipboard" : ""}</span>
      {!label && <CopiedBubble tick={tick} />}
    </button>
  );
}

/** Inline command with its own copy button, e.g. in step titles and tables. */
export function Cmd({ children }: { children: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-0.5 align-middle">
      <code className="rounded bg-code px-1.5 py-0.5 font-mono text-[13px] break-all">{children}</code>
      <CopyButton text={children} className="h-6 w-6 [&_.material-symbols-outlined]:text-[15px]!" />
    </span>
  );
}

const COMMAND_RE = /^(bundle|fastlane|git|npm|npx|firebase|gcloud|ruby|gem|ridk|brew|rbenv|pod|cp|curl)\b/;

const langLabel: Record<string, string> = { yaml: "YAML", ruby: "Ruby", bash: "Shell", powershell: "PowerShell", ignore: ".gitignore", text: "Text", json: "JSON" };

function HighlightedCode({ code, language, highlight = [] }: { code: string; language: string; highlight?: number[] }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const upd = () => setDark(el.classList.contains("dark"));
    upd();
    const mo = new MutationObserver(upd);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return (
    <Highlight code={code.replace(/\n$/, "")} language={language} theme={dark ? themes.vsDark : themes.github}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="overflow-x-auto px-4 py-3 text-[14px] leading-[1.6]">
          <code>
            {tokens.map((line, i) => {
              const lp = getLineProps({ line });
              return (
                <div key={i} {...lp} style={undefined} className={cn("min-w-max", highlight.includes(i + 1) && "-mx-4 bg-primary-container px-4")}>
                  {line.map((token, k) => {
                    const tp = getTokenProps({ token });
                    return <span key={k} {...tp} style={{ ...tp.style, background: "transparent" }} />;
                  })}
                </div>
              );
            })}
          </code>
        </pre>
      )}
    </Highlight>
  );
}

export function CodeBlock({
  code, language = "bash", filename, highlight, tabs,
}: {
  code?: string; language?: string; filename?: string; highlight?: number[];
  tabs?: { label: string; code: string; language?: string }[];
}) {
  const [active, setActive] = useState(0);
  const cur = tabs ? tabs[active]! : { label: filename ?? langLabel[language] ?? language, code: code ?? "", language };
  return (
    <div className="my-5 overflow-hidden rounded-lg border bg-code">
      <div className="flex items-center justify-between gap-2 border-b pl-2 pr-1">
        <div className="flex min-w-0 overflow-x-auto">
          {tabs ? tabs.map((t, i) => (
            <button key={t.label} type="button" onClick={() => setActive(i)}
              className={cn("whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium", i === active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          )) : <span className="px-2 py-2 font-mono text-[13px] text-muted-foreground">{cur.label}</span>}
        </div>
        <CopyButton text={cur.code} />
      </div>
      <HighlightedCode code={cur.code} language={cur.language ?? language} highlight={highlight ?? []} />
    </div>
  );
}

/* ---------- Steps ---------- */
export function Steps({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <ol className="my-6 list-none! pl-0!">
      {items.map((child, i) => (
        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
          {i < items.length - 1 && <span className="absolute left-[15px] top-9 bottom-1 w-px bg-border" aria-hidden />}
          <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">{i + 1}</span>
          <div className="min-w-0 flex-1 pt-1 [&>*:last-child]:mb-0">{child}</div>
        </li>
      ))}
    </ol>
  );
}
export function Step({ title, children }: { title?: ReactNode; children?: ReactNode }) {
  return <div>{title && <p className="mb-1! font-medium">{title}</p>}{children}</div>;
}

/* ---------- Platform tabs ---------- */
export function PlatformTabs({ android, ios }: { android: ReactNode; ios: ReactNode }) {
  const [p, setP] = useState<"android" | "ios">("android");
  useEffect(() => {
    const v = localStorage.getItem("mff-platform");
    if (v === "ios" || v === "android") setP(v);
  }, []);
  const choose = (v: "android" | "ios") => { setP(v); localStorage.setItem("mff-platform", v); };
  return (
    <div className="my-6">
      <div className="mb-4 inline-flex rounded-full border p-1" role="tablist">
        {([["android", "android", "Android"], ["ios", "apple", "iOS"]] as const).map(([v, ic, l]) => (
          <button key={v} role="tab" aria-selected={p === v} onClick={() => choose(v)}
            className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium", p === v ? "bg-primary-container text-primary" : "text-muted-foreground hover:text-foreground")}>
            {ic === "apple" ? <IosIcon className="h-4 w-4" /> : <Icon name={ic} className="text-[18px]" />}{l}
          </button>
        ))}
      </div>
      <div>{p === "android" ? android : ios}</div>
    </div>
  );
}

/* ---------- Tables ---------- */
export function ParamTable({ head, rows, codeFirst = true }: { head: string[]; rows: ReactNode[][]; codeFirst?: boolean }) {
  return (
    <div className="my-5 max-h-[640px] overflow-auto rounded-lg border">
      <table className="w-full border-collapse text-[14px]">
        <thead className="sticky top-0 z-[1] bg-surface-variant">
          <tr>{head.map((h) => <th key={h} className="border-b px-4 py-2.5 text-left font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="even:bg-surface-variant/60">
              {r.map((c, j) => (
                <td key={j} className="border-b px-4 py-2.5 align-top last:min-w-[200px]">
                  {j === 0 && codeFirst && typeof c === "string"
                    ? (COMMAND_RE.test(c) ? <Cmd>{c}</Cmd> : <code className="rounded bg-code px-1.5 py-0.5 font-mono text-[13px]">{c}</code>)
                    : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const statusIcon = {
  ok: <Icon name="check_circle" className="text-success-border" />,
  warn: <Icon name="warning" className="text-caution-border" />,
  none: <Icon name="remove" className="text-muted-foreground" />,
};
export type Status = keyof typeof statusIcon;
export function StatusIcon({ s }: { s: Status }) { return <span className="inline-flex align-middle" aria-label={s}>{statusIcon[s]}</span>; }
export function StatusTable({ head, rows }: { head: string[]; rows: { label: ReactNode; cells: (Status | ReactNode)[] }[] }) {
  return (
    <ParamTable codeFirst={false} head={head} rows={rows.map((r) => [
      <span className="font-medium">{r.label}</span>,
      ...r.cells.map((c) => (typeof c === "string" && c in statusIcon ? <StatusIcon s={c as Status} /> : c)),
    ])} />
  );
}

export function EnvVarTable({ rows, showRequired = true }: { rows: [string, string, ReactNode][] | [string, ReactNode][]; showRequired?: boolean }) {
  return (
    <div className="my-5 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-[14px]">
        <thead className="bg-surface-variant">
          <tr>
            <th className="border-b px-4 py-2.5 text-left font-medium">Variable</th>
            {showRequired && <th className="border-b px-4 py-2.5 text-left font-medium">Required</th>}
            <th className="border-b px-4 py-2.5 text-left font-medium">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const name = r[0];
            const req = showRequired ? (r[1] as string) : null;
            const desc = showRequired ? r[2] : r[1];
            return (
              <tr key={i} className="even:bg-surface-variant/60">
                <td className="border-b px-4 py-2 align-top">
                  <div className="flex items-start gap-1">
                    <code className="break-all rounded bg-code px-1.5 py-0.5 font-mono text-[13px]">{name}</code>
                    <CopyButton text={name} className="h-6 w-6 shrink-0" />
                  </div>
                </td>
                {showRequired && <td className="border-b px-4 py-2 align-top"><Badge variant={/^optional|recommended/i.test(req!) ? "optional" : "required"}>{req}</Badge></td>}
                <td className="border-b px-4 py-2 align-top">{desc}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Badge, Kbd, Placeholder ---------- */
export function Badge({ variant, children }: { variant: "preview" | "android" | "ios" | "required" | "optional"; children?: ReactNode }) {
  const cls = {
    preview: "border border-accent-strong text-accent-strong",
    android: "bg-success-bg text-success-text",
    ios: "bg-primary-container text-primary",
    required: "bg-warning-bg text-warning-text",
    optional: "bg-surface-variant text-muted-foreground border",
  }[variant];
  const label = children ?? { preview: "Preview", android: "Android", ios: "iOS", required: "Required", optional: "Optional" }[variant];
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 align-middle font-sans text-[12px] font-medium", cls)}>{label}</span>;
}
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-b-2 bg-surface px-1.5 py-0.5 font-mono text-[12px] text-muted-foreground">{children}</kbd>;
}
/** A value the reader must replace. */
export function Ph({ children }: { children: ReactNode }) {
  return <code className="cursor-help underline decoration-dotted underline-offset-4" title="Replace with your value">{children}</code>;
}

/* ---------- FileTree ---------- */
export function FileTree({ tree }: { tree: string }) {
  const lines = tree.replace(/^\n|\n$/g, "").split("\n");
  return (
    <div className="my-5 overflow-x-auto rounded-lg border bg-code px-4 py-3 font-mono text-[13px] leading-[1.75]">
      {lines.map((l, i) => {
        const idx = l.indexOf("#");
        const main = idx >= 0 ? l.slice(0, idx) : l;
        const comment = idx >= 0 ? l.slice(idx) : "";
        const m = main.match(/^([\s│├└─]*)(.*)$/)!;
        const pre = m[1] ?? "";
        const name = (m[2] ?? "").trimEnd();
        const isDir = name.endsWith("/");
        return (
          <div key={i} className="flex min-w-max items-center whitespace-pre">
            <span className="text-muted-foreground/70">{pre}</span>
            {name && <Icon name={isDir ? "folder" : "description"} className={cn("mr-1.5 text-[16px]", isDir ? "text-accent-strong" : "text-muted-foreground")} />}
            <span className={isDir ? "font-medium" : ""}>{main.slice(pre.length)}</span>
            {comment && <span className="text-muted-foreground">{comment}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Flow ---------- */
export type FlowNode = string | { label: ReactNode; branch?: { title: string; steps: ReactNode[] }[] };
export function Flow({ steps, horizontal = false }: { steps: FlowNode[]; horizontal?: boolean }) {
  if (horizontal) {
    return (
      <div className="my-5 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="rounded-full border bg-surface-variant px-3 py-1.5 text-[14px]">{typeof s === "string" ? s : s.label}</div>
            {i < steps.length - 1 && <Icon name="arrow_forward" className="text-[18px] text-muted-foreground" />}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="my-6 flex flex-col items-stretch">
      {steps.map((s, i) => {
        const node = typeof s === "string" ? { label: s } : s;
        return (
          <div key={i} className="flex flex-col items-center">
            <div className={cn("w-full max-w-xl rounded-xl border bg-surface px-4 py-3 text-center text-[15px] shadow-card", node.branch && "border-accent bg-caution-bg")}>
              {node.label}
            </div>
            {node.branch && (
              <div className="mt-3 grid w-full gap-3 sm:grid-cols-2">
                {node.branch.map((b) => (
                  <div key={b.title} className="rounded-xl border border-dashed p-3">
                    <p className="mb-2 text-sm font-medium text-primary">{b.title}</p>
                    <ol className="list-decimal! space-y-1 pl-5! text-[14px]">{b.steps.map((x, k) => <li key={k}>{x}</li>)}</ol>
                  </div>
                ))}
              </div>
            )}
            {i < steps.length - 1 && <Icon name="arrow_downward" className="my-1.5 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Cards ---------- */
export function CardGrid({ cards, cols = 2 }: { cards: { icon: string; title: string; desc: string; to: string }[]; cols?: 2 | 3 }) {
  return (
    <div className={cn("my-6 grid gap-4 sm:grid-cols-2", cols === 3 && "lg:grid-cols-3")}>
      {cards.map((c) => (
        <DocLink key={c.to} to={c.to} className="no-prose group flex flex-col rounded-xl border bg-surface p-5 transition-shadow hover:shadow-card">
          {c.icon === "apple" ? <IosIcon className="mb-3 h-7 w-7 text-primary" /> : <Icon name={c.icon} className="mb-3 text-[28px] text-primary" />}
          <span className="font-display text-[18px] font-medium">{c.title}</span>
          <span className="mt-1 flex-1 text-[14px] text-muted-foreground">{c.desc}</span>
          <span className="mt-3 inline-flex items-center gap-1 text-[14px] font-medium text-primary">
            Learn more <Icon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-0.5" />
          </span>
        </DocLink>
      ))}
    </div>
  );
}

/* ---------- Accordion ---------- */
export function Accordion({ items, icon }: { items: { q: ReactNode; a: ReactNode }[]; icon?: string }) {
  return (
    <div className="my-5 divide-y rounded-lg border">
      {items.map((it, i) => (
        <details key={i} className="group">
          <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 font-medium hover:bg-surface-variant [&::-webkit-details-marker]:hidden">
            {icon && <Icon name={icon} className="mt-0.5 text-warning-text" />}
            <span className="flex-1">{it.q}</span>
            <Icon name="expand_more" className="text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 pl-12 text-[15px]">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

export function ScreenshotFrame({ caption }: { caption: string }) {
  return (
    <figure className="m-0">
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border bg-surface-variant">
        <Icon name="image" className="text-[40px] text-muted-foreground" />
      </div>
      <figcaption className="mt-1.5 text-center text-[13px] text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

/* ---------- Terminal screenshot ---------- */
/**
 * A terminal window that reads like a screenshot of a real run.
 * Line prefixes: "$ " / "PS> " = command, "# " = comment, "+ " = success,
 * "! " = warning, "x " = error, "? " = interactive prompt, "> " = selected answer,
 * "~ " = dim output. Anything else is plain output.
 */
export function Terminal({ title = "Terminal", os = "mac", lines, caption }: { title?: string; os?: "mac" | "windows"; lines: string; caption?: ReactNode }) {
  const rows = lines.replace(/^\n|\n$/g, "").split("\n");
  const commands = rows.filter((l) => /^(\$ |PS> )/.test(l)).map((l) => l.replace(/^(\$ |PS> )/, "")).join("\n");
  const render = (l: string, i: number) => {
    const m = l.match(/^(\$ |PS> |# |\+ |! |x |\? |> |~ )([\s\S]*)$/);
    if (!m) return <div key={i} className="min-w-max">{l || "\u00a0"}</div>;
    const [, tag, rest] = m;
    switch (tag) {
      case "$ ": return <CommandLine key={i} prompt={<><span className="text-[#81c995]">~/my-app</span> <span className="text-[#8ab4f8]">$</span></>} cmd={rest!} />;
      case "PS> ": return <CommandLine key={i} prompt={<span className="text-[#8ab4f8]">PS C:\my-app&gt;</span>} cmd={rest!} />;
      case "# ": return <div key={i} className="min-w-max italic text-[#9aa0a6]"># {rest}</div>;
      case "+ ": return <div key={i} className="min-w-max text-[#81c995]">{rest}</div>;
      case "! ": return <div key={i} className="min-w-max text-[#fdd663]">{rest}</div>;
      case "x ": return <div key={i} className="min-w-max text-[#f28b82]">{rest}</div>;
      case "? ": return <div key={i} className="min-w-max"><span className="text-[#78d9ec]">?</span> <span className="font-medium text-white">{rest}</span></div>;
      case "> ": return <div key={i} className="min-w-max"><span className="text-[#78d9ec]">❯ {rest}</span></div>;
      default: return <div key={i} className="min-w-max text-[#9aa0a6]">{rest}</div>;
    }
  };
  return (
    <figure className="no-prose my-6">
      <div className="overflow-hidden rounded-xl border border-black/20 bg-terminal text-terminal-fg shadow-card">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2">
          {os === "mac" ? (
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </span>
          ) : <Icon name="terminal" className="text-[16px] opacity-70" />}
          <span className={cn("flex-1 truncate font-mono text-[12px] opacity-70", os === "mac" && "text-center")}>{title}</span>
          {commands && <CopyButton text={commands} className="h-7 w-7 text-terminal-fg/70 hover:bg-white/10 hover:text-white" />}
        </div>
        <pre className="m-0 overflow-x-auto px-4 py-3 font-mono text-[13px] leading-[1.65]"><code>{rows.map(render)}</code></pre>
      </div>
      {caption && <figcaption className="mt-2 text-center text-[13px] text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

/** One command inside a Terminal, with a per-line copy button (on hover; always visible on touch). */
function CommandLine({ prompt, cmd }: { prompt: ReactNode; cmd: string }) {
  return (
    <div className="group/cmd -mx-2 flex min-w-max items-center gap-2 rounded px-2 hover:bg-white/[0.06]">
      <span>{prompt} <span className="font-medium text-white">{cmd}</span></span>
      <CopyButton inline text={cmd} className="ml-auto text-terminal-fg/60 opacity-100 hover:bg-white/10 hover:text-white sm:opacity-0 sm:group-hover/cmd:opacity-100 sm:focus-visible:opacity-100" />
    </div>
  );
}

/* ---------- Claude prompt ---------- */
/** A ready-to-paste prompt for Claude, with copy and "Open Claude" actions. */
export function ClaudePrompt({ title = "Ask Claude", description, prompt }: { title?: string; description?: ReactNode; prompt: string }) {
  return (
    <section className="no-prose my-6 overflow-hidden rounded-xl border bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b bg-[#f6f1ea] px-4 py-3 dark:bg-[#2b2622]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d97757] text-white"><Icon name="auto_awesome" className="text-[18px]" /></span>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{title}</div>
          {description && <div className="text-[13px] text-muted-foreground">{description}</div>}
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={prompt} label="Copy prompt" />
          <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className="no-prose inline-flex items-center gap-1 rounded-full bg-[#d97757] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#c4643f]">
            Open Claude <Icon name="open_in_new" className="text-[15px]" />
          </a>
        </div>
      </div>
      <pre className="m-0 max-h-[360px] overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] leading-[1.6]">{prompt}</pre>
    </section>
  );
}

/* ---------- Official documentation links ---------- */
/** Inline link to an external (official) page, opens in a new tab. */
export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}<Icon name="open_in_new" className="ml-0.5 align-[-2px] text-[14px]!" />
    </a>
  );
}

export type OfficialLink = { source: string; title: string; href: string; note?: string };
/** "Official documentation" reference box, used at the end of a page. */
export function OfficialDocs({ links, title = "Official documentation" }: { links: OfficialLink[]; title?: string }) {
  return (
    <section className="no-prose my-8 rounded-xl border bg-surface">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Icon name="verified" className="text-primary" />
        <h2 id="official-documentation" className="m-0! font-display text-[18px]! font-medium">{title}</h2>
      </div>
      <ul className="m-0! list-none! divide-y p-0!">
        {links.map((l) => (
          <li key={l.href} className="m-0!">
            <a href={l.href} target="_blank" rel="noreferrer" className="no-prose group flex items-start gap-3 px-4 py-3 hover:bg-surface-variant">
              <span className="mt-0.5 shrink-0 rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">{l.source}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-foreground group-hover:text-primary">{l.title}</span>
                {l.note && <span className="block text-[13px] text-muted-foreground">{l.note}</span>}
                <span className="block truncate font-mono text-[12px] text-muted-foreground">{l.href.replace(/^https:\/\//, "")}</span>
              </span>
              <Icon name="open_in_new" className="mt-0.5 text-[18px] text-muted-foreground group-hover:text-primary" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NextSteps({ cards }: { cards: { icon: string; title: string; desc: string; to: string }[] }) {
  return (<><h2 id="next-steps">Next steps</h2><CardGrid cards={cards} /></>);
}

/** Link to a doc page by slug relative to /docs ("" = intro). */
export function DocLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  if (!to) return <Link to="/docs" className={className}>{children}</Link>;
  return <Link to="/docs/$" params={{ _splat: to }} className={className}>{children}</Link>;
}

/** iOS platform icon: inline Apple logo (uses currentColor, so it follows light/dark text and works on any host). */
export function IosIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" role="img" aria-label="Apple" fill="currentColor" className={cn("inline-block h-5 w-5 shrink-0", className)}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}
