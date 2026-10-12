// WAI GAME System — motor universal (Wide Adventure Interface).
// Puro: sem DOM, sem storage, sem skin. Só regra e cálculo.
// Ver docs/livro-regras-universal.md.

export const MAX_FACTOR = 2;

// Escala monetária de 7 denominações fixas (§11).
export const DENOMINATIONS = [1, 10, 50, 100, 1000, 5000, 10000];

// Faixas de desfecho (§4).
export const BAND = {
  CRITICAL: 'critical',
  CRITICAL_FAILURE: 'critical_failure',
  TRIUMPH: 'triumph',
  OPENING: 'opening',
  COST: 'cost',
  REVERSAL: 'reversal',
};

// Estados de entidade (§8).
export const STATE = { ACTIVE: 'active', DOWN: 'down', REPLACED: 'replaced' };

const FAVORABLE = new Set([BAND.CRITICAL, BAND.TRIUMPH, BAND.OPENING]);

function rollFace(sides, rng) {
  return 1 + Math.floor(rng() * sides);
}

function normalizeItem(item = {}) {
  return {
    name: item.name ?? null,
    damage: item.damage ?? null,
    dice: item.dice ?? null,
    traits: { ...(item.traits ?? {}) },
    tags: [...(item.tags ?? [])],
  };
}

// Cria/normaliza uma entidade (§1). max ausente vira 2× start (§7).
export function createEntity(def = {}) {
  const start = def.pool?.start ?? def.start ?? 0;
  const ab = def.ability;
  return {
    id: def.id ?? null,
    traits: { ...(def.traits ?? {}) },
    defense: def.defense ?? 0,
    ability: ab
      ? {
        name: ab.name ?? null,
        trait: ab.trait ?? null,
        value: ab.value ?? 0,
        cost: ab.cost ?? 0,
      }
      : null,
    pool: {
      start,
      max: def.pool?.max ?? def.max ?? start * MAX_FACTOR,
      current: def.pool?.current ?? def.current ?? start,
    },
    items: (def.items ?? []).map(normalizeItem),
    state: def.state ?? STATE.ACTIVE,
    credit: def.credit ?? 0,
  };
}

// Soma dos bônus de item para um traço (§9).
export function itemTraitBonus(entity, trait) {
  return (entity?.items ?? []).reduce((sum, it) => sum + (it.traits?.[trait] ?? 0), 0);
}

// Modificador do teste: explícito > traço (com bônus de item) > 0 (§2, §5).
export function resolveModifier(entity, { trait = null, modifier } = {}) {
  if (modifier != null) return modifier;
  if (trait == null) return 0;
  return (entity?.traits?.[trait] ?? 0) + itemTraitBonus(entity, trait);
}

// Classifica a faixa (§4). Empate é crítico; 1 e 1 é a exceção (falha crítica).
export function classify(a, b, success) {
  if (a === b) return a === 1 ? BAND.CRITICAL_FAILURE : BAND.CRITICAL;
  if (a > b) return success ? BAND.TRIUMPH : BAND.OPENING;
  return success ? BAND.COST : BAND.REVERSAL;
}

// Rolagem de Duelo (§3). dc é obrigatório — não há padrão que faça tudo suceder.
// useAbility: true ativa o poder da entidade: gasta ability.cost e soma
// ability.value quando o traço casa (§10).
export function rollDuel({
  entity = null, trait = null, modifier, dc, mode = 'normal',
  useAbility = false, rng = Math.random,
} = {}) {
  if (dc == null) throw new Error('rollDuel: dc é obrigatório');
  const a = rollFace(12, rng);
  const b = rollFace(12, rng);
  const ab = entity?.ability;
  let abilityValue = 0;
  if (useAbility && ab && (ab.trait == null || ab.trait === trait)
    && entity.state === STATE.ACTIVE && entity.pool.current >= ab.cost) {
    if (ab.cost > 0) spendPool(entity, ab.cost);
    abilityValue = ab.value;
  }
  const mod = resolveModifier(entity, { trait, modifier });
  let bonus = 0;
  if (mode === 'advantage') bonus = rollFace(6, rng);
  else if (mode === 'disadvantage') bonus = -rollFace(6, rng);
  const total = a + b + mod + abilityValue + bonus;
  const band = classify(a, b, total >= dc);
  const criticalFailure = band === BAND.CRITICAL_FAILURE;
  return {
    a, b, modifier: mod, ability: abilityValue, bonus, total, dc, mode,
    success: band === BAND.CRITICAL ? true : criticalFailure ? false : total >= dc,
    tone: a > b ? 'favorable' : a < b ? 'adverse' : 'critical',
    band,
    poolGain: FAVORABLE.has(band) ? 1 : 0,
    // Evento de Medo para o GM (§4): reportado, não rastreado pelo motor.
    gmFear: criticalFailure ? 1 : 0,
  };
}

// Ajusta o pool, respeitando piso 0 e teto max (§7), e a transição
// down/active (§8). O piso impede que gastar além do atual vire saldo negativo.
export function addPool(entity, n = 1) {
  const p = entity.pool;
  p.current = Math.max(0, Math.min(p.max, p.current + n));
  if (p.current <= 0) entity.state = STATE.DOWN;
  else if (entity.state === STATE.DOWN) entity.state = STATE.ACTIVE;
  return entity;
}

export function spendPool(entity, n = 1) {
  return addPool(entity, -n);
}

export function setState(entity, state) {
  entity.state = state;
  return entity;
}

// Aplica o ganho da faixa ao pool (§4).
export function applyOutcome(entity, result) {
  return addPool(entity, result.poolGain);
}

function parseDice(expr) {
  const m = /^(\d*)d(\d+)([+-]\d+)?$/i.exec(String(expr).trim());
  if (!m) throw new Error(`expressão de dado inválida: ${expr}`);
  return {
    count: m[1] ? parseInt(m[1], 10) : 1,
    sides: parseInt(m[2], 10),
    flat: m[3] ? parseInt(m[3], 10) : 0,
  };
}

// Dados de item: NdM±K (§9).
export function rollDice(expr, rng = Math.random) {
  const { count, sides, flat } = parseDice(expr);
  let sum = flat;
  for (let i = 0; i < count; i++) sum += rollFace(sides, rng);
  return sum;
}

// Máximo possível de uma expressão — dano do crítico (§10).
export function maxDice(expr) {
  const { count, sides, flat } = parseDice(expr);
  return count * sides + flat;
}

// Dano de um item. Crítico = dano máximo (§10).
export function rollDamage(item = null, { critical = false, rng = Math.random } = {}) {
  if (!item?.dice) return item?.damage ?? 0;
  return critical ? maxDice(item.dice) : rollDice(item.dice, rng);
}

// Ataque: duelo contra a CA do alvo. Sucesso aplica o dano ao pool do alvo;
// crítico = dano máximo (§10).
export function attack({
  attacker = null, defender = null, item = null, trait = null,
  mode = 'normal', useAbility = false, rng = Math.random,
} = {}) {
  const result = rollDuel({
    entity: attacker, trait, dc: defender?.defense ?? 0, mode, useAbility, rng,
  });
  let damage = 0;
  if (result.success && item) {
    damage = rollDamage(item, { critical: result.band === BAND.CRITICAL, rng });
    if (defender) addPool(defender, -damage);
  }
  return { ...result, damage };
}

// Crédito é acumulativo e separado do pool (§11). breakdown é greedy, ótimo
// nesta escala (cada degrau é ≥ 2× o anterior).
export function breakdown(amount, names = null) {
  let rest = Math.max(0, Math.floor(amount));
  const out = [];
  for (let i = DENOMINATIONS.length - 1; i >= 0; i--) {
    const value = DENOMINATIONS[i];
    const count = Math.floor(rest / value);
    if (count > 0) {
      rest -= count * value;
      out.push({ value, count, name: names?.[i] ?? null });
    }
  }
  return out;
}

export function formatMoney(amount, names = null) {
  const parts = breakdown(amount, names);
  if (parts.length === 0) return names ? `0 ${names[0]}` : '0';
  return parts.map((p) => `${p.count} ${p.name ?? p.value}`).join(', ');
}
