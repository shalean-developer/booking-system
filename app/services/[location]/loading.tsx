import { Header } from "@/components/header";

export default function ServiceLocationLoading() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mb-8 h-12 max-w-2xl animate-pulse rounded-lg bg-slate-200" />
        <div className="mb-4 h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="mb-4 h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="mb-8 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="aspect-[21/9] w-full animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
