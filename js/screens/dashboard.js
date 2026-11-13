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

function mineBadge() {
  return `<span class="dash-badge-mine">tú</span>`;
}

function renderProfile(player, name, mine) {
  const my = mine || {};
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
        <div class="dash-mine-box">
          <span class="dash-mine-label">${mineBadge()} Tu contribución</span>
          <span>${my.runs || 0} partidas · ${my.wins || 0} victorias · ${my.winRate || 0}% · mejor ${my.bestScore || 0}</span>
        </div>
      </div>
    </div>`;
}

function renderAggregates(a) {
  const wr = a.runs ? `${a.winRate}%` : "—";
  return `
    <div class="dash-section">
      <h3>${icon("chart")} Resumen global</h3>
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
          const mine = h.myRuns
            ? `${h.myRuns} partidas · ${h.myWins} victorias · mejor ${h.myBestScore}`
            : "—";
          return `<tr>
            <td>${esc(heroName(h.heroId))}</td>
            <td>${h.runs} partidas · ${h.wins} victorias · ${esc(wr)} · mejor ${h.bestScore}</td>
            <td class="${h.myRuns ? "dash-mine" : "muted"}">${mine}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="3" class="muted">Sin partidas todavía.</td></tr>`;
  return `
    <div class="dash-section">
      <h3>${icon("swords")} Por héroe</h3>
      <div class="dash-table-wrap"><table class="dash-table">
        <thead><tr><th>Héroe</th><th>Global</th><th>Tú</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function renderByEnemy(list) {
  const rows = list.length
    ? list
        .map((e) => {
          const hasMine = e.myDefeats || e.myDeaths;
          const mine = hasMine ? `${e.myDefeats} derrotas · ${e.myDeaths} muertes` : "—";
          return `<tr>
            <td>${esc(enemyName(e.enemyId))}</td>
            <td>${e.defeats} derrotas · ${e.deaths} muertes</td>
            <td class="${hasMine ? "dash-mine" : "muted"}">${mine}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="3" class="muted">Sin combates registrados.</td></tr>`;
  return `
    <div class="dash-section">
      <h3>${icon("skull")} Por enemigo</h3>
      <div class="dash-table-wrap"><table class="dash-table">
        <thead><tr><th>Enemigo</th><th>Global</th><th>Tú</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function renderMorality(m, myM) {
  const items = [
    ["mercy", "🕊️", "Merced"],
    ["greed", "🪙", "Codicia"],
    ["honor", "⚖️", "Honor"],
    ["corruption", "🖤", "Corrupción"],
  ];
  const line = (obj) => items.map(([k, ic, label]) => `<span class="chip">${ic} ${obj[k] || 0} ${label}</span>`).join("");
  return `
    <div class="dash-section">
      <h3>${icon("scales")} Moralidad acumulada</h3>
      <div class="dash-vs-row"><span class="dash-vs-label">Global</span><div class="dash-morality">${line(m)}</div></div>
      <div class="dash-vs-row"><span class="dash-vs-label">${mineBadge()}</span><div class="dash-morality">${line(myM)}</div></div>
    </div>`;
}

function renderHistory(runs) {
  const rows = runs.length
    ? runs
        .map((r) => {
          const res = r.result === "victory" ? `<span class="dash-win">Victoria</span>` : `<span class="dash-loss">Derrota</span>`;
          const badge = r.isMine ? ` ${mineBadge()}` : "";
          return `<tr class="${r.isMine ? "dash-mine" : ""}">
            <td>${esc(fmtDate(r.createdAt))}</td>
            <td>${esc(r.playerName || "Jugador")}${badge}</td>
            <td>${esc(heroName(r.heroId))}</td>
            <td>Nv ${r.level}</td>
            <td>★${r.ascension + 1}</td>
            <td>${r.score}</td>
            <td>${res}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" class="muted">Aún no hay partidas registradas.</td></tr>`;
  return `
    <div class="dash-section">
      <h3>${icon("scroll")} Historial de partidas</h3>
      <div class="dash-table-wrap"><table class="dash-table">
        <thead><tr><th>Fecha</th><th>Jugador</th><th>Héroe</th><th>Nivel</th><th>Senda</th><th>Score</th><th>Resultado</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function renderRanking(ranking, heroFilter, currentPlayerId) {
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
          const mine = currentPlayerId && p.playerId === currentPlayerId;
          const badge = mine ? ` ${mineBadge()}` : "";
          return `<tr class="${mine ? "dash-mine" : ""}">
            <td>${i + 1}</td>
            <td>${esc(p.playerName || "Jugador")}${badge}</td>
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
      <h2>${icon("chart")} Estadísticas</h2>
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
      const playerId = getPlayerId();
      fetchStats()
        .then((stats) => {
          const heroFilter = root.querySelector("#dash-hero-filter") ? root.querySelector("#dash-hero-filter").value : "all";
          body.innerHTML =
            renderProfile(stats.player, name, stats.mine) +
            renderAggregates(stats.aggregates) +
            renderByHero(stats.byHero) +
            renderByEnemy(stats.byEnemy) +
            renderMorality(stats.morality, stats.myMorality) +
            renderHistory(stats.recentRuns);
          return fetchRanking(heroFilter).then((res) => {
            body.innerHTML += renderRanking(res.ranking || [], heroFilter, playerId);
            bindControls(root, body, name);
          });
        })
        .catch(() => {
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
            if (ranking) ranking.outerHTML = renderRanking(res.ranking || [], filter.value, getPlayerId());
            bindControls(root, body, name);
          })
          .catch(() => {});
      };
    }
  }

  return { html, bind };
}
