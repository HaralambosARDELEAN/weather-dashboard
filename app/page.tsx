import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight sm:text-6xl">
          Weather in four places
        </h1>
        <p className="mt-3 text-lg text-slate">
          Pick four places to see their weather right now, then turn it into one picture.
        </p>
      </header>
      <Dashboard />
    </main>
  );
}
