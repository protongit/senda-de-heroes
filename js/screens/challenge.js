import { resolveCard } from "../cards.js";
import { lootSlotHTML, miniCardHTML, esc } from "../ui.js";
import { diffChallengeState } from "../run.js";
import { revealItems } from "../fx.js";

const MORALITY_LABEL = {
  mercy: { icon: "🕊️", label: "merced" },
  greed: { icon: "🪙", label: "codicia" },
  honor: { icon: "⚖️", label: "honor" },
  corruption: { icon: "🖤", label: "corrupción" },
};

function paragraphs(list) {
  return (list || []).map((p) => `<p class="challenge-text">${esc(p)}</p>`).join("");
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function changeChip(icon, value, suffix, cls = "") {
  if (!value) return "";
  return `<span class="chip ${cls}">${icon} ${signed(value)}${suffix}</span>`;
}

function summaryHTML(run, snapshot) {
  const summary = diffChallengeState(run, snapshot);
  if (!summary) return "";
  const chips = [
    changeChip("🪙", summary.coins, ""),
    changeChip("✨", summary.xp, " XP"),
    changeChip("❤️", summary.hp, ""),
    changeChip("❤️ máx", summary.maxHp, ""),
  ];
  for (const [key, value] of Object.entries(summary.morality)) {
    const meta = MORALITY_LABEL[key] || { icon: "◆", label: key };
    chips.push(changeChip(meta.icon, value, ` ${meta.label}`));
  }
  const gains = summary.gained.map((inst, i) => lootSlotHTML(resolveCard(inst), i)).join("");
  const losses = summary.lost.map((inst) => miniCardHTML(resolveCard(inst))).join("");
  const upgrades = summary.upgraded.map((inst) => miniCardHTML(resolveCard(inst))).join("");
  const hasChanges = chips.length || summary.gained.length || summary.lost.length || summary.upgraded.length;
  return `<div class="challenge-rewards">
    <h3>Balance del desafío</h3>
    ${hasChanges ? `<div class="challenge-changes">${chips.join("")}</div>` : `<p class="muted">Sin cambios en tus recursos.</p>`}
    ${gains ? `<div class="challenge-reward-block"><h4>Cartas ganadas</h4><div class="drops">${gains}</div></div>` : ""}
    ${losses ? `<div class="challenge-reward-block losses"><h4>Cartas perdidas</h4><div class="drops">${losses}</div></div>` : ""}
    ${upgrades ? `<div class="challenge-reward-block"><h4>Cartas mejoradas</h4><div class="drops">${upgrades}</div></div>` : ""}
    ${summary.levels > 0 ? `<p class="levelup">¡Subiste al nivel ${run.level}! Elegirás ${run.pendingLevels === 1 ? "una ventaja" : `${run.pendingLevels} ventajas`} al continuar.</p>` : ""}
    <p class="muted">Vida restante: ${run.hp}/${run.maxHp}</p>
  </div>`;
}

function resultLabel(result) {
  if (result === "triumph") return "Triunfo";
  if (result === "win") return "Victoria";
  if (result === "loss") return "Derrota";
  return "Desenlace";
}

function puzzleHTML(node) {
  const puzzle = node.puzzle;
  if (!puzzle) return `<p class="muted">El enigma se ha desvanecido.</p>`;
  const options = puzzle.options
    .map((opt) => `<button class="btn challenge-option" data-option-id="${esc(opt.id)}">${opt.icon || "✦"} ${esc(opt.label)}</button>`)
    .join("");
  const sequence = puzzle.mode === "sequence";
  let body = `<p class="challenge-prompt">${esc(puzzle.prompt)}</p>`;
  if (sequence) {
    body += `<div class="challenge-sequence" data-sequence>${puzzle.answer.map((id) => {
      const opt = puzzle.options.find((o) => o.id === id);
      return `<span class="challenge-rune">${opt ? opt.icon : "✦"}</span>`;
    }).join("")}</div>
    <button class="btn primary" data-memorize>Memorizar y continuar</button>
    <div class="challenge-puzzle hidden" data-puzzle-body>`;
  } else {
    body += `<div class="challenge-puzzle">`;
  }
  body += `<div class="challenge-options">${options}</div>`;
  if (sequence || puzzle.mode === "pair") {
    body += `<p class="challenge-selected" data-selected>Selecciona ${puzzle.mode === "pair" ? "dos" : "la secuencia"} y confirma.</p>
      <button class="btn primary" data-confirm>Confirmar</button>`;
  }
  body += `</div>`;
  return body;
}

function choicesHTML(node) {
  const choices = node.trial.choices || [];
  return `<div class="challenge-choices">${choices
    .map((c) => `<button class="challenge-choice" data-choice-id="${esc(c.id)}">
      <strong>${esc(c.label)}</strong>
      <span class="muted">${esc(c.outcome || "")}</span>
    </button>`)
    .join("")}</div>`;
}

function moralHTML(node) {
  const moral = node.moral;
  if (!moral) return "";
  return `<div class="challenge-moral">
    <h3>${esc(moral.prompt)}</h3>
    <div class="challenge-choices">${moral.options
      .map((c) => `<button class="challenge-choice" data-moral-id="${esc(c.id)}">
        <strong>${esc(c.label)}</strong>
      </button>`)
      .join("")}</div>
  </div>`;
}

export function challenge(ctx) {
  const { G } = ctx;
  const node = G.challenge;
  if (!node) return { html: "", bind() {} };
  const phase = G.challengePhase || "intro";
  const intro = paragraphs(node.intro);
  let body = "";
  let title = node.title;

  if (phase === "intro") {
    body = `${intro}<div class="challenge-actions">
      <button class="btn primary" data-action="begin">Aceptar el desafío</button>
      <button class="btn" data-action="reject">Rechazar y volver a la senda</button>
    </div>`;
  } else if (phase === "moral") {
    body = `${intro}${moralHTML(node)}`;
  } else if (phase === "puzzle") {
    body = `${intro}${puzzleHTML(node)}`;
  } else if (phase === "choice") {
    body = `${intro}${choicesHTML(node)}`;
  } else {
    title = resultLabel(G.challengeResult);
    body = `<p class="challenge-result ${G.challengeResult}">${esc(G.challengeOutcomeText || "")}</p>
      ${summaryHTML(G.run, G.challengeStart)}
      <button class="btn primary" data-action="continue">${G.run.finished ? "Aceptar destino" : "Volver a la senda"}</button>`;
  }

  const html = `
  <section class="screen challenge-screen style-${esc(node.kind)}">
    <header class="hud">
      <span>${node.icon || "🎯"} ${esc(node.kind === "hunt" ? "Cacería" : node.kind === "puzzle" ? "Enigma" : node.kind === "risk" ? "Pacto" : "Prueba")}</span>
      <span>${esc(node.style || "")}</span>
      <span>${esc(G.run.heroDef.icon)} ${esc(G.run.heroDef.name)} · Nv ${G.run.level}</span>
      <span>❤️ ${G.run.hp}/${G.run.maxHp}</span>
    </header>
    <h2>${esc(title)}</h2>
    ${body}
  </section>`;
  return {
    html,
    bind(root) {
      revealItems(root);
      const begin = root.querySelector('[data-action="begin"]');
      if (begin) begin.onclick = () => ctx.beginChallenge();
      const reject = root.querySelector('[data-action="reject"]');
      if (reject) reject.onclick = () => ctx.rejectChallenge();
      const cont = root.querySelector('[data-action="continue"]');
      if (cont) cont.onclick = () => ctx.continueChallenge();
      root.querySelectorAll("[data-moral-id]").forEach((b) => {
        b.onclick = () => ctx.chooseChallengeMoral(b.dataset.moralId);
      });
      root.querySelectorAll("[data-choice-id]").forEach((b) => {
        b.onclick = () => ctx.chooseChallengeChoice(b.dataset.choiceId);
      });
      const memorize = root.querySelector("[data-memorize]");
      if (memorize) {
        memorize.onclick = () => {
          const seq = root.querySelector("[data-sequence]");
          const body = root.querySelector("[data-puzzle-body]");
          if (seq) seq.classList.add("hidden");
          if (body) body.classList.remove("hidden");
          memorize.classList.add("hidden");
        };
      }
      const puzzle = node.puzzle;
      if (puzzle && phase === "puzzle") {
        let selected = [];
        const selectedEl = root.querySelector("[data-selected]");
        const refresh = () => {
          if (!selectedEl) return;
          if (!selected.length) {
            selectedEl.textContent = "Selecciona y confirma.";
            return;
          }
          const marks = selected.map((id) => {
            const opt = puzzle.options.find((o) => o.id === id);
            return opt ? opt.icon || opt.label : id;
          });
          selectedEl.textContent = `Seleccionado: ${marks.join(" → ")}`;
        };
        root.querySelectorAll("[data-option-id]").forEach((b) => {
          b.onclick = () => {
            const id = b.dataset.optionId;
            if (puzzle.mode === "single") {
              ctx.answerPuzzle(id);
              return;
            }
            if (puzzle.mode === "pair") {
              const at = selected.indexOf(id);
              if (at !== -1) selected.splice(at, 1);
              else if (selected.length < 2) selected.push(id);
              refresh();
              return;
            }
            selected.push(id);
            refresh();
          };
        });
        const confirm = root.querySelector("[data-confirm]");
        if (confirm) confirm.onclick = () => ctx.answerPuzzle(selected.slice());
      }
    },
  };
}
