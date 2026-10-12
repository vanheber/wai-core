# wai-core

**WAI** — *Wide Adventure Interface*. O motor universal de RPG.

Um núcleo de regras e cálculos agnóstico de universo. Tudo o que não é regra —
lore, nomes, prosa, imagens, paleta — é **skin**, um dado externo que veste o
motor. O `wai-core` nunca depende de uma skin; cada skin depende dele.

- **Livro de regras:** [`docs/livro-regras-universal.md`](docs/livro-regras-universal.md)
- **Primeira skin:** [SpaceshipsAndAliens](https://github.com/vanheber/SpaceshipsAndAliens)

## Estrutura

```
wai-core/
├── docs/    ← livro de regras do módulo básico
├── src/     ← motor (a construir)
└── dist/    ← build consumível
```

> Rascunho. O motor ainda não foi implementado — o livro de regras está em
> revisão.
