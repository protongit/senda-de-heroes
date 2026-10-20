import { savedRunInfo } from "../save.js";
import { esc } from "../ui.js";

export function menu(ctx) {
  const saved = savedRunInfo();
  const continueButton = saved
    ? `<button class="btn primary" data-action="continue">Continuar partida
        <span class="muted">${esc(saved.heroIcon)} ${esc(saved.heroName)} · Nv ${esc(saved.level)} · Paso ${esc(saved.depth + 1)}${saved.ascension ? ` · Senda ★${esc(saved.ascension + 1)}` : ""}</span>
      </button>`
    : "";
  const html = `
  <section class="screen menu">
    <h1 class="title">Senda de Héroes</h1>
    <p class="subtitle">Construye tu mazo, recorre la senda y derrota al Lich.</p>
    <div class="menu-actions">
      ${continueButton}
      <button class="btn primary" data-action="solo">1 jugador</button>
      <button class="btn" data-action="coop">Cooperativo (2P vs IA)</button>
      <button class="btn" data-action="versus">Competitivo (1v1)</button>
      <button class="btn" data-action="help">Cómo jugar</button>
    </div>
    <div class="help hidden" data-help>
      <h3>Turno y recursos</h3>
      <ul>
        <li>Cada ronda robas 6 cartas y tienes <strong>3 acciones</strong> (4 en clases arcanas); cada carta jugada consume 1 acción.</li>
        <li><strong>Solo las clases arcanas (Hechicera, Elfa) tienen energía</strong>: las cartas con coste ✦ no pueden usarse sin ella.</li>
      </ul>
      <h3>Intención y reacciones</h3>
      <ul>
        <li>El enemigo <strong>anuncia su próximo movimiento</strong> (icono, nombre y daño estimado) antes de que juegues.</li>
        <li>Al terminar tu turno puedes jugar <strong>cartas de reacción</strong> si el movimiento lo permite (↩️ si ataca, 🔇 si se potencia o defiende).</li>
        <li>Cada reacción <strong>cuesta 1 acción de tu turno siguiente</strong>; si no reaccionas, el enemigo actúa al instante.</li>
      </ul>
      <h3>Equipo, efectos y consumibles</h3>
      <ul>
        <li>El <strong>equipo</strong> queda en la mesa y se mantiene entre rondas y combates hasta que lo cambies o vendas.</li>
        <li>Capacidad: 1 casco, 1 armadura, 1 par de botas, <strong>1 amuleto + 1 anillo</strong>, 1 capa y las manos (<strong>1 arma + 1 escudo</strong>: jugar un arma o escudo <strong>sustituye al equipado</strong>, que vuelve al descarte; un arma a dos manos lo sustituye todo; lo pesado exige fuerza).</li>
        <li>Las <strong>cartas de efecto</strong> (🙏 bendiciones, 🧴 venenos, ☠️ maldiciones) duran unas rondas o todo el combate: verás un chip con las rondas restantes. El veneno ignora el bloqueo.</li>
        <li>Los élites y jefes también infligen <strong>maldiciones y veneno</strong>.</li>
        <li>Algunas cartas se <strong>consumen al jugarlas</strong> (🔥 Furia Final): salen de tu mazo para siempre a cambio de un efecto potente.</li>
      </ul>
      <h3>Fragua y mercado</h3>
      <ul>
        <li>En la <strong>🔨 fragua</strong> puedes <strong>mejorar</strong> una carta (⭐ +50% de valor y efectos) o <strong>fusionar</strong> un equipo con una <strong>carta de efecto</strong>: el material de fusión son bendiciones 🙏, venenos 🧴, maldiciones ☠️… y las <strong>gemas 💎 y runas 🔮</strong>, que solo sirven para engarzar. Se activarán en cada combate. Solo 1 efecto por equipo; si el equipo se vende o pierde, ambos se descartan.</li>
        <li>La tienda tiene <strong>mercadería fija</strong> para toda la partida y una zona de <strong>rarezas de la semana</strong> que rota en cada visita (Común → Épica).</li>
        <li>Vender devuelve el 50% del valor de la carta.</li>
      </ul>
      <h3>Progresión y senda</h3>
      <ul>
        <li>Cada nivel te permite <strong>elegir 1 de 2 ventajas (perks)</strong>: vida, fuerza, robo extra, bloqueo inicial, daño, celeridad…</li>
        <li>La senda es aleatoria: en cada paso eliges entre <strong>dos opciones</strong> (combate, tienda, tesoro o fragua) hasta el Jefe Orco y el Lich final.</li>
        <li>Con probabilidad aparece una <strong>tercera opción de desafío</strong>: una historia con cacería, enigma o pacto. Resolverla no avanza la senda.</li>
        <li><strong>Reliquias:</strong> equipo de slot único con un gran beneficio y una maldición. Solo una activa.</li>
        <li><strong>Maldiciones de mazo:</strong> no se juegan; se eliminan con el hechicero de la tienda. El curandero cura vida.</li>
        <li><strong>Marcas elementales:</strong> combina Sangrado, Fractura, Quemadura, Escarcha, Electro, Viento o Veneno para detonar reacciones.</li>
        <li>Cooperativo: 2 héroes contra un enemigo de la IA, con amenaza, provocar, cubrir y rescatar. Competitivo: 2 héroes cara a cara.</li>
      </ul>
    </div>
  </section>`;
  return {
    html,
    bind(root) {
      const cont = root.querySelector('[data-action="continue"]');
      if (cont) cont.onclick = () => ctx.continueSavedGame();
      root.querySelector('[data-action="solo"]').onclick = () => ctx.go("select");
      root.querySelector('[data-action="coop"]').onclick = () => ctx.go("duelsetup", { mode: "coop" });
      root.querySelector('[data-action="versus"]').onclick = () => ctx.go("duelsetup", { mode: "versus" });
      root.querySelector('[data-action="help"]').onclick = () => {
        root.querySelector("[data-help]").classList.toggle("hidden");
      };
    },
  };
}
