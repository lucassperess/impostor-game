# Impostor Game

Jogo social em React onde todos recebem uma pergunta parecida, exceto 1 impostor.

## Estrutura

- `impostor-game.jsx`: wrapper de compatibilidade (reexport)
- `src/impostor-game.jsx`: jogo principal
- `docs/`: documentação de manutenção

## Como atualizar conteúdo (via código)

Edite em `src/impostor-game.jsx`:

- `DEFAULT_ROUNDS`: banco de perguntas
- `AVATARS`: templates SVG dos avatares

Depois faça commit e deploy.

## Fluxo de desenvolvimento

1. Ajuste código no `src/impostor-game.jsx`
2. Commit na `main`
3. Deploy na VPS

## Observações

- O jogo não expõe painel de edição para usuários finais.
- Preferências locais (jogadores/rodadas/mute) ficam no `localStorage` do navegador.
