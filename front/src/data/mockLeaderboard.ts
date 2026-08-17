export interface LeaderboardEntry {
  name: string
  clicks: number
  isLocalPlayer?: boolean
}

/**
 * Placeholder data so the leaderboard has real content to render before
 * the backend + database exist. Replace with an API call once /back is wired up.
 */
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'ClickMaster9000', clicks: 184230 },
  { name: 'PixelPuma', clicks: 152104 },
  { name: 'NocturnoRayo', clicks: 138877 },
  { name: 'QuantumClicker', clicks: 121590 },
  { name: 'SombraVeloz', clicks: 98421 },
  { name: 'ZafiroHalcón', clicks: 87310 },
  { name: 'ClickenstEin', clicks: 76542 },
  { name: 'MidnightTap', clicks: 65890 },
  { name: 'ObsidianLobo', clicks: 54221 },
  { name: 'ByteBandit', clicks: 43109 },
]

export const MOCK_MONTHLY_WINNER = {
  name: 'ClickMaster9000',
  clicks: 2_384_119,
  month: 'julio',
}
