import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./ui";

/*
 * Static "screenshots" of what the framework sends and of the vendor UIs used to
 * set it up. Field names, titles and log lines mirror fastlane/lib/notification_helper.rb
 * and email_notifier.rb. They are drawn in light colours, like real screenshots.
 */

/** App window frame with a caption, used around every mock screenshot. */
export function Screenshot({ app, caption, children, className }: { app: string; caption?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <figure className="no-prose my-6">
      <div className={cn("overflow-hidden rounded-xl border border-slate-300 bg-[#f5f5f5] text-[#242424] shadow-card", className)}>
        <div className="flex items-center gap-2 border-b border-slate-300 bg-[#ebebeb] px-3 py-1.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="flex-1 truncate text-center text-[12px] text-slate-500">{app}</span>
        </div>
        <div className="p-3 sm:p-4">{children}</div>
      </div>
      {caption && <figcaption className="mt-2 text-center text-[13px] text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

/* ------------------------------ Microsoft Teams ------------------------------ */

type Fact = [string, string];
type CardStatus = "SUCCESS" | "FAILED" | "PASSED";
const statusLook: Record<CardStatus, { icon: string; header: string; text: string; btn: string }> = {
  SUCCESS: { icon: "🚀", header: "bg-[#e7f4e4] border-[#92c353]", text: "text-[#237b4b]", btn: "bg-[#5b5fc7]" },
  PASSED: { icon: "✅", header: "bg-[#e7f4e4] border-[#92c353]", text: "text-[#237b4b]", btn: "bg-[#5b5fc7]" },
  FAILED: { icon: "❌", header: "bg-[#fdf3f4] border-[#c4314b]", text: "text-[#c4314b]", btn: "bg-[#5b5fc7]" },
};

function TeamsPost({ time, children }: { time: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#5b5fc7] text-white"><Icon name="account_tree" className="text-[18px]" /></div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2 text-[13px]">
          <span className="font-semibold">Fastlane</span>
          <span className="text-slate-500">via Workflows</span>
          <span className="text-slate-500">{time}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Adaptive Card exactly as notification_helper.rb#teams_card lays it out. */
export function TeamsCard({ title, subtitle, status, facts, children, actions = [], time = "16:08" }: {
  title: string; subtitle: string; status: CardStatus; facts: Fact[]; children?: ReactNode; actions?: string[]; time?: string;
}) {
  const look = statusLook[status];
  return (
    <TeamsPost time={time}>
      <div className="max-w-[520px] overflow-hidden rounded-md border border-slate-200 bg-white text-[13px] shadow-sm">
        <div className={cn("flex items-start justify-between gap-3 border-l-4 px-4 py-3", look.header)}>
          <div className="min-w-0">
            <div className="text-[11px] font-bold tracking-wide text-slate-500">FASTLANE · CI/CD</div>
            <div className="text-[18px] font-bold leading-tight">{title}</div>
            <div className="text-slate-500">{subtitle}</div>
          </div>
          <div className={cn("shrink-0 whitespace-nowrap pt-4 text-[15px] font-bold", look.text)}>{look.icon} {status}</div>
        </div>
        <div className="space-y-3 px-4 py-3">
          {children}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {facts.map(([k, v]) => (
              <div key={k} className="contents"><dt className="font-semibold">{k}</dt><dd className="break-all">{v}</dd></div>
            ))}
          </dl>
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {actions.map((a) => <span key={a} className="rounded border border-slate-300 px-3 py-1.5 font-semibold text-[#5b5fc7]">{a}</span>)}
            </div>
          )}
          <div className="text-[11px] text-slate-500">Sent by Fastlane · 07 Oct 2026, {time} IST</div>
        </div>
      </div>
    </TeamsPost>
  );
}

const buildFacts = (env: string, artifact: string): Fact[] => [
  ["Platform", "Android"], ["Environment", env], ["Version", "1.4.0"], ["Build", "57"],
  ["Artifact", artifact], ["Branch", "main"], ["Commit", "c72edba"], ["Triggered By", "sujay-k"],
];

export function TeamsSuccessCard() {
  return (
    <TeamsCard title="Build Distributed" subtitle="MyApp · Android · STAGING" status="SUCCESS"
      facts={buildFacts("STAGING", "MyApp-staging-v1.4.0-57.apk")} actions={["Open Release", "View CI Run"]} time="14:07" />
  );
}

export function TeamsFailureCard() {
  return (
    <TeamsCard title="Distribution Failed" subtitle="MyApp · Android · DEVELOPMENT" status="FAILED"
      facts={[["Platform", "Android"], ["Environment", "DEVELOPMENT"], ["Finished", "07 Oct 2026, 16:08 IST"]]} actions={["View CI Run"]} time="16:08">
      <div className="rounded border-l-4 border-[#c4314b] bg-[#fdf3f4] px-3 py-2">
        <div className="font-bold text-[#c4314b]">Error</div>
        <div className="font-mono text-[12px]">Invalid request</div>
      </div>
    </TeamsCard>
  );
}

export function TeamsTestReportCard() {
  const Stat = ({ v, k, cls }: { v: string; k: string; cls?: string }) => (
    <div className="rounded bg-slate-50 py-2 text-center"><div className={cn("text-[22px] font-bold", cls)}>{v}</div><div className="text-[11px] text-slate-500">{k}</div></div>
  );
  return (
    <TeamsCard title="App Testing Agent Report" subtitle="MyApp · Android · STAGING" status="PASSED"
      facts={buildFacts("STAGING", "MyApp-staging-v1.4.0-57.apk")} actions={["View Firebase Results", "View CI Run"]} time="14:10">
      <div className="grid grid-cols-4 gap-2">
        <Stat v="3" k="Total" /><Stat v="3" k="Passed" cls="text-[#237b4b]" /><Stat v="0" k="Failed" /><Stat v="3m 12s" k="Duration" />
      </div>
      <div>
        <div className="mb-1 text-[14px] font-bold">Test cases</div>
        <div className="font-mono text-[12px]">✅  login-flow<br />✅  first-test-case</div>
      </div>
      <div>
        <div className="mb-1 text-[14px] font-bold">Test Devices (2)</div>
        {[["Galaxy A54", "a54x", "Android 14", "portrait · landscape · en"], ["Pixel 9", "tokay", "Android 16", "portrait · en"]].map(([n, m, v, o]) => (
          <div key={m} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
            <div>📱 <b>{n}</b><div className="text-[11px] text-slate-500">{m}</div></div>
            <div className="text-right"><div className="font-bold text-[#5b5fc7]">{v}</div><div className="text-[11px] text-slate-500">{o}</div></div>
          </div>
        ))}
      </div>
    </TeamsCard>
  );
}

/* ------------------------------ Real screenshots ------------------------------ */

/** A real screenshot from public/images (already redacted and annotated). Click opens it full size. */
export function ImageShot({ src, alt, caption, width }: { src: string; alt: string; caption?: ReactNode; width?: number }) {
  return (
    <figure className="no-prose my-5">
      <a href={src} target="_blank" rel="noreferrer" className="no-prose block overflow-hidden rounded-xl border bg-white shadow-card" style={width ? { maxWidth: width } : undefined} title="Open full size">
        <img src={src} alt={alt} loading="lazy" className="block h-auto w-full" />
      </a>
      {caption && <figcaption className="mt-2 text-[13px] text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

/* ------------------------------- E-mail report ------------------------------- */

/** The HTML e-mail built by email_notifier.rb#build_html_body. */
export function EmailReportShot({ passed = true }: { passed?: boolean }) {
  const color = passed ? "#059669" : "#dc2626";
  const status = passed ? "PASSED" : "FAILED";
  const rows: Fact[] = [
    ["Project Name", "MyApp"], ["Environment", "STAGING"], ["Build Number", "57"], ["Execution Status", status],
    ["Test Duration", "3m 12s"], ["Failed Test Names/IDs", passed ? "None" : "login-flow"], ["Failed Devices", passed ? "None" : "a54x (API 34)"], ["Timestamp", "07 Oct 2026, 14:10 IST"],
  ];
  return (
    <div className="text-[13px]">
      <div className="mb-3 space-y-0.5 border-b border-slate-200 pb-2">
        <div className="text-[15px] font-semibold">[{status}] Firebase App Testing Agent: MyApp (STAGING) - Build 57</div>
        <div className="text-slate-500"><b className="text-[#242424]">From</b> Fastlane CI &lt;ci@example.com&gt; · <b className="text-[#242424]">To</b> qa-team@example.com</div>
      </div>
      <div className="mx-auto max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="px-5 py-4 text-white" style={{ background: color }}>
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">{passed ? "All Tests Passed" : "Tests Failed"}</span>
          <div className="mt-2 text-[18px] font-bold">Firebase App Testing Agent Report</div>
        </div>
        <div className="space-y-3 p-5">
          <div className="grid grid-cols-3 gap-2">
            {[["3", "Total Tests", "#0f172a"], [passed ? "3" : "2", "Passed", "#059669"], [passed ? "0" : "1", "Failed", passed ? "#64748b" : "#dc2626"]].map(([v, k, c]) => (
              <div key={k} className="rounded-lg border border-slate-200 bg-slate-50 py-2 text-center"><div className="text-[22px] font-bold" style={{ color: c }}>{v}</div><div className="text-[11px] text-slate-500">{k}</div></div>
            ))}
          </div>
          {!passed && <div className="rounded border-l-4 border-[#ef4444] bg-[#fef2f2] px-3 py-2 text-[#991b1b]"><b>Failure Reason:</b> Step 3 "Open patient list" did not reach the expected screen.</div>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {rows.map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="font-medium" style={k === "Execution Status" ? { color } : undefined}>{v}</dd></div>
            ))}
          </dl>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <b>Executed Test Case IDs:</b>
            <ul className="my-1 list-disc pl-5 font-mono text-[12px]"><li>login-flow</li><li>first-test-case</li></ul>
            <b>Test Devices:</b> <code className="rounded bg-slate-200 px-1 text-[11px]">model=a54x,version=34,…</code>
          </div>
          <span className="inline-block rounded-md px-4 py-2 font-semibold text-white" style={{ background: color }}>View Firebase Test Results</span>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-center text-[11px] text-slate-500">Automated test report generated by Fastlane Firebase App Testing Agent integration.</div>
      </div>
    </div>
  );
}

/* ----------------------------------- Slack ----------------------------------- */

export function SlackMessageShot() {
  return (
    <div className="flex gap-3 rounded-md bg-white p-3 text-[14px]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#4a154b] text-white"><Icon name="rocket_launch" className="text-[18px]" /></div>
      <div>
        <div className="flex items-baseline gap-2"><b>Fastlane</b><span className="rounded bg-slate-200 px-1 text-[10px] font-semibold text-slate-600">APP</span><span className="text-[12px] text-slate-500">2:07 PM</span></div>
        <pre className="m-0 whitespace-pre-wrap font-sans">{`[INFO] Mobile build distributed

Project: MyApp
Platform: Android
Environment: staging
Version: 1.4.0
Build: 57
Artifact: MyApp-staging-v1.4.0-57.apk
Release: https://appdistribution.firebase.google.com/testerapps/…`}</pre>
      </div>
    </div>
  );
}
