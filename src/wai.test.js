// Self-check do motor. Roda com: npm test (node --test)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEntity, rollDuel, classify, addPool, spendPool, applyOutcome,
  itemTraitBonus, resolveModifier, rollDice, rollItemDamage,
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

test('createEntity: max = 2× start, current = start', () => {
  const e = createEntity({ id: 'x', pool: { start: 6 } });
  assert.equal(e.pool.max, 12);
  assert.equal(e.pool.current, 6);
  assert.equal(e.pool.max, e.pool.start * MAX_FACTOR);
  assert.equal(e.state, STATE.ACTIVE);
});

test('faixas de desfecho: crítico, triunfo, abertura, custo, revés', () => {
  const crit = rollDuel({ dc: 99, rng: rig([[12, 7], [12, 7]]) });
  assert.equal(crit.band, BAND.CRITICAL);
  assert.equal(crit.poolGain, 1);

  const tri = rollDuel({ dc: 13, rng: rig([[12, 10], [12, 3]]) });
  assert.equal(tri.band, BAND.TRIUMPH);
  assert.equal(tri.success, true);
  assert.equal(tri.poolGain, 1);

  const abe = rollDuel({ dc: 14, rng: rig([[12, 10], [12, 3]]) });
  assert.equal(abe.band, BAND.OPENING);
  assert.equal(abe.poolGain, 1); // tom favorável rende mesmo em falha

  const cus = rollDuel({ dc: 13, rng: rig([[12, 3], [12, 10]]) });
  assert.equal(cus.band, BAND.COST);
  assert.equal(cus.poolGain, 0);

  const rev = rollDuel({ dc: 14, rng: rig([[12, 3], [12, 10]]) });
  assert.equal(rev.band, BAND.REVERSAL);
  assert.equal(rev.poolGain, 0);
});

test('classify: empate é crítico independente do DC', () => {
  assert.equal(classify(5, 5, true), BAND.CRITICAL);
  assert.equal(classify(5, 5, false), BAND.CRITICAL);
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

test('pool: teto, piso e transição down/active', () => {
  const e = createEntity({ pool: { start: 3 } }); // max 6
  addPool(e, 99);
  assert.equal(e.pool.current, 6);
  spendPool(e, 6);
  assert.equal(e.pool.current, 0);
  assert.equal(e.state, STATE.DOWN);
  addPool(e, 1);
  assert.equal(e.state, STATE.ACTIVE);
});

test('applyOutcome soma o ganho da faixa ao pool', () => {
  const e = createEntity({ pool: { start: 3 } });
  applyOutcome(e, rollDuel({ dc: 13, rng: rig([[12, 10], [12, 3]]) }));
  assert.equal(e.pool.current, 4);
});

test('rollDice interpreta NdM±K', () => {
  assert.equal(rollDice('2d6+1', rig([[6, 3], [6, 4]])), 8);
  assert.equal(rollDice('1d12', rig([[12, 12]])), 12);
  assert.equal(rollDice('d6', rig([[6, 6]])), 6);
  assert.equal(rollItemDamage({ damage: 5 }), 5); // sem dice → dano fixo
  assert.throws(() => rollDice('abc'));
});

test('moeda: denominações fixas e breakdown greedy', () => {
  assert.deepEqual(DENOMINATIONS, [1, 10, 50, 100, 1000, 5000, 10000]);
  const b = breakdown(11601);
  assert.deepEqual(b.map((p) => [p.value, p.count]), [[10000, 1], [1000, 1], [100, 6], [1, 1]]);
  assert.equal(formatMoney(15, ['Latão', 'Cobre']), '1 Cobre, 5 Latão');
});
