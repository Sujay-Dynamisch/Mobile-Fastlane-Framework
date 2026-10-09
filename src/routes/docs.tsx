import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SideNav } from "@/components/docs/shell";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  return (
    <>
      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[280px] shrink-0 overflow-y-auto border-r bg-surface-variant lg:block">
          <SideNav />
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </>
  );
}
