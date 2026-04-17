# Manutenção Rápida

## Onde editar

- Perguntas: `src/data/rounds.js`
- Avatares: `src/data/avatars.js`
- Regras/fluxo principal: `src/impostor-game.jsx`
- UI compartilhada: `src/components/`

## Perguntas

Formato:

```js
{ normal: "Pergunta para maioria", impostor: "Pergunta para impostor" }
```

## Avatares

Cada item do array `AVATARS` é uma função `(c) => "<svg...>"`.

## UX atual

- Partida rápida no menu
- Temporizador opcional para discussão e preparação de voto
- Votação estruturada com aplicação automática de pontos

## Regras práticas

- Evite perguntas iguais ou óbvias.
- Mantenha tom parecido entre `normal` e `impostor`.
- Teste com 3-8 jogadores antes do deploy.
