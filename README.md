# Impostor Game

Jogo social em React onde todos recebem uma pergunta parecida, exceto 1 impostor.

## Estrutura

- `impostor-game.jsx`: wrapper de compatibilidade (reexport)
- `src/impostor-game.jsx`: orquestrador principal do jogo
- `src/data/`: perguntas, avatares e dados de áudio
- `src/hooks/`: hooks reutilizáveis (`useMusic`)
- `src/components/`: componentes de UI
- `src/ui/`: tema, tokens e estilos globais
- `src/utils/`: utilitários e storage keys
- `docs/`: documentação de manutenção

## Melhorias de gameplay

- Partida rápida direto no menu
- Modo com temporizador opcional
- Votação estruturada com aplicação automática de pontos
- Ajuste manual opcional de pontuação

## Como atualizar conteúdo (via código)

Edite em `src/data/`:

- `rounds.js`: banco de perguntas
- `avatars.js`: templates SVG dos avatares

Depois faça commit e deploy.

## Observações

- O jogo não expõe painel de edição para usuários finais.
- Preferências locais (jogadores/rodadas/mute/timer) ficam no `localStorage` do navegador.
