# Dashboard

Dashboard pessoal — relógio ao vivo (24h), clima ao vivo (Open-Meteo, Aripuanã-MT),
card "Agora na agenda" e 8 links agrupados por categoria. Inclui uma página de
**Agenda** com cronograma pessoal, hábitos e timeline do dia. Layout **Editorial**,
tema claro/escuro (compartilhado entre as telas), responsivo para mobile.

Stack: React 18 + Vite. Roteamento por hash (`#/` dashboard, `#/agenda` agenda) —
sem dependências extras.

## Desenvolvimento

```bash
npm install
npm run dev        # servidor de dev com HMR em http://localhost:5173
```

Outros scripts:

```bash
npm run build      # gera o bundle de produção em dist/
npm run preview    # serve o build localmente
npm run lint       # ESLint
npm run format     # Prettier (escreve)
```

## Docker

Build multi-stage (Vite build → Nginx servindo `dist/`):

```bash
docker build -t dashboard .
docker run --rm -p 8080:80 dashboard
```

Acesse http://localhost:8080.

## Estrutura

```
index.html          # entrada Vite
src/
  main.jsx          # bootstrap React
  App.jsx           # roteamento por hash (dashboard ↔ agenda)
  Dashboard.jsx     # board Editorial + relógio/clima + card de agenda
  Agenda.jsx        # página de agenda (timeline, card "Agora", hábitos)
  schedule.js       # >>> CRONOGRAMA EDITÁVEL <<< (blocos, categorias, hábitos)
  theme.js          # hook de tema compartilhado (localStorage)
  icons.jsx         # ícones: marcas via Simple Icons (`simple-icons`) + UI/clima desenhados à mão
  styles.css        # tokens de tema + dashboard
  agenda.css        # estilos da página de agenda
```

## Configuração

- **NASA:** a página de astronomia (`#/astro`) usa as APIs públicas da NASA
  (APOD + asteroides NeoWs). Por padrão usa `DEMO_KEY` (limite baixo); para uma
  chave própria (api.nasa.gov), defina `VITE_NASA_KEY` no ambiente de build.
  Respostas são cacheadas por dia em `localStorage`.
- **Clima:** ajuste `LAT` / `LON` / `CITY` no topo de `src/Dashboard.jsx`.
- **Links:** array `LINKS` em `src/Dashboard.jsx`.
- **Cronograma / hábitos:** edite `src/schedule.js`. No topo do arquivo estão
  `CATEGORIES` (cores/rótulos), `WEEKDAY` / `SATURDAY` / `SUNDAY` (blocos por
  dia, no formato `{ start, end, title, cat, note? }`), o mapa `WEEK`
  (dia da semana → blocos) e `HABITS` (lista de hábitos diários). Um bloco cujo
  `end` é menor que o `start` cruza a meia-noite (ex.: sono).
