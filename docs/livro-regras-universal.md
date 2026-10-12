# WAI GAME System — Livro de Regras do Módulo Básico

> **WAI** — *Wide Adventure Interface*. O motor universal de RPG.
>
> **Status:** regras do módulo básico fechadas. Este documento descreve o
> *motor* — a camada de cálculos e regras — separado da *skin* (lore, nomes,
> imagens). Decisões tomadas aparecem como **Decidido**.

---

## Preâmbulo — por que separar

Hoje o Spaceships and Aliens é um sistema onde regra e universo estão
entrelaçados: os androides têm `attack` e `intellect`, a Tiburon tem
combustível, o drone tem CA 10. Se quisermos reusar o motor para fantasia,
cyberpunk ou horror, temos que separar duas coisas que hoje vivem juntas:

- **Motor (WAI)** — resolve o que acontece. Dados, faixas de desfecho,
  recursos, desgaste, substituição. Não conhece "androide", "Tiburon" nem
  "esperança".
- **Skin** — diz o que as coisas *são*. Nomes, prosa, imagens, paleta,
  taxonomia do mundo. Não faz conta nenhuma.

O WAI é o mesmo jogo em qualquer universo. A skin é o verniz que o público
enxerga. Trocar de skin não deve mexer em uma linha do motor.

**Contrato de separação (a regra de ouro):**

> O motor só conhece *entidades*, *traços*, *reservas*, *itens*, *moeda* e
> *dados*. Se um nome próprio, uma cor ou uma imagem aparece na lógica, algo
> vazou.

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
| `defense` | número | Dificuldade de ser atingido |
| `ability` | `{ name, trait, value }` | Traço especial com bônus próprio |
| `pool` | `{ start, max, current }` | Reserva de recurso |
| `items` | lista de Item | Equipamento carregado |
| `state` | enum | `active` \| `down` \| `replaced` |

**Decidido:** pool único, para simplicidade.

## 2. Traços

Traços são modificadores numéricos nomeados. O motor não sabe o que significam;
só soma. A skin decide quais existem.

- O SnA usa três: **Ataque**, **Inteligência**, **Especialidade** (a `ability`).
- Uma skin de fantasia poderia usar **Força**, **Astúcia**, **Arcano**.
- Uma skin de horror poderia usar **Sangue-frio**, **Percepção**, **Vontade**.

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

Onde `A` e `B` são as duas forças opostas da ficção. O SnA as chama de
**Esperança** e **Medo**. Outra skin pode chamá-las de **Luz/Sombra**,
**Ordem/Caos**, **Corpo/Máquina**. O motor só compara qual face saiu maior.

> **Por que dois dados em vez de um?** Um único d20 diz *se* deu certo. Dois
> dados opostos dizem *se* deu certo **e a que custo** — a mesma soma pode
> carregar sorte ou perigo. É o que dá textura narrativa sem o narrador
> inventar complicações do nada.

### 3.1 Determinação do resultado

1. Role `d12(A)` e `d12(B)`.
2. Compare os dois **entre si** — isso define o *tom* (favorável ou adverso).
3. Some tudo com o modificador e o d6, se houver.
4. Compare a **soma** com a **Dificuldade (DC)** — isso define *sucesso ou falha*.
5. Cruze tom × sucesso para achar a **faixa de desfecho**.

## 4. Faixas de Desfecho

O cruzamento produz cinco faixas. Cada uma concede (ou não) uma unidade de
recurso ao pool:

| Faixa | Condição | Sucesso? | Tom | Recurso |
|---|---|---|---|---|
| **Crítico** | A = B | sim/falha *intensa* | — | +1 |
| **Triunfo** | A > B e soma ≥ DC | sucesso | favorável | +1 |
| **Abertura** | A > B e soma < DC | falha | favorável | +1 |
| **Custo** | A < B e soma ≥ DC | sucesso | adverso | 0 |
| **Revés** | A < B e soma < DC | falha | adverso | 0 |

**A regra do recurso:** *tom favorável sempre rende recurso, mesmo falhando.*
A ideia é que sorte e infortúnio não dependem do sucesso da tarefa — você pode
falhar a ação e ainda sair com uma abertura. É deliberado.

**Decidido — Crítico:** o empate concede `+1` ao pool; o peso narrativo (o
"destino se manifesta") é *dificuldade narrativa* — interpretada pelo narrador
e pela skin, sem efeito mecânico obrigatório no motor.

**Decidido — Revés:** o motor não cobra recurso. O agravamento da cena é
*dificuldade narrativa*, a cargo do narrador.

## 5. Modificadores e Dificuldade

- **Modificador:** o número do traço relevante, escolhido pelo narrador antes
  da rolagem. O motor recebe um número; não valida a escolha.
- **DC (Dificuldade):** alvo fixo definido pela cena. O motor não sugere DCs —
  isso é ferramenta da skin (uma tabela de dificuldades por contexto).

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

Uma reserva é um recurso tático que sobe e desce. No SnA é a **Energia**;
numa skin de horror poderia ser **Sanidade**; em fantasia, **Mana**.

| Operação | Gatilho |
|---|---|
| `+1` | desfecho favorável (ver §4) ou habilidade |
| `−1` | gasto manual ou evento da ficção |
| teto | `max` — nada passa disso |
| piso | `0` — dispara o estado `down` (ver §8) |

**Decidido:** `max = 2 × start` é regra do motor — todo pool dobra, sem exceção
de skin. A recuperação principal vem do **desfecho favorável** (§4): tom
favorável rende `+1`, mesmo em falha. Ajuda externa (o mestre, um item, uma
habilidade, um evento) também pode restaurar recurso.

## 8. Estados e Substituição

Uma entidade tem três estados, e eles não têm nada a ver com o universo da
skin — só com a capacidade de agir:

| Estado | Significado | Recuperação |
|---|---|---|
| `active` | Opera normalmente | — |
| `down` | Não pode agir, mas ainda existe (desligado, inconsciente, exausto) | volta a `active` quando recuperar |
| `replaced` | Terminado (morto, destruído, desligado permanentemente) | só volta se a lore permitir (reconstrução, ressurreição…) |

O motor define as transições: ao zerar o pool, `active → down`. A passagem
`down → replaced` é decisão da mesa (ou da lore), não automática. O
**substituto é outro personagem**, escolhido pela skin — não um chassi
genérico. Retornar de `replaced` é, por padrão, impossível; a skin pode abrir
exceções narrativas.

**Nota:** o "Protocolo Drone" do SnA era um substituto genérico. Sob esta
definição ele deixa de ser regra do motor — a skin SnA define que, ao ser
`replaced`, o jogador assume outro androide do catálogo.

## 9. Itens

Um Item tem nome, um dado de dano opcional e tags livres. O motor usa:
`damage` (número), `dice` (ex.: `2d6`), bônus de traço, e `tags`.

**Decidido:** itens modificam traços, dependendo do tipo. Um item pode somar a
um traço (ex.: `+1` em Ataque), carregar dano, ou ambos. O motor soma
`traço + bônus de item` quando a ficção pedir.

## 10. Moeda

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
`down`. O pool (§7) é autonomia tática; o crédito é riqueza.

## 11. Módulos do "Básico Universal"

O **módulo básico** é o mínimo para jogar: §1–§10. Tudo o mais é opcional e
plugável, ativado pela skin:

| Módulo | O que adiciona | Estado |
|---|---|---|
| **Básico** | Entidades, duelos, pools, itens, moeda | núcleo |
| **Substituição** | Estado `replaced` + entidade substituta | opcional |
| **Moeda** | Escala monetária + saldo + preços | opcional |
| **Progressão** | Entidades evoluem entre sessões | não existe hoje |
| **Facções** | Entidades com relações e moral | não existe hoje |

---

# Parte II — A Skin

## 12. O que a skin fornece

A skin é **dado puro**. Ela nunca calcula. Ela entrega:

| Elemento | Exemplo SnA |
|---|---|
| **Nomes das forças opostas** | Esperança / Medo |
| **Nomes dos traços** | Ataque, Inteligência, Especialidade |
| **Roster de entidades** | os 10 androides (`data/robots.json`) |
| **Nomes dos recursos** | Energia / Células |
| **Nomes da moeda** | Latão → Diamante |
| **Taxonomia do mundo** | a árvore de lore (`data/lore/`) |
| **Prosa e imagens** | `.md` + `.webp` por entrada |
| **Paleta e ícones** | `sna.css` + `img/` |
| **Prompts de IA** | `prompts/*.js` (flavor, não regra) |

## 13. SnA como skin nº 1 (mapeamento)

| Motor | Skin SnA |
|---|---|
| Entidade | Androide / PNJ / Nave |
| `traits.attack` | Mod. Ataque |
| `traits.intellect` | Mod. Inteligência |
| `ability` | Habilidade Especial (ex.: Escudo Térmico Ativo) |
| `defense` | CA (Classe de Armadura) |
| `pool` | Energia (células) |
| `pool.max = 2 × start` | 6/12, 5/10, 7/14… |
| `down` | Androide desligado / inconsciente |
| `replaced` | Androide destruído → jogador assume outro do catálogo |
| d12 A / d12 B | Esperança / Medo |
| Forças opostas | Hope (dourado) / Fear (roxo) |

## 14. Uma skin alternativa (teste de estanqueidade)

Para provar que o motor aguenta outro universo, o mesmo núcleo vestido de
fantasia sombria:

| Motor | Skin "Reino Cinza" |
|---|---|
| d12 A / d12 B | Fé / Dúvida |
| traços | Lâmina, Sombra, Relíquia |
| pool | Vigor |
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
  "forces":   { "a": "Esperança", "b": "Medo" },
  "traits":   ["attack", "intellect", "ability"],
  "resource": { "name": "Energia", "maxFactor": 2 },
  "currency": ["Latão", "Cobre", "Bronze", "Prata", "Ouro", "Platina", "Diamante"],
  "entities": "data/robots.json",
  "world":    "data/lore/index.json",
  "theme":    "sna.css"
}
```

**Decidido:** o manifesto é o `skin.json`.

## 16. Regras de fronteira

1. Motor não lê `data/lore/` — só a UI de lore lê.
2. Motor não conhece cores nem imagens — só a camada de apresentação.
3. Prompts de IA (`prompts/`) são **skin**: descrevem o mundo, não resolvem regra.
4. Trocar a skin = trocar o manifesto + os dados. Zero alteração no motor.

## 17. Repositório e empacotamento — `wai-core`

O motor vive em repositório próprio, `wai-core`, seguindo o padrão dos outros
projetos. O SnA (e qualquer skin) é um consumidor.

```
wai-core/             ← motor puro: sem lore, sem imagens, sem nomes
├── src/              ← resolução, entidades, pools, moeda, itens
├── dist/             ← build consumível (wai.js / wai.mjs)
└── docs/             ← este livro de regras

<skin>/               ← ex.: SpaceshipAndAliens
├── skin.json         ← manifesto (forces, traits, resource, currency, paths)
├── data/             ← roster, lore, imagens
├── prompts/          ← flavor de IA
└── *.html            ← UI que consome o wai-core
```

- A skin depende do `wai-core`; o `wai-core` **nunca** depende de skin.
- Este documento pertence ao `wai-core` — deve migrar para lá quando o repo
  for criado.
- O motor é publicável como pacote (npm) para reuso.

---

## Apêndice — Glossário neutro

| Termo do motor | Significado |
|---|---|
| **Entidade** | Qualquer coisa que age |
| **Traço** | Modificador numérico nomeado |
| **Duelo** | Rolagem de dois d12 opostos |
| **Tom** | Qual d12 saiu maior (favorável/adverso) |
| **DC** | Dificuldade alvo |
| **Reserva / Pool** | Recurso tático que sobe e desce |
| **Faixa** | Cruzamento de tom × sucesso |
| **Down** | Fora de ação, mas existente |
| **Replaced** | Terminado; substituto assume |
| **Moeda** | Escala de 7 denominações fixas |
| **Skin** | Dados que vestem o motor (nomes, prosa, imagens) |

---

## Decisões fechadas

- §1 pool único · §2 traço padrão (+0, valor dado pelo mestre) ·
  §4 Crítico/Revés são dificuldade narrativa · §5 skin traz tabela de DCs ·
  §7 `max = 2× start`, recupera por desfecho favorável · §8 `down`/`replaced`
  redefinidos, substituto é outro personagem · §9 itens modificam traços ·
  §10 crédito separado do pool, acumulativo · §15 `skin.json`.

Nenhum ponto em aberto no módulo básico.
