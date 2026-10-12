// Self-check do motor. Roda com: npm test (node --test)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEntity, rollDuel, classify, addPool, spendPool, applyOutcome,
  itemTraitBonus, resolveModifier, rollDice, maxDice, rollDamage, attack,
  breakdown, formatMoney, BAND, STATE, MAX_FACTOR, DENOMINATIONS,
} from './wai.js';

// rng determinístico: spec = [[lados, face], ...] na ordem das rolagens.
function rig(spec) {
  let i = 0;
  return () => {
    const [sides, face] = spec[i++];
    return (face - 0.5) / sides;
  };
}

test('createEntity: max = 2× start, current = start, ability normalizada', () => {
  const e = createEntity({ id: 'x', pool: { start: 6 }, ability: { name: 'Raio', trait: 'arcane' } });
  assert.equal(e.pool.max, 12);
  assert.equal(e.pool.current, 6);
  assert.equal(e.pool.max, e.pool.start * MAX_FACTOR);
  assert.equal(e.state, STATE.ACTIVE);
  assert.deepEqual(e.ability, { name: 'Raio', trait: 'arcane', value: 0, cost: 0 });
  assert.equal(createEntity({}).ability, null);
});

test('faixas de desfecho: crítico, triunfo, abertura, custo, revés', () => {
  const crit = rollDuel({ dc: 99, rng: rig([[12, 7], [12, 7]]) });
  assert.equal(crit.band, BAND.CRITICAL);
  assert.equal(crit.success, true); // sucesso absoluto: ignora o DC
  assert.equal(crit.poolGain, 1);
  assert.equal(crit.gmFear, 0);

  const tri = rollDuel({ dc: 13, rng: rig([[12, 10], [12, 3]]) });
  assert.equal(tri.band, BAND.TRIUMPH);
  assert.equal(tri.success, true);
  assert.equal(tri.poolGain, 1);

  const abe = rollDuel({ dc: 14, rng: rig([[12, 10], [12, 3]]) });
  assert.equal(abe.band, BAND.OPENING);
  assert.equal(abe.success, false);
  assert.equal(abe.poolGain, 1); // tom favorável rende mesmo em falha

  const cus = rollDuel({ dc: 13, rng: rig([[12, 3], [12, 10]]) });
  assert.equal(cus.band, BAND.COST);
  assert.equal(cus.poolGain, 0);

  const rev = rollDuel({ dc: 14, rng: rig([[12, 3], [12, 10]]) });
  assert.equal(rev.band, BAND.REVERSAL);
  assert.equal(rev.poolGain, 0);
});

test('crítico: A = B ≥ 2 é sucesso absoluto, 1 e 1 é falha crítica', () => {
  assert.equal(classify(5, 5, false), BAND.CRITICAL);
  assert.equal(classify(1, 1, true), BAND.CRITICAL_FAILURE);

  const cf = rollDuel({ dc: 0, rng: rig([[12, 1], [12, 1]]) });
  assert.equal(cf.band, BAND.CRITICAL_FAILURE);
  assert.equal(cf.success, false);
  assert.equal(cf.poolGain, 0);
  assert.equal(cf.gmFear, 1); // +1 Medo ao GM, reportado

  const ok = rollDuel({ dc: 99, rng: rig([[12, 12], [12, 12]]) });
  assert.equal(ok.band, BAND.CRITICAL);
  assert.equal(ok.success, true);
  assert.equal(ok.gmFear, 0);
});

test('rollDuel exige dc (sem padrão que faça tudo suceder)', () => {
  assert.throws(() => rollDuel({ rng: rig([[12, 1], [12, 1]]) }), /dc/);
});

test('vantagem/desvantagem mexem na soma, nunca no tom', () => {
  const adv = rollDuel({ dc: 0, mode: 'advantage', rng: rig([[12, 5], [12, 2], [6, 4]]) });
  assert.equal(adv.tone, 'favorable');
  assert.equal(adv.bonus, 4);
  assert.equal(adv.total, 5 + 2 + 4);

  const dis = rollDuel({ dc: 0, mode: 'disadvantage', rng: rig([[12, 5], [12, 2], [6, 4]]) });
  assert.equal(dis.tone, 'favorable'); // o d6 não muda o tom
  assert.equal(dis.bonus, -4);
  assert.equal(dis.total, 5 + 2 - 4);
});

test('modificador = traço + bônus de item', () => {
  const e = createEntity({ traits: { attack: 3 }, items: [{ name: 'lâmina', traits: { attack: 1 } }] });
  assert.equal(itemTraitBonus(e, 'attack'), 1);
  assert.equal(resolveModifier(e, { trait: 'attack' }), 4);
  assert.equal(resolveModifier(e, { trait: 'intellect' }), 0);
  assert.equal(resolveModifier(e, { modifier: 7 }), 7); // explícito vence
  const r = rollDuel({ entity: e, trait: 'attack', dc: 0, rng: rig([[12, 1], [12, 1]]) });
  assert.equal(r.modifier, 4);
});

test('poder: useAbility gasta pool e soma o valor do traço', () => {
  const e = createEntity({
    pool: { start: 5 }, traits: { arcane: 2 },
    ability: { name: 'Raio', trait: 'arcane', value: 4, cost: 3 },
  });
  const r = rollDuel({ entity: e, trait: 'arcane', dc: 0, useAbility: true, rng: rig([[12, 1], [12, 2]]) });
  assert.equal(r.ability, 4);
  assert.equal(r.modifier, 2);
  assert.equal(r.total, 1 + 2 + 2 + 4);
  assert.equal(e.pool.current, 2); // gastou 3 de 5

  // traço que não casa → não ativa, não gasta
  const e2 = createEntity({ pool: { start: 5 }, ability: { trait: 'arcane', value: 4, cost: 3 } });
  const r2 = rollDuel({ entity: e2, trait: 'stealth', dc: 0, useAbility: true, rng: rig([[12, 1], [12, 2]]) });
  assert.equal(r2.ability, 0);
  assert.equal(e2.pool.current, 5);

  // pool insuficiente → não ativa
  const e3 = createEntity({ pool: { start: 2 }, ability: { trait: 'arcane', cost: 3 } });
  rollDuel({ entity: e3, trait: 'arcane', dc: 0, useAbility: true, rng: rig([[12, 1], [12, 2]]) });
  assert.equal(e3.pool.current, 2);
});

test('pool: teto, piso e transição down/active', () => {
  const e = createEntity({ pool: { start: 3 } }); // max 6
  addPool(e, 99);
  assert.equal(e.pool.current, 6);
  spendPool(e, 6);
  assert.equal(e.pool.current, 0);
  assert.equal(e.state, STATE.DOWN);
  spendPool(e, 5); // gastar além do atual nunca vira saldo negativo
  assert.equal(e.pool.current, 0);
  addPool(e, 1);
  assert.equal(e.state, STATE.ACTIVE);
});

test('applyOutcome soma o ganho da faixa ao pool', () => {
  const e = createEntity({ pool: { start: 3 } });
  applyOutcome(e, rollDuel({ dc: 13, rng: rig([[12, 10], [12, 3]]) }));
  assert.equal(e.pool.current, 4);
});

test('dados: NdM±K, máximo e dano', () => {
  assert.equal(rollDice('2d6+1', rig([[6, 3], [6, 4]])), 8);
  assert.equal(rollDice('1d12', rig([[12, 12]])), 12);
  assert.equal(rollDice('d6', rig([[6, 6]])), 6);
  assert.equal(maxDice('2d6'), 12);
  assert.equal(maxDice('2d6+1'), 13);
  assert.equal(rollDamage({ damage: 5 }), 5); // sem dice → dano fixo
  assert.equal(rollDamage({ dice: '2d6' }, { rng: rig([[6, 3], [6, 4]]) }), 7);
  assert.equal(rollDamage({ dice: '2d6' }, { critical: true }), 12); // crítico = máximo
  assert.throws(() => rollDice('abc'));
});

test('attack: acerta pela CA e aplica dano; crítico = dano máximo', () => {
  const sword = { name: 'lâmina', dice: '2d6', traits: { attack: 1 } };
  const atk = createEntity({ traits: { attack: 3 } });
  const def = createEntity({ defense: 13, pool: { start: 10 } });

  // triunfo (10 > 3) e total 13 ≥ CA → acerta
  const hit = attack({ attacker: atk, defender: def, item: sword, trait: 'attack', rng: rig([[12, 10], [12, 3], [6, 3], [6, 4]]) });
  assert.equal(hit.band, BAND.TRIUMPH);
  assert.equal(hit.damage, 7);
  assert.equal(def.pool.current, 3);

  // abertura (falha favorável) → erra, sem dano
  const def2 = createEntity({ defense: 20, pool: { start: 10 } });
  const miss = attack({ attacker: atk, defender: def2, item: sword, trait: 'attack', rng: rig([[12, 10], [12, 3], [6, 3], [6, 4]]) });
  assert.equal(miss.band, BAND.OPENING);
  assert.equal(miss.damage, 0);
  assert.equal(def2.pool.current, 10);

  // crítico (3 = 3) → dano máximo, ignora a CA
  const def3 = createEntity({ defense: 99, pool: { start: 10 } });
  const crit = attack({ attacker: atk, defender: def3, item: sword, trait: 'attack', rng: rig([[12, 3], [12, 3]]) });
  assert.equal(crit.band, BAND.CRITICAL);
  assert.equal(crit.damage, 12);
  assert.equal(def3.pool.current, 0); // piso 0 + estado down
  assert.equal(def3.state, STATE.DOWN);
});

test('moeda: denominações fixas e breakdown greedy', () => {
  assert.deepEqual(DENOMINATIONS, [1, 10, 50, 100, 1000, 5000, 10000]);
  const b = breakdown(11601);
  assert.deepEqual(b.map((p) => [p.value, p.count]), [[10000, 1], [1000, 1], [100, 6], [1, 1]]);
  assert.equal(formatMoney(15, ['Latão', 'Cobre']), '1 Cobre, 5 Latão');
});
