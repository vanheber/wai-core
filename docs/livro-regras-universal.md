# WAI GAME System — Livro de Regras do Módulo Básico

> **WAI** — *Wide Adventure Interface*. O motor universal de RPG.
>
> **Status:** regras do módulo básico fechadas. Este documento descreve o
> *motor* — a camada de cálculos e regras — separado da *skin* (lore, nomes,
> imagens). Decisões tomadas aparecem como **Decidido**.

---

## Preâmbulo — por que separar

Um sistema onde regra e universo vivem entrelaçados é difícil de reusar. Para
levar o mesmo motor a outro universo — fantasia, cyberpunk, horror —, separamos
duas coisas:

- **Motor (WAI)** — resolve o que acontece. Dados, faixas de desfecho,
  recursos, dano, desgaste, substituição. Não conhece nenhum nome próprio, cor
  ou imagem.
- **Skin** — diz o que as coisas *são*. Nomes, prosa, imagens, paleta,
  taxonomia do mundo. Não faz conta nenhuma.

O WAI é o mesmo jogo em qualquer universo. A skin é o verniz que o público
enxerga. Trocar de skin não deve mexer em uma linha do motor.

**Contrato de separação (a regra de ouro):**

> O motor só conhece *entidades*, *traços*, *reservas*, *itens*, *dano*,
> *moeda* e *dados*. Se um nome próprio, uma cor ou uma imagem aparece na
> lógica, algo vazou.

---

# Parte I — O Motor (WAI)

## 1. Entidades

O motor trabalha com um único tipo de objeto: a **Entidade**. Uma entidade é
qualquer coisa que age — um personagem, um NPC, um veículo, uma criatura, uma
torreta. O motor não distingue: todos têm os mesmos campos.

| Campo | Tipo | Papel |
|---|---|---|
| `id` | string | Identificador estável |
| `traits` | mapa nome→número | Modificadores numéricos |
| `defense` | número | **CA** — dificuldade de ser atingido (armadura, escudo, campo de força) |
| `ability` | `{ name, trait, value, cost }` | **Poder** — bônus próprio, custa pool (§10.3) |
| `pool` | `{ start, max, current }` | Reserva de vida **e** recurso (§7) |
| `items` | lista de Item | Equipamento carregado |
| `state` | enum | `active` \| `down` \| `replaced` |
| `credit` | número | Saldo de moeda, separado do pool (§11) |

**Decidido:** pool único, para simplicidade. Crédito é dinheiro, não é pool.

## 2. Traços

Traços são modificadores numéricos nomeados. O motor não sabe o que significam;
só soma. A skin decide quais existem.

- Uma skin sci-fi poderia usar **Ataque**, **Sistemas**, **Especialidade**.
- Uma skin de fantasia, **Força**, **Astúcia**, **Arcano**.
- Uma skin de horror, **Sangue-frio**, **Percepção**, **Vontade**.

O motor só exige: *um traço é um número somado a uma rolagem quando a ficção
pedir.* Quantos traços, e seus nomes, são escolha da skin.

**Decidido:** existe um traço padrão. Quando nenhum traço da skin se aplica —
um teste fora do escopo do jogo — o mestre atribui um valor ao teste, e é esse
número que entra como modificador. O motor não julga o valor dado.

## 3. A Rolagem de Duelo

O coração do motor. Toda ação incerta é resolvida por **dois dados de 12 faces
opostos** — não um dado de sucesso, mas uma *balança*.

```
Duelo = d12(A) + d12(B) + modificador ± d6(vantagem/desvantagem)
```

Onde `A` e `B` são as duas forças opostas da ficção — cada skin as nomeia.
Exemplos: **Fé/Dúvida**, **Luz/Sombra**, **Ordem/Caos**, **Corpo/Máquina**. O
motor só compara qual face saiu maior.

> **Por que dois dados em vez de um?** Um único d20 diz *se* deu certo. Dois
> dados opostos dizem *se* deu certo **e a que custo** — a mesma soma pode
> carregar sorte ou perigo. É o que dá textura narrativa sem o narrador
> inventar complicações do nada.

### 3.1 Determinação do resultado

1. Role `d12(A)` e `d12(B)`.
2. Se as faces forem **iguais**, é **crítico** — e o DC é ignorado (§4). Pare
   aqui: `A = B ≥ 2` é sucesso absoluto, `1 e 1` é falha crítica.
3. Compare os dois **entre si** — isso define o *tom* (favorável ou adverso).
4. Some tudo com o modificador e o d6, se houver.
5. Compare a **soma** com a **Dificuldade (DC)** — isso define *sucesso ou falha*.
6. Cruze tom × sucesso para achar a **faixa de desfecho**.

## 4. Faixas de Desfecho

O cruzamento produz **seis** faixas. Cada uma concede (ou não) uma unidade de
recurso ao pool:

| Faixa | Condição | Sucesso? | Recurso |
|---|---|---|---|
| **Crítico** | A = B ≥ 2 | **sucesso absoluto** (ignora o DC) | +1 |
| **Falha crítica** | A = 1 e B = 1 | falha | 0 |
| **Triunfo** | A > B e soma ≥ DC | sucesso | +1 |
| **Abertura** | A > B e soma < DC | falha | +1 |
| **Custo** | A < B e soma ≥ DC | sucesso | 0 |
| **Revés** | A < B e soma < DC | falha | 0 |

**A regra do recurso:** *tom favorável sempre rende recurso, mesmo falhando.*
A ideia é que sorte e infortúnio não dependem do sucesso da tarefa — você pode
falhar a ação e ainda sair com uma abertura. É deliberado.

**Decidido — Crítico:** empate com valor ≥ 2 é **sucesso absoluto**: sem
comparação com o DC. Em ataque, concede **dano máximo** (§10.2).

**Decidido — Falha crítica (1 e 1):** dá **+1 Medo ao GM** e efeitos narrativos
negativos. O motor só **reporta** o evento (`gmFear: 1`); ele não rastreia um
pool de Medo — a skin/UI cuida disso. Nada é debitado do pool do jogador de
forma automática.

**Decidido — Revés:** o motor não cobra recurso. O agravamento da cena é
*dificuldade narrativa*, a cargo do narrador.

## 5. Modificadores e Dificuldade

- **Modificador:** o número do traço relevante, escolhido pelo narrador antes
  da rolagem. O motor recebe um número; não valida a escolha.
- **DC (Dificuldade):** alvo fixo definido pela cena. **Obrigatório** — não há
  valor padrão, porque um padrão faria tudo suceder. Em ataque, a DC vem da
  `defense` do alvo (§10.1).
- **Bônus de poder:** quando um poder é ativado, seu `value` soma ao teste e
  seu `cost` drena o pool (§10.3).

**Decidido:** a skin traz uma tabela canônica de DCs (ex.: Fácil 8 / Médio 12 /
Difícil 16). O motor não a define, mas conta com ela para padronizar os testes.

## 6. Vantagem e Desvantagem

Um dado extra de 6 faces inclina a soma, **sem tocar o tom**:

| Modo | Efeito |
|---|---|
| **Vantagem** | `+1d6` na soma |
| **Desvantagem** | `−1d6` na soma |

Regra crítica: **os d6 nunca decidem o tom (A vs B)**. Só os d12 decidem. Isso
mantém o eixo narrativo (sorte/perigo) independente do eixo tático (bônus).

## 7. Reservas (Pools)

Uma reserva é o recurso tático da entidade — e ela é **duas coisas ao mesmo
tempo: vida e recurso** (Energia, Sanidade, Mana, Vigor; a skin nomeia).

| Operação | Gatilho |
|---|---|
| `+1` | desfecho favorável (§4) ou ajuda externa (mestre, item, evento) |
| `−N` | dano recebido (§10.1), poder ativado (§10.3), gasto manual, evento da ficção |
| teto | `max` — nada passa disso |
| piso | `0` — dispara o estado `down` (§8) |

**Decidido:** `max = 2 × start` é regra do motor — todo pool dobra, sem exceção
de skin. A recuperação principal vem do **desfecho favorável** (§4): tom
favorável rende `+1`, mesmo em falha.

**Decidido — por que dano e poder compartilham o pool:** usar um poder torna a
entidade mais vulnerável, porque tira do mesmo reservatório que sustenta a vida.
É a contenção do sistema: poder tem custo real e exige critério, em vez de
ações cinematográficas ilimitadas.

**Nota:** gasta além do atual **nunca vira saldo negativo** — o piso é `0`.

## 8. Estados e Substituição

Uma entidade tem três estados, e eles não têm nada a ver com o universo da
skin — só com a capacidade de agir:

| Estado | Significado | Recuperação |
|---|---|---|
| `active` | Opera normalmente | — |
| `down` | Não pode agir, mas ainda existe (desligado, inconsciente, exausto) | volta a `active` quando recuperar pool |
| `replaced` | Terminado (morto, destruído, desligado permanentemente) | só volta se a lore permitir (reconstrução, ressurreição…) |

O motor define as transições: ao zerar o pool de vida, `active → down`. A
passagem `down → replaced` é decisão da mesa (ou da lore), não automática. O
**substituto é outra entidade**, escolhida pela skin — não um chassi genérico.
Retornar de `replaced` é, por padrão, impossível; a skin pode abrir exceções
narrativas.

**Nota:** o substituto não é regra do motor. A skin decide se, ao ser
`replaced`, outra entidade do roster assume — um aliado, um chassi reserva, um
herdeiro.

## 9. Itens

Um Item tem nome, um dado de dano opcional e tags livres. O motor usa:
`damage` (número), `dice` (ex.: `2d6`), bônus de traço, e `tags`.

**Decidido:** itens modificam traços, dependendo do tipo. Um item pode somar a
um traço (ex.: `+1` em um traço), carregar dano, ou ambos. O motor soma
`traço + bônus de item` quando a ficção pedir. O `damage`/`dice` é o que o
ataque aplica (§10.2).

## 10. Dano, Ataque e Poderes

Dano recebido, poderes ativados e gastos manuais consomem **o mesmo pool** (§7).
É o que dá peso tático ao sistema.

### 10.1 Ataque

Um ataque é um duelo (§3) cuja **DC é a `defense` do alvo**:

| Passo | Regra |
|---|---|
| 1 | Atacante rola o duelo com `dc = defense` do alvo |
| 2 | **Sucesso** (crítico, triunfo ou custo) → acerta e aplica o dano do item ao pool do alvo |
| 3 | **Crítico** (A = B ≥ 2) → dano **máximo** e sem comparação com o DC |
| 4 | **Falha** (abertura, revés ou falha crítica) → erra, sem dano |

`defense` é a **CA**: armadura, escudo, campo de força — o que a skin definir.
Um alvo sem proteção tem `defense = 0`.

### 10.2 Dano

- `item.dice` (ex.: `2d6`) → rolagem normal.
- `item.damage` (número) → dano fixo, quando o item não tem dado.
- **Crítico → máximo** do dado: `2d6` vira `12`.
- O dano baixa o pool do alvo; ao chegar em `0`, `active → down` (§8).

### 10.3 Poderes

Um poder é o `ability` da entidade:

| Campo | Papel |
|---|---|
| `name` | Nome do poder (dado da skin) |
| `trait` | Traço com que o teste é feito |
| `value` | Bônus somado ao teste |
| `cost` | Pool gasto ao ativar |

Ativar gasta `cost` e soma `value` quando o traço casa. Pool insuficiente ou
estado `down` → o poder **não** ativa. Poder sem rolagem é um gasto manual de
pool (`spendPool`).

**Decidido — recurso único do jogador:** o pool é o **único** recurso do
jogador. Itens ou poderes especiais podem alterar isso, mas só de forma
narrativa — nunca automática.

## 11. Moeda

O motor define uma **escala monetária de denominações fixas**. Os valores são
regra; os nomes são skin.

```
Base: 1 · 10 · 50 · 100 · 1.000 · 5.000 · 10.000
```

Sete degraus, cada um um múltiplo do primeiro. Uma skin nomeia cada degrau e
decide o que cada faixa de preço compra. Exemplo:

| Valor | Nome (skin exemplo) |
|---|---|
| 1 | Latão |
| 10 | Cobre |
| 50 | Bronze |
| 100 | Prata |
| 1.000 | Ouro |
| 5.000 | Platina |
| 10.000 | Diamante |

Regras:
- Preços e custos são sempre múltiplos ou somas dessas denominações.
- O motor não converte entre skins — a escala é absoluta dentro de uma skin.
- Entidades podem carregar saldo; itens e serviços têm preço.

**Decidido:** crédito é **separado** do pool de recursos — não confundir os
dois. O saldo é dinheiro puro, **acumulativo**, sem teto `2×` e sem piso
`down`. O pool (§7) é vida e autonomia tática; o crédito é riqueza.

## 12. Módulos do "Básico Universal"

O **módulo básico** é o mínimo para jogar: **§1–§11**. Tudo o mais é opcional e
plugável, ativado pela skin:

| Módulo | O que adiciona | Estado |
|---|---|---|
| **Básico** | Entidades, duelos, pools, dano, itens, moeda | núcleo |
| **Progressão** | Entidades evoluem entre sessões | não existe hoje |
| **Facções** | Entidades com relações e moral | não existe hoje |

---

# Parte II — A Skin

## 13. O que a skin fornece

A skin é **dado puro**. Ela nunca calcula. Ela entrega:

| Elemento | Exemplo (skin) |
|---|---|
| **Nomes das forças opostas** | Fé / Dúvida |
| **Nomes dos traços** | Lâmina, Sombra, Relíquia |
| **Roster de entidades** | lista de personagens (`data/entities.json`) |
| **Nomes dos recursos** | Vigor |
| **Nomes da moeda** | Latão → Diamante |
| **Taxonomia do mundo** | a árvore de lore (`data/lore/`) |
| **Prosa e imagens** | `.md` + `.webp` por entrada |
| **Paleta e ícones** | `theme.css` + `img/` |
| **Prompts de IA** | `prompts/*.js` (flavor, não regra) |

## 14. Uma skin de exemplo (teste de estanqueidade)

Para provar que o motor aguenta qualquer universo, o mesmo núcleo vestido de
fantasia sombria:

| Motor | Skin "Reino Cinza" |
|---|---|
| d12 A / d12 B | Fé / Dúvida |
| traços | Lâmina, Sombra, Relíquia |
| pool (vida + recurso) | Vigor |
| `defense` | "Peitoral" / "Escudo do Altar" |
| `ability` | "Golpe do Juízo" (custa Vigor) |
| `down` | Nocaute |
| `replaced` | "Chamado Final" (um escudeiro assume o posto) |
| moeda | Latão → Diamante (mesma escala, nomes do reino) |
| itens | relíquias com dado de dano |

Se algo nesta tabela exigir mudança no motor, a separação vazou.

---

# Parte III — Contrato de Dados

## 15. Como o motor lê a skin

O motor recebe a skin por um **manifesto** (`skin.json`) — um único ponto de
entrada — e nunca importa arquivos de skin diretamente:

```json
{
  "forces":   { "a": "Fé", "b": "Dúvida" },
  "traits":   ["lamina", "sombra", "reliquia"],
  "resource": { "name": "Vigor", "maxFactor": 2 },
  "currency": ["Latão", "Cobre", "Bronze", "Prata", "Ouro", "Platina", "Diamante"],
  "entities": "data/entities.json",
  "world":    "data/lore/index.json",
  "theme":    "theme.css"
}
```

**Decidido:** o manifesto é o `skin.json`.

## 16. Regras de fronteira

1. Motor não lê `data/lore/` — só a UI de lore lê.
2. Motor não conhece cores nem imagens — só a camada de apresentação.
3. Prompts de IA (`prompts/`) são **skin**: descrevem o mundo, não resolvem regra.
4. Trocar a skin = trocar o manifesto + os dados. Zero alteração no motor.

## 17. Repositório e empacotamento — `wai-core`

O motor vive em repositório próprio, `wai-core`. Cada skin é um consumidor.

```
wai-core/             ← motor puro: sem lore, sem imagens, sem nomes
├── src/              ← resolução, entidades, pools, dano, moeda, itens
├── docs/             ← este livro de regras (+ HTML navegável)
└── scripts/          ← geração de docs

<skin>/               ← um universo qualquer
├── skin.json         ← manifesto (forces, traits, resource, currency, paths)
├── data/             ← roster, lore, imagens
├── prompts/          ← flavor de IA
└── *.html            ← UI que consome o wai-core
```

- A skin depende do `wai-core`; o `wai-core` **nunca** depende de skin.
- Este documento pertence ao `wai-core`.
- O motor é publicável como pacote (npm) para reuso.

---

## Apêndice — Glossário neutro

| Termo do motor | Significado |
|---|---|
| **Entidade** | Qualquer coisa que age |
| **Traço** | Modificador numérico nomeado |
| **Duelo** | Rolagem de dois d12 opostos |
| **Tom** | Qual d12 saiu maior (favorável/adverso) |
| **DC** | Dificuldade alvo (obrigatória; em ataque, a CA do alvo) |
| **CA / Defense** | Dificuldade de ser atingido |
| **Reserva / Pool** | Vida **e** recurso da entidade |
| **Faixa** | Cruze de tom × sucesso (ou crítico) |
| **Dano** | Perda de pool causada por ataque |
| **Poder / Ability** | Traço especial que soma bônus e custa pool |
| **Crédito** | Saldo de moeda, separado do pool |
| **Medo do GM** | Evento reportado em falha crítica (`gmFear`) |
| **Down** | Fora de ação, mas existente |
| **Replaced** | Terminado; substituto assume |
| **Moeda** | Escala de 7 denominações fixas |
| **Skin** | Dados que vestem o motor (nomes, prosa, imagens) |

---

## Decisões fechadas

- §1 pool único · `credit` separado · `defense` = CA · `ability` =
  `{ name, trait, value, cost }` · §2 traço padrão (+0, valor dado pelo mestre) ·
  §3 dc obrigatório (sem padrão) · §4 Crítico = sucesso absoluto (`A = B ≥ 2`),
  Falha crítica = `1 e 1` (+1 Medo ao GM, reportado), Revés é dificuldade
  narrativa · §5 skin traz tabela de DCs · §7 `max = 2× start`, pool = vida +
  recurso, recupera por desfecho favorável, piso 0 · §8 `down`/`replaced`
  redefinidos, substituto é outra entidade · §9 itens modificam traços e
  carregam dano · §10 crítico = dano máximo, poder gasta pool, Medo do GM
  reportado e não rastreado · §11 crédito separado do pool, acumulativo ·
  §12 Básico = §1–§11, opcionais = Progressão/Facções · §15 `skin.json`.

Nenhum ponto em aberto no módulo básico.
