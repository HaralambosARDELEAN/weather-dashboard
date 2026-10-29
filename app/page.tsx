import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight sm:text-7xl">
          Weather in four places
        </h1>
        <p className="mt-3 text-lg text-slate">
          Pick four places to see their weather right now, then turn it into one picture.
        </p>
      </header>
      <Dashboard />
      <footer className="mt-16 border-t border-mist pt-6 text-sm text-slate">
        Weather data by{" "}
        <a href="https://open-meteo.com/" className="underline underline-offset-4 hover:text-ink">
          Open-Meteo
        </a>{" "}
        (CC BY 4.0). Pictures by an OpenAI image model.
      </footer>
    </main>
  );
}
