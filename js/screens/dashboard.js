import { esc } from "../ui.js";
import { icon } from "../icons.js";
import { CHARACTERS } from "../characters.js";
import { getEnemy } from "../enemies.js";
import {
  getPlayerId,
  getPlayerName,
  renamePlayer,
  fetchStats,
  fetchRanking,
  deleteMyData,
  flushQueue,
} from "../records.js";

const HEROES = Object.keys(CHARACTERS);

function heroName(id) {
  return (CHARACTERS[id] && CHARACTERS[id].name) || id;
}

function enemyName(id) {
  if (!id) return "—";
  try {
    return getEnemy(id).name;
  } catch {
    return id;
  }
}

function fmtDuration(ms) {
  if (!ms) return "—";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "menos de 1 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

function fmtDate(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function kpi(label, value, ic) {
  return `<div class="dash-kpi"><span class="dash-kpi-ic">${icon(ic)}</span><span class="dash-kpi-val">${esc(value)}</span><span class="dash-kpi-label">${esc(label)}</span></div>`;
}

function renderProfile(player, name) {
  return `
    <div class="dash-section">
      <h3>${icon("hand")} Mi perfil</h3>
      <div class="dash-profile">
        <label class="dash-field">
          <span>Nombre de perfil (aparece en el ranking)</span>
          <input type="text" id="dash-name" maxlength="24" value="${esc(name)}" placeholder="${esc(name || "Sin nombre")}" />
        </label>
        <div class="dash-row">
          <button class="btn small" data-action="save-name">${icon("save")} Guardar nombre</button>
          <button class="btn small ghost danger" data-action="delete-data">${icon("trash")} Borrar mis datos</button>
        </div>
        <p class="muted dash-id">ID: ${esc((player && player.id) || "—")}</p>
      </div>
    </div>`;
}

function renderAggregates(a) {
  const wr = a.runs ? `${a.winRate}%` : "—";
  return `
    <div class="dash-section">
      <h3>${icon("chart")} Resumen</h3>
      <div class="dash-kpis">
        ${kpi("Partidas", a.runs || 0, "cards")}
        ${kpi("Victorias", a.wins || 0, "trophy")}
        ${kpi("Derrotas", a.losses || 0, "skull")}
        ${kpi("% victoria", wr, "target")}
        ${kpi("Mejor score", a.bestScore || 0, "star")}
        ${kpi("Monedas ganadas", a.totalCoins || 0, "coin")}
        ${kpi("Enemigos derrotados", a.totalKills || 0, "sword")}
        ${kpi("Tiempo jugado", fmtDuration(a.totalPlayMs), "hourglass")}
        ${kpi("Máxima ascensión", `★${(a.maxAscension || 0) + 1}`, "crown")}
        ${kpi("Máximo nivel", a.maxLevel || 1, "bolt")}
      </div>
    </div>`;
}

function renderByHero(list) {
  const rows = list.length
    ? list
        .map((h) => {
          const wr = h.runs ? `${Math.round((h.wins / h.runs) * 100)}%` : "—";
          return `<tr>
            <td>${esc(heroName(h.heroId))}</td>
            <td>${h.runs}</td>
            <td>${h.wins}</td>
            <td>${esc(wr)}</td>
            <td>${h.bestScore}</td>
            <td>★${h.maxAscension + 1}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" class="muted">Sin partidas todavía.</td></tr>`;
  return `
    <div class="dash-section">
      <h3>${icon("swords")} Por héroe</h3>
      <div class="dash-table-wrap"><table class="dash-table">
        <thead><tr><th>Héroe</th><th>Partidas</th><th>Victorias</th><th>% victoria</th><th>Mejor score</th><th>Máx. senda</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function renderByEnemy(list) {
  const rows = list.length
    ? list
        .map((e) => {
          const total = e.defeats + e.deaths;
          const pct = total ? Math.round((e.defeats / total) * 100) : 0;
          return `<div class="dash-enemy-row">
            <span class="dash-enemy-name">${esc(enemyName(e.enemyId))}</span>
            <span class="dash-bar"><span class="dash-bar-fill" style="width:${pct}%"></span></span>
            <span class="dash-enemy-stats">${e.defeats} derrotado${e.defeats === 1 ? "" : "s"} · ${e.deaths} derrota${e.deaths === 1 ? "" : "s"}</span>
          </div>`;
        })
        .join("")
    : `<p class="muted">Sin combates registrados.</p>`;
  return `
    <div class="dash-section">
      <h3>${icon("skull")} Por enemigo</h3>
      ${rows}
    </div>`;
}

function renderMorality(m) {
  const items = [
    ["mercy", "🕊️", "Merced"],
    ["greed", "🪙", "Codicia"],
    ["honor", "⚖️", "Honor"],
    ["corruption", "🖤", "Corrupción"],
  ];
  return `
    <div class="dash-section">
      <h3>${icon("scales")} Moralidad acumulada</h3>
      <div class="dash-morality">${items
        .map(([k, ic, label]) => `<span class="chip">${ic} ${m[k] || 0} ${label}</span>`)
        .join("")}</div>
    </div>`;
}

function renderHistory(runs) {
  const rows = runs.length
    ? runs
        .map((r) => {
          const res = r.result === "victory" ? `<span class="dash-win">Victoria</span>` : `<span class="dash-loss">Derrota</span>`;
          return `<tr>
            <td>${esc(fmtDate(r.createdAt))}</td>
            <td>${esc(heroName(r.heroId))}</td>
            <td>${esc(r.heroName || "—")}</td>
            <td>Nv ${r.level}</td>
            <td>★${r.ascension + 1}</td>
            <td>${r.coins}</td>
            <td>${r.score}</td>
            <td>${res}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" class="muted">Aún no hay partidas registradas.</td></tr>`;
  return `
    <div class="dash-section">
      <h3>${icon("scroll")} Historial de partidas</h3>
      <div class="dash-table-wrap"><table class="dash-table">
        <thead><tr><th>Fecha</th><th>Héroe</th><th>Nombre</th><th>Nivel</th><th>Senda</th><th>Monedas</th><th>Score</th><th>Resultado</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function renderRanking(ranking, heroFilter) {
  const options = ["all", ...HEROES]
    .map((h) => `<option value="${h}"${h === heroFilter ? " selected" : ""}>${h === "all" ? "Todos los héroes" : esc(heroName(h))}</option>`)
    .join("");
  const rows = ranking.length
    ? ranking
        .map((p, i) => {
          const lr = p.lastRun || {};
          const res = lr.result === "victory" ? `<span class="dash-win">Victoria</span>` : `<span class="dash-loss">Derrota</span>`;
          const last = lr.heroId
            ? `${esc(heroName(lr.heroId))} · Nv ${lr.level} · ★${lr.ascension + 1} · ${res}`
            : "—";
          return `<tr>
            <td>${i + 1}</td>
            <td>${esc(p.playerName || "Jugador")}</td>
            <td>${p.runs}</td>
            <td>${p.wins}</td>
            <td>${p.winRate}%</td>
            <td>${p.bestScore}</td>
            <td>${last}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" class="muted">Sin resultados aún.</td></tr>`;
  return `
    <div class="dash-section">
      <div class="dash-section-head">
        <h3>${icon("trophy")} Ranking</h3>
        <select id="dash-hero-filter" class="dash-select">${options}</select>
      </div>
      <div class="dash-table-wrap"><table class="dash-table">
        <thead><tr><th>#</th><th>Jugador</th><th>Partidas</th><th>Victorias</th><th>% victoria</th><th>Mejor score</th><th>Última senda</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function renderError(message) {
  return `<div class="dash-section"><p class="dash-error">${esc(message)}</p></div>`;
}

export function dashboard(ctx) {
  const html = `
  <section class="screen dashboard">
    <div class="dash-head">
      <h2>${icon("chart")} Cuadro de mando</h2>
      <button class="btn small" data-action="refresh">${icon("target")} Refrescar</button>
    </div>
    <div class="dash-body" data-dash-body>
      <p class="muted">Cargando estadísticas…</p>
    </div>
    <button class="btn" data-action="back">${icon("arrowLeft")} Volver</button>
  </section>`;

  function bind(root) {
    const body = root.querySelector("[data-dash-body]");

    function load() {
      flushQueue();
      const name = getPlayerName();
      fetchStats()
        .then((stats) => {
          const heroFilter = root.querySelector("#dash-hero-filter") ? root.querySelector("#dash-hero-filter").value : "all";
          body.innerHTML =
            renderProfile(stats.player, name) +
            renderAggregates(stats.aggregates) +
            renderByHero(stats.byHero) +
            renderByEnemy(stats.byEnemy) +
            renderMorality(stats.morality) +
            renderHistory(stats.recentRuns);
          return fetchRanking(heroFilter).then((res) => {
            body.innerHTML += renderRanking(res.ranking || [], heroFilter);
            bindControls(root, body, name);
          });
        })
        .catch((err) => {
          body.innerHTML = renderError("Sin conexión con el servidor de estadísticas. Tus partidas quedan guardadas localmente y se sincronizarán cuando vuelva a haber conexión.") +
            renderRanking([], "all");
          bindControls(root, body, name);
        });
    }

    root.querySelector('[data-action="back"]').onclick = () => ctx.go("menu");
    root.querySelector('[data-action="refresh"]').onclick = () => load();
    load();
  }

  function bindControls(root, body, name) {
    const saveBtn = body.querySelector('[data-action="save-name"]');
    if (saveBtn) {
      saveBtn.onclick = () => {
        const input = body.querySelector("#dash-name");
        const value = (input ? input.value : name).trim().slice(0, 24);
        renamePlayer(value).finally(() => ctx.go("dashboard"));
      };
    }
    const delBtn = body.querySelector('[data-action="delete-data"]');
    if (delBtn) {
      delBtn.onclick = () => {
        if (!window.confirm("¿Borrar todos tus datos de estadísticas? Esta acción no se puede deshacer.")) return;
        deleteMyData().then(() => ctx.go("dashboard")).catch(() => ctx.go("dashboard"));
      };
    }
    const filter = body.querySelector("#dash-hero-filter");
    if (filter) {
      filter.onchange = () => {
        fetchRanking(filter.value)
          .then((res) => {
            const ranking = body.querySelector(".dash-section:last-child");
            if (ranking) ranking.outerHTML = renderRanking(res.ranking || [], filter.value);
            bindControls(root, body, name);
          })
          .catch(() => {});
      };
    }
  }

  return { html, bind };
}
