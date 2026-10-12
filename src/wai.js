// WAI GAME System — motor universal (Wide Adventure Interface).
// Puro: sem DOM, sem storage, sem skin. Só regra e cálculo.
// Ver docs/livro-regras-universal.md.

export const MAX_FACTOR = 2;

// Escala monetária de 7 denominações fixas (§10).
export const DENOMINATIONS = [1, 10, 50, 100, 1000, 5000, 10000];

// Faixas de desfecho (§4).
export const BAND = {
  CRITICAL: 'critical',
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
  return {
    id: def.id ?? null,
    traits: { ...(def.traits ?? {}) },
    defense: def.defense ?? 0,
    ability: def.ability ?? null,
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

// Classifica a faixa a partir do tom (a vs b) e do sucesso (§4).
export function classify(a, b, success) {
  if (a === b) return BAND.CRITICAL;
  if (a > b) return success ? BAND.TRIUMPH : BAND.OPENING;
  return success ? BAND.COST : BAND.REVERSAL;
}

// Rolagem de Duelo (§3). rng injetável: () => número em [0,1).
export function rollDuel({
  entity = null, trait = null, modifier, dc = 0, mode = 'normal', rng = Math.random,
} = {}) {
  const a = rollFace(12, rng);
  const b = rollFace(12, rng);
  const mod = resolveModifier(entity, { trait, modifier });
  let bonus = 0;
  if (mode === 'advantage') bonus = rollFace(6, rng);
  else if (mode === 'disadvantage') bonus = -rollFace(6, rng);
  const total = a + b + mod + bonus;
  const success = total >= dc;
  const band = classify(a, b, success);
  return {
    a, b, modifier: mod, bonus, total, dc, success, mode,
    tone: a > b ? 'favorable' : a < b ? 'adverse' : 'critical',
    band,
    poolGain: FAVORABLE.has(band) ? 1 : 0,
  };
}

// Ajusta o pool, respeitando teto (§7) e a transição down/active (§8).
export function addPool(entity, n = 1) {
  const p = entity.pool;
  p.current = Math.min(p.max, p.current + n);
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

// Dados de item: NdM±K (§9).
export function rollDice(expr, rng = Math.random) {
  const m = /^(\d*)d(\d+)([+-]\d+)?$/i.exec(String(expr).trim());
  if (!m) throw new Error(`expressão de dado inválida: ${expr}`);
  const count = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  const flat = m[3] ? parseInt(m[3], 10) : 0;
  let sum = flat;
  for (let i = 0; i < count; i++) sum += rollFace(sides, rng);
  return sum;
}

export function rollItemDamage(item, rng = Math.random) {
  if (!item?.dice) return item?.damage ?? 0;
  return rollDice(item.dice, rng);
}

// Crédito é acumulativo e separado do pool (§10). breakdown é greedy, ótimo
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
