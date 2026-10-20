// Desafíos secundarios de la senda: mini-historias con una prueba y un epílogo.
// El módulo es puro: no conoce run.js ni el DOM. run.js/main.js aplican recompensas.

const RUNES = [
  { id: "fire", label: "Fuego", icon: "🔥" },
  { id: "ice", label: "Hielo", icon: "❄️" },
  { id: "storm", label: "Tormenta", icon: "⚡" },
  { id: "life", label: "Vida", icon: "🌿" },
];

const RIDDLES = [
  {
    prompt: "«No tengo boca y devoro ejércitos; no tengo alma y juzgo a los vivos. ¿Qué soy?»",
    options: [
      { id: "lich", label: "El Lich", icon: "☠️" },
      { id: "time", label: "El tiempo", icon: "⏳" },
      { id: "sword", label: "Una espada", icon: "⚔️" },
    ],
    answer: "time",
  },
  {
    prompt: "«Cuanto más quitas, más grande soy. ¿Qué soy?»",
    options: [
      { id: "hole", label: "Un agujero", icon: "🕳️" },
      { id: "gold", label: "Una montaña de oro", icon: "🪙" },
      { id: "shadow", label: "Una sombra", icon: "🌑" },
    ],
    answer: "hole",
  },
  {
    prompt: "«Todos me llevan, nadie me ve, y al final todos me pierden. ¿Qué soy?»",
    options: [
      { id: "name", label: "El nombre", icon: "📜" },
      { id: "breath", label: "El aliento", icon: "💨" },
      { id: "crown", label: "La corona", icon: "👑" },
    ],
    answer: "name",
  },
  {
    prompt: "«Guardo lo que se olvida y devoro lo que se recuerda. ¿Qué soy?»",
    options: [
      { id: "mirror", label: "Un espejo", icon: "🪞" },
      { id: "grave", label: "Una tumba", icon: "🪦" },
      { id: "book", label: "Un libro", icon: "📖" },
    ],
    answer: "grave",
  },
];

function pick(rng, list) {
  return list[Math.floor(rng.next() * list.length)];
}

export function buildPuzzle(rng, template) {
  if (template === "riddle") {
    const riddle = pick(rng, RIDDLES);
    return {
      template,
      mode: "single",
      prompt: riddle.prompt,
      options: riddle.options,
      answer: riddle.answer,
    };
  }
  if (template === "card_sum") {
    const values = [2, 3, 4, 5, 6, 7, 8, 9];
    const target = 7 + Math.floor(rng.next() * 7);
    const options = [];
    const used = new Set();
    while (options.length < 4) {
      const value = pick(rng, values);
      if (used.has(value)) continue;
      used.add(value);
      options.push({ id: `v${value}`, label: `${value} de fuerza`, icon: "🃏", value });
    }
    const pair = [];
    for (let i = 0; i < options.length && pair.length < 2; i++) {
      for (let j = i + 1; j < options.length && pair.length < 2; j++) {
        if (options[i].value + options[j].value === target) pair.push(options[i].id, options[j].id);
      }
    }
    if (pair.length < 2) return buildPuzzle(rng, "card_sum");
    return {
      template,
      mode: "pair",
      prompt: `El puente exige dos ofrendas que sumen exactamente ${target}.`,
      options,
      answer: pair,
    };
  }
  if (template === "memory") {
    const length = 4 + Math.floor(rng.next() * 5);
    const sequence = [];
    for (let i = 0; i < length; i++) sequence.push(pick(rng, RUNES).id);
    return {
      template,
      mode: "sequence",
      prompt: "Memoriza la secuencia de runas. Después deberás repetirla.",
      options: RUNES,
      answer: sequence,
    };
  }
  // rune_sequence: ciclo breve que solo se muestra un instante
  const length = 4 + Math.floor(rng.next() * 5);
  const sequence = [];
  for (let i = 0; i < length; i++) sequence.push(pick(rng, RUNES).id);
  return {
    template: "rune_sequence",
    mode: "sequence",
    prompt: "Los sellos muestran su ciclo solo un instante. Memorízalo y repite la secuencia para abrirlos.",
    options: RUNES,
    answer: sequence,
  };
}

const TEMPLATES = [
  {
    id: "hunt_ogre",
    kind: "hunt",
    style: "Épico",
    icon: "🎯",
    title: "El tributo del ogro",
    intro: [
      "El camino se estrecha entre huesos y estandartes rotos. Un ogro de piel cenicienta bloquea el paso y golpea el suelo con un tronco: exige un tributo que no llevas.",
      "Detrás de él, una aldea quemada aún humea. Si lo derrotas, los supervivientes recordarán tu nombre; si caes, el ogro añadirá tu cráneo a su colección.",
    ],
    trial: { type: "combat", tierOffset: 1 },
    moral: {
      phase: "after",
      prompt: "El ogro cae de rodillas. La aldea espera tu decisión.",
      options: [
        { id: "spare", label: "Perdonarlo y ayudarlo a levantarse", morality: { mercy: 1 }, reward: { heal: 10, xp: 15 }, outcome: "El ogro gruñe una promesa y se pierde entre los árboles. Los aldeanos te ofrecen comida y refugio." },
        { id: "execute", label: "Ejecutarlo y saquear su guarida", morality: { greed: 1 }, reward: { coins: 25 }, outcome: "Encuentras monedas entre los huesos. Nadie te mira a los ojos cuando abandonas la aldea." },
      ],
    },
    outcomes: {
      triumph: { text: "La aldea celebra tu victoria y te colma de provisiones.", reward: { coins: 20, xp: 20 } },
      win: { text: "El ogro cae. Los aldeanos te dan lo poco que les queda.", reward: { coins: 12, xp: 10 } },
      loss: { text: "El tronco del ogro se alza una última vez. La senda termina aquí.", penalty: { runOver: true } },
    },
  },
  {
    id: "hunt_frost_beast",
    kind: "hunt",
    style: "Melancólico",
    icon: "🐺",
    title: "La bestia de las nieves",
    intro: [
      "La nieve borra tus huellas. Una bestia de pelaje azul yace herida junto a un santuario congelado; respira con dificultad y te observa sin miedo.",
      "Los cazadores de la zona pagan bien por su piel. Los druidas, en cambio, dicen que su corazón mantiene vivo el bosque.",
    ],
    trial: { type: "combat", tierOffset: 1 },
    moral: {
      phase: "after",
      prompt: "La bestia ya no puede luchar. Su aliento forma pequeñas nubes de escarcha.",
      options: [
        { id: "skin", label: "Quedarte con la piel", morality: { greed: 1 }, reward: { coins: 30, cardTier: "uncommon" }, outcome: "La piel pesa más de lo que esperabas. El bosque parece apagarse a tu espalda." },
        { id: "heal", label: "Curarla y dejarla marchar", morality: { mercy: 1 }, reward: { maxHp: 6, xp: 20 }, outcome: "La bestia lame tu mano y desaparece entre la niebla. Sientes que el frío te respeta." },
      ],
    },
    outcomes: {
      triumph: { text: "La bestia cae sin derramar sangre. El santuario recupera su luz.", reward: { coins: 18, xp: 20 } },
      win: { text: "La bestia se rinde. La nieve se tiñe de rojo.", reward: { coins: 10, xp: 10 } },
      loss: { text: "El frío te alcanza antes que tu espada. Te conviertes en parte del paisaje.", penalty: { runOver: true } },
    },
  },
  {
    id: "puzzle_seals",
    kind: "puzzle",
    style: "Arcano",
    icon: "🧩",
    title: "La cámara de los sellos",
    intro: [
      "Bajo una capilla sin nombre, cuatro sellos de runa giran en el aire. Alguien los dispuso para encerrar algo que aún susurra.",
      "Una voz te ofrece poder si liberas el sello. Otra, más antigua, te pide que lo cierres para siempre.",
    ],
    trial: { type: "puzzle", template: "rune_sequence" },
    moral: {
      phase: "after",
      prompt: "La secuencia se abre. La voz encerrada espera tu mano.",
      options: [
        { id: "seal", label: "Sellar la cámara para siempre", morality: { honor: 1 }, reward: { relic: "relic_obsidian_bastion" }, outcome: "El silencio vuelve a la capilla. Una placa de obsidiana queda en tu equipo." },
        { id: "free", label: "Liberar al espíritu", morality: { corruption: 1 }, reward: { cardTier: "rare", xp: 25 }, outcome: "El espíritu te susurra un nombre que no deberías conocer. Te deja un regalo y una mancha en el alma." },
      ],
    },
    outcomes: {
      triumph: { text: "Los sellos se alinean sin esfuerzo. La cámara te reconoce.", reward: { coins: 20, xp: 20 } },
      win: { text: "La cámara se abre a medias. Alcanzas a tomar algo antes de que se cierre.", reward: { coins: 10, xp: 10 } },
      loss: { text: "Las runas estallan. El dolor te acompaña senda abajo.", penalty: { damage: 8 } },
    },
  },
  {
    id: "puzzle_specter",
    kind: "puzzle",
    style: "Gótico",
    icon: "👻",
    title: "El acertijo del espectro",
    intro: [
      "Un espectro con armadura de escriba flota sobre un puente de tinta seca. Dice que solo deja pasar a quien responde con verdad.",
      "Sus ojos huecos reflejan tus mentiras antes de que las digas. Promete un tesoro por una respuesta honesta y una maldición por una falsa.",
    ],
    trial: { type: "puzzle", template: "riddle" },
    moral: {
      phase: "before",
      prompt: "Antes de responder, el espectro te pregunta: «¿Vas a decirme la verdad?»",
      options: [
        { id: "truth", label: "Prometer la verdad", morality: { honor: 1 }, outcome: "El espectro asiente. Sus cadenas se aflojan." },
        { id: "lie", label: "Mentir sin pestañear", morality: { corruption: 1 }, outcome: "El espectro sonríe. La tinta de su puente se vuelve negra." },
      ],
    },
    outcomes: {
      triumph: { text: "El espectro aplaude en silencio y te entrega una página de su libro.", reward: { coins: 15, cardTier: "uncommon" } },
      win: { text: "El espectro acepta tu respuesta a regañadientes.", reward: { coins: 8, xp: 10 } },
      loss: { text: "La respuesta es incorrecta. El puente se deshace y la tinta te quema.", penalty: { damage: 6, coins: 8 } },
    },
  },
  {
    id: "puzzle_bridge",
    kind: "puzzle",
    style: "Fábula",
    icon: "🌉",
    title: "El puente de piedra",
    intro: [
      "Un puente de losas flotantes cruza un abismo. Cada losa exige un peso exacto y un viajero herido se aferra a una de ellas.",
      "Su bolsa de monedas brilla en el borde. Puedes salvarlo o quedártela mientras el puente aguanta.",
    ],
    trial: { type: "puzzle", template: "card_sum" },
    moral: {
      phase: "after",
      prompt: "El puente se estabiliza. El viajero te mira con gratitud y miedo.",
      options: [
        { id: "save", label: "Salvarlo y compartir tus provisiones", morality: { mercy: 1 }, reward: { heal: 12, xp: 15 }, outcome: "El viajero te cuenta un atajo y te deja comida. Su bendición te acompaña." },
        { id: "purse", label: "Quedarte con su bolsa", morality: { greed: 1 }, reward: { coins: 22 }, outcome: "Las monedas pesan. El viajero no dice nada, pero el puente cruje a tu espalda." },
      ],
    },
    outcomes: {
      triumph: { text: "Las losas encajan perfectamente. Cruzas sin mirar atrás.", reward: { coins: 15, xp: 15 } },
      win: { text: "Cruzas con un par de losas de sobra. El viajero respira.", reward: { coins: 8, xp: 8 } },
      loss: { text: "Una losa cede. Pierdes parte de tu equipo en el abismo.", penalty: { coins: 12, damage: 4 } },
    },
  },
  {
    id: "puzzle_mirrors",
    kind: "puzzle",
    style: "Onírico",
    icon: "🪞",
    title: "El laberinto de espejos",
    intro: [
      "Un pasillo de espejos repite tus movimientos con un instante de retraso. En el centro, una figura con tu cara sostiene una llave.",
      "Si rompes el espejo, la llave será tuya. Si lo atraviesas, quizá descubras qué parte de ti se quedó atrás.",
    ],
    trial: { type: "puzzle", template: "memory" },
    moral: {
      phase: "after",
      prompt: "El espejo se agrieta. Tu reflejo espera.",
      options: [
        { id: "break", label: "Romper el espejo y tomar la llave", morality: { corruption: 1 }, reward: { coins: 25, cardTier: "rare" }, outcome: "La llave es fría. Tu reflejo se rompe en mil pedazos que no dejan de mirarte." },
        { id: "cross", label: "Atravesar el espejo", morality: { honor: 1 }, reward: { xp: 30, maxHp: 4 }, outcome: "Al otro lado encuentras un recuerdo tuyo. Lo guardas y el laberinto se disuelve." },
      ],
    },
    outcomes: {
      triumph: { text: "Repites la secuencia sin dudar. Los espejos se abren.", reward: { coins: 18, xp: 18 } },
      win: { text: "La secuencia se rompe al final, pero encuentras una salida.", reward: { coins: 8, xp: 8 } },
      loss: { text: "Los espejos te devuelven golpes que no lanzaste.", penalty: { damage: 7 } },
    },
  },
  {
    id: "risk_blood_altar",
    kind: "risk",
    style: "Ritual",
    icon: "⚖️",
    title: "El altar de sangre",
    intro: [
      "Un altar de piedra negra late como un corazón. Sobre él flota una reliquia envuelta en vendas húmedas.",
      "La voz del altar no pide monedas: pide algo que sangre, algo que duela, algo que recuerdes.",
    ],
    trial: {
      type: "choice",
      choices: [
        { id: "life", label: "Ofrecer tu sangre (pierdes 8 de vida máxima)", morality: { corruption: 1 }, reward: { relic: "relic_thorn_crown" }, penalty: { maxHp: 8 }, outcome: "El altar bebe. La corona de espinas se ajusta a tu cabeza y sonríe." },
        { id: "memory", label: "Sacrificar una carta de tu mazo", morality: { honor: 1 }, reward: { relic: "relic_troll_heart", xp: 20 }, needsCardSacrifice: true, outcome: "Entregas un recuerdo hecho carta. El altar te devuelve un corazón que late despacio." },
        { id: "refuse", label: "Apartarte del altar", morality: { honor: 1 }, reward: { coins: 10 }, outcome: "El altar se apaga. Sientes que has evitado una deuda, pero también una oportunidad." },
      ],
    },
    outcomes: {
      win: { text: "El altar queda en silencio.", reward: {} },
      loss: { text: "El altar no perdona.", penalty: { damage: 8 } },
    },
  },
  {
    id: "risk_merchant_bet",
    kind: "risk",
    style: "Picaresco",
    icon: "🎲",
    title: "La apuesta del mercader",
    intro: [
      "Un mercader con sonrisa de zorro agita tres dados y una carta boca abajo. «Una apuesta honesta», dice, aunque sus dedos no paran quietos.",
      "Puedes pagar por la carta, hacer trampa para llevarte más, o simplemente seguir tu camino.",
    ],
    trial: {
      type: "choice",
      choices: [
        { id: "fair", label: "Pagar 20 monedas por la carta", penalty: { coins: 20 }, reward: { cardTier: "uncommon" }, morality: { honor: 1 }, outcome: "El mercader te entrega la carta con una reverencia exagerada. Es justo lo que necesitabas." },
        { id: "cheat", label: "Hacer trampa", morality: { corruption: 1, greed: 1 }, reward: { coins: 30, curseId: "curse_deadweight" }, outcome: "Ganas la apuesta y algo más. Al marcharte, una carta pesada aparece en tu mazo." },
        { id: "refuse", label: "No apostar", outcome: "El mercader se encoge de hombros y guarda sus dados. Sigues tu camino sin deudas." },
      ],
    },
    outcomes: {
      win: { text: "Los dados ruedan a tu favor.", reward: {} },
      loss: { text: "La casa siempre gana.", penalty: { coins: 10 } },
    },
  },
  {
    id: "risk_corrupt_fountain",
    kind: "risk",
    style: "Horror corporal",
    icon: "⛲",
    title: "La fuente corrupta",
    intro: [
      "Una fuente de agua negra late bajo un árbol muerto. Un soldado moribundo arrastra su armadura hacia ella.",
      "El agua cura. También cambia. El soldado te mira, esperando que decidas por los dos.",
    ],
    trial: {
      type: "choice",
      choices: [
        { id: "drink", label: "Beber hasta saciarte", morality: { corruption: 1 }, reward: { heal: 999, curseId: "curse_open_wound" }, outcome: "El agua te reconstruye desde dentro. Algo se queda moviéndose bajo tu piel." },
        { id: "purify", label: "Purificar el agua (25 monedas)", penalty: { coins: 25 }, reward: { heal: 20, xp: 15 }, morality: { honor: 1 }, outcome: "El agua se aclara. El soldado bebe primero y te da las gracias." },
        { id: "share", label: "Compartir tu agua con el soldado", morality: { mercy: 1 }, reward: { heal: 8, xp: 10 }, outcome: "Le das tu cantimplora. El soldado sonríe y te señala un camino seguro." },
      ],
    },
    outcomes: {
      win: { text: "La fuente vuelve a dormir.", reward: {} },
      loss: { text: "El agua no era para ti.", penalty: { damage: 10 } },
    },
  },
  {
    id: "risk_dead_feast",
    kind: "risk",
    style: "Grotesco",
    icon: "🍖",
    title: "El banquete de los muertos",
    intro: [
      "Una mesa larga aparece en mitad del camino. Los comensales son esqueletos con ropas de gala y platos que humean.",
      "Uno de ellos, un niño con corona de latón, te ofrece su asiento. Otro, un fantasma harapiento, te pide que le acerques un plato.",
    ],
    trial: {
      type: "choice",
      choices: [
        { id: "feast", label: "Sentarte y banquetearte", morality: { greed: 1 }, reward: { maxHp: 10, curseId: "curse_deadweight" }, outcome: "La comida sabe a recuerdo. Te sientes más fuerte, pero algo pesado se sienta contigo en el mazo." },
        { id: "feed", label: "Alimentar al fantasma harapiento", morality: { mercy: 1 }, reward: { xp: 25, heal: 8 }, outcome: "El fantasma llora y te bendice. Los esqueletos aplauden con sus dedos." },
        { id: "refuse", label: "Rechazar el banquete", morality: { honor: 1 }, reward: { coins: 8 }, outcome: "La mesa se desvanece. El camino vuelve a estar vacío." },
      ],
    },
    outcomes: {
      win: { text: "Los muertos brindan por ti.", reward: {} },
      loss: { text: "El banquete cobra su precio.", penalty: { damage: 6, coins: 8 } },
    },
  },
  {
    id: "deck_silence",
    kind: "deckTrial",
    style: "Monástico",
    icon: "🧘",
    title: "La prueba del silencio",
    intro: [
      "Un monasterio sin puertas flota en la niebla. Los monjes que lo habitan no hablan: luchan con la mente y con el silencio.",
      "Para cruzar, debes vencer a su guardián sin usar recursos ni cartas de efecto. Solo tu mazo, tu acero y tu disciplina.",
    ],
    trial: { type: "combat", tierOffset: 1, restrictions: { noResources: true, noEffects: true } },
    moral: {
      phase: "after",
      prompt: "El guardián se arrodilla. El altar del monasterio sigue brillando.",
      options: [
        { id: "spare", label: "Perdonar al guardián y respetar el altar", morality: { honor: 1 }, reward: { relic: "relic_moon_chalice" }, outcome: "El guardián te ofrece el cáliz de la luna. El monasterio vuelve a callar en paz." },
        { id: "destroy", label: "Destruir el altar y tomar su poder", morality: { corruption: 1, greed: 1 }, reward: { coins: 40, maxHp: 5 }, outcome: "El altar se rompe. El poder entra en ti con un grito que nadie más oye." },
      ],
    },
    outcomes: {
      triumph: { text: "Vences en silencio. El monasterio te reconoce como uno de los suyos.", reward: { coins: 20, xp: 25 } },
      win: { text: "El guardián cae. Cruzas el monasterio sin mirar atrás.", reward: { coins: 10, xp: 12 } },
      loss: { text: "El silencio te devora. No hay palabras para describir el final.", penalty: { runOver: true } },
    },
  },
  {
    id: "deck_tide",
    kind: "deckTrial",
    style: "Urgencia",
    icon: "🌊",
    title: "La carrera contra la marea",
    intro: [
      "El dique se rompe y el agua avanza por el valle. En la orilla, un grupo de aldeanos carga cofres hacia la colina.",
      "Al otro lado, una casa noble flota a la deriva con sus tesoros. La marea no espera a nadie.",
    ],
    trial: { type: "combat", tierOffset: 1, roundLimit: 4 },
    moral: {
      phase: "after",
      prompt: "El enemigo cae y el agua sigue subiendo. Aún puedes elegir qué salvar.",
      options: [
        { id: "save", label: "Ayudar a los aldeanos", morality: { mercy: 1 }, reward: { heal: 15, xp: 20, cardId: "amulet_arcane" }, outcome: "Los aldeanos te sacan del agua. Uno de ellos te da su último amuleto arcano." },
        { id: "loot", label: "Saquear la casa noble", morality: { greed: 1 }, reward: { coins: 35, cardTier: "rare" }, outcome: "Sales del agua con los bolsillos llenos. Nadie te espera en la colina." },
      ],
    },
    outcomes: {
      triumph: { text: "Vences antes de que el agua te alcance y salvas a todos.", reward: { coins: 20, xp: 25 } },
      win: { text: "Ganas, pero la marea ya te llega a la cintura.", reward: { coins: 10, xp: 12 } },
      loss: { text: "La marea te alcanza. El valle se cierra sobre ti.", penalty: { runOver: true } },
    },
  },
];

export const CHALLENGE_TEMPLATES = TEMPLATES;

export function rollChallenge(rng, context = {}) {
  const pool = TEMPLATES.filter((t) => {
    if (t.kind === "hunt" && context.depth >= 5) return false;
    return true;
  });
  if (!pool.length) return null;
  const template = pick(rng, pool);
  const node = JSON.parse(JSON.stringify(template));
  node.type = "challenge";
  node.outcomes = node.outcomes || {};
  if (node.trial && node.trial.type === "puzzle") {
    node.puzzle = buildPuzzle(rng, node.trial.template);
  }
  return node;
}

export function evaluateCombatOutcome(combat, node) {
  if (combat.winner === "enemy") return "loss";
  const limit = node.trial?.roundLimit;
  if (limit && combat.round > limit) return "win";
  const hpRatio = combat.hero.hp / Math.max(1, combat.hero.maxHp);
  return hpRatio >= 0.5 ? "triumph" : "win";
}

export function puzzleSolved(puzzle, answer) {
  if (!puzzle) return false;
  if (puzzle.mode === "single") return answer === puzzle.answer;
  if (puzzle.mode === "pair") {
    if (!Array.isArray(answer) || answer.length !== 2) return false;
    return answer.includes(puzzle.answer[0]) && answer.includes(puzzle.answer[1]);
  }
  if (puzzle.mode === "sequence") {
    if (!Array.isArray(answer) || answer.length !== puzzle.answer.length) return false;
    return answer.every((id, i) => id === puzzle.answer[i]);
  }
  return false;
}
