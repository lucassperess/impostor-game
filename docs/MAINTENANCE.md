# Manutenção Rápida

## Perguntas

No arquivo `src/impostor-game.jsx`, localize `DEFAULT_ROUNDS`.

Formato de cada item:

```js
{ normal: "Pergunta para maioria", impostor: "Pergunta para impostor" }
```

## Avatares

No arquivo `src/impostor-game.jsx`, localize `AVATARS`.

Cada item é uma função `(c) => "<svg...>"`.

## Regras práticas

- Evite perguntas iguais ou óbvias.
- Mantenha tom parecido entre `normal` e `impostor`.
- Teste com 3-8 jogadores antes do deploy.
