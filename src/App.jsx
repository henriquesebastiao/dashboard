import { useState, useEffect } from "react";
import Dashboard from "./Dashboard.jsx";
import Agenda from "./Agenda.jsx";
import Astro from "./Astro.jsx";

/* Hash routing — no dependency, works with nginx static serving.
   "#/agenda" → agenda, "#/astro" → astronomia, anything else → dashboard. */
function useHashRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, "");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export default function App() {
  const route = useHashRoute();
  if (route === "agenda") return <Agenda />;
  if (route === "astro") return <Astro />;
  return <Dashboard />;
}
