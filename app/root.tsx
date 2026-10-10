import { useEffect, useState } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/root";
import { Sidebar } from "./components/Sidebar.tsx";
import { SearchPalette } from "./components/SearchPalette.tsx";
import { itemsOf, loadModules } from "./lib/content.server.ts";
import { getProgress, getQuizResults } from "./lib/db.server.ts";
import { pct, type ModuleSummary } from "./lib/stats.ts";
import { getTheme } from "./lib/theme.server.ts";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;700;800&family=Space+Grotesk:wght@400;500;700&display=swap",
  },
];

export const meta: Route.MetaFunction = () => [{ title: "FE Path" }];

export async function loader({ request }: Route.LoaderArgs) {
  const done = getProgress();
  const quiz = getQuizResults();
  const modules: ModuleSummary[] = loadModules().map((mod) => {
    const items = itemsOf(mod);
    const best = quiz[mod.slug]?.best;
    return {
      slug: mod.slug,
      title: mod.title,
      stage: mod.stage,
      total: items.length,
      done: items.filter((i) => done[i.id]).length,
      questions: mod.quiz.length,
      quizBest: best ? pct(best.score, best.total) : null,
    };
  });
  return { modules, doneIds: Object.keys(done), theme: await getTheme(request) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang="en" data-theme={data?.theme || undefined}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "");
      if ((e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="layout">
      <Sidebar modules={loaderData.modules} theme={loaderData.theme} onSearch={() => setSearchOpen(true)} />
      <main id="main">
        <Outlet />
      </main>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} doneIds={loaderData.doneIds} />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong";
  let details = "An unexpected error occurred.";
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Not found" : `Error ${error.status}`;
    details = error.status === 404 ? "There is no page at this address." : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }
  return (
    <main className="error">
      <h1>{message}</h1>
      <p>{details}</p>
    </main>
  );
}
