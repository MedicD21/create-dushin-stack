export function renderRouterQueryMainTsx() {
  return `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
`;
}

export function renderRouterQueryMainJsx() {
  return `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
`;
}

export function renderRouterQueryAppTsx() {
  return `import { Link, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

function DashboardHome() {
  const status = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      return Promise.resolve({ status: "ok" as const });
    },
  });

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Dashboard Home</h2>
      <p className="text-sm text-slate-600">Query status: {status.data?.status ?? "loading"}</p>
    </section>
  );
}

function Reports() {
  return (
    <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Reports</h2>
      <p className="text-sm text-slate-600">Drop your chart cards and analytics widgets here.</p>
    </section>
  );
}

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dashboard preset</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vite + Router + Query</h1>
        </header>

        <nav className="flex gap-4 text-sm text-slate-700">
          <Link to="/">Home</Link>
          <Link to="/reports">Reports</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </main>
  );
}
`;
}

export function renderRouterQueryAppJsx() {
  return `import { Link, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

function DashboardHome() {
  const status = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      return Promise.resolve({ status: "ok" });
    },
  });

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Dashboard Home</h2>
      <p className="text-sm text-slate-600">Query status: {status.data?.status ?? "loading"}</p>
    </section>
  );
}

function Reports() {
  return (
    <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Reports</h2>
      <p className="text-sm text-slate-600">Drop your chart cards and analytics widgets here.</p>
    </section>
  );
}

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dashboard preset</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vite + Router + Query</h1>
        </header>

        <nav className="flex gap-4 text-sm text-slate-700">
          <Link to="/">Home</Link>
          <Link to="/reports">Reports</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </main>
  );
}
`;
}
