/* Embedded backend.
   Serves the React build from /dist and exposes /api/containers/status,
   which inspects every container via the host Docker socket and returns
   a small JSON map keyed by container name. */

import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import Docker from "dockerode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const app = express();
app.disable("x-powered-by");

const TTL_MS = 2000;
let cache = { ts: 0, data: null };

function pickIp(networks) {
  if (!networks) return null;
  for (const n of Object.values(networks)) {
    if (n && n.IPAddress) return n.IPAddress;
  }
  return null;
}

async function collectStatus() {
  const list = await docker.listContainers({ all: true });
  const now = Date.now();
  const out = {};
  await Promise.all(
    list.map(async (c) => {
      const name = (c.Names && c.Names[0] ? c.Names[0] : "").replace(/^\//, "");
      if (!name) return;
      try {
        const insp = await docker.getContainer(c.Id).inspect();
        const state = insp.State || {};
        const started = state.StartedAt && state.StartedAt !== "0001-01-01T00:00:00Z" ? state.StartedAt : null;
        const startedMs = started ? Date.parse(started) : null;
        out[name] = {
          id: c.Id.slice(0, 12),
          running: !!state.Running,
          status: state.Status || null,
          startedAt: started,
          uptimeSeconds: startedMs ? Math.max(0, Math.floor((now - startedMs) / 1000)) : null,
          health: state.Health && state.Health.Status ? state.Health.Status : null,
          ip: pickIp(insp.NetworkSettings && insp.NetworkSettings.Networks),
          image: c.Image || null,
        };
      } catch {
        out[name] = { running: false, status: "unknown" };
      }
    })
  );
  return out;
}

app.get("/api/containers/status", async (_req, res) => {
  const now = Date.now();
  if (cache.data && now - cache.ts < TTL_MS) {
    return res.json(cache.data);
  }
  try {
    const data = await collectStatus();
    cache = { ts: now, data };
    res.set("Cache-Control", "no-store");
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "docker_unreachable", message: String(err.message || err) });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const distDir = path.resolve(__dirname, "..", "dist");

app.use(
  express.static(distDir, {
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

const PORT = Number(process.env.PORT) || 80;
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`[dashboard] listening on http://${HOST}:${PORT}`);
});
