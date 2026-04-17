export const STORAGE_KEYS = {
  playerCount: "impostor.playerCount.v1",
  roundCount: "impostor.roundCount.v1",
  muted: "impostor.muted.v1",
  timedMode: "impostor.timedMode.v1",
};

export function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
