import { Dashboard } from "@/components/dashboard";
import { Brand } from "@/components/logo-mark";

export default function Home() {
  return (
    <>
      <Dashboard />
      <footer className="wrap foot">
        <Brand />
        <ul>
          <li>
            Weather data by <a href="https://open-meteo.com/">Open-Meteo</a> (CC BY 4.0)
          </li>
          <li>
            <a href="https://github.com/HaralambosARDELEAN/weather-dashboard">Source on GitHub</a>
          </li>
        </ul>
      </footer>
    </>
  );
}
