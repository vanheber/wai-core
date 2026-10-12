# wai-core

**WAI** — *Wide Adventure Interface*. O motor universal de RPG.

Um núcleo de regras e cálculos agnóstico de universo. Tudo o que não é regra —
lore, nomes, prosa, imagens, paleta — é **skin**, um dado externo que veste o
motor. O `wai-core` nunca depende de uma skin; cada skin depende dele.

- **Livro de regras:** [`docs/livro-regras-universal.md`](docs/livro-regras-universal.md) ([HTML navegável](docs/index.html))
- **Primeira skin:** [SpaceshipsAndAliens](https://github.com/vanheber/SpaceshipsAndAliens)

## Estrutura

```
wai-core/
├── docs/      ← livro de regras (.md) + HTML navegável (index.html)
├── src/       ← motor (wai.js) + self-check (wai.test.js)
└── scripts/   ← build-docs.js (md → html)
```

## Uso

```js
import { createEntity, rollDuel, applyOutcome } from './src/wai.js';

const e = createEntity({ id: 'x', traits: { attack: 3 }, pool: { start: 6 } });
const r = rollDuel({ entity: e, trait: 'attack', dc: 13 });
applyOutcome(e, r); // r.band, r.poolGain, r.success, r.tone…
```

- `npm test` — self-check do motor (Node stdlib, sem dependências).
- `npm run docs` — regenera `docs/index.html` a partir do `.md`.

> Motor puro — sem skin, sem DOM, sem storage. Regras do módulo básico fechadas
> em [`docs/livro-regras-universal.md`](docs/livro-regras-universal.md).
