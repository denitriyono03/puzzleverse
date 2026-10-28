// Remote API interfaces. The local implementation is real; the remote
// implementation is intentionally NotConfigured so no feature pretends
// to sync, authenticate, or rank on a server that does not exist.
import type { GameRecord } from '../games/types';
export interface LeaderboardEntry { rank: number; userId: string; name: string; score: number; game: string }
export interface RemoteApi {
  syncRecords(records: GameRecord[]): Promise<{ synced: number }>;
  fetchLeaderboard(): Promise<LeaderboardEntry[]>;
  verifyPurchase(receipt: string): Promise<boolean>;
}
export class NotConfiguredApi implements RemoteApi {
  private msg = 'Remote API is not configured. See docs/INCOMPLETE.md for the exact setup steps.';
  async syncRecords(): Promise<{ synced: number }> { throw new Error(this.msg); }
  async fetchLeaderboard(): Promise<LeaderboardEntry[]> { throw new Error(this.msg); }
  async verifyPurchase(): Promise<boolean> { throw new Error(this.msg); }
}
export const remoteApi: RemoteApi = new NotConfiguredApi();
export function localLeaderboard(history: GameRecord[], name: string): LeaderboardEntry[] {
  // Local leaderboard only, from real local history. No invented players.
  return [...history].filter((r) => r.completed).sort((a, b) => b.score - a.score).slice(0, 20)
    .map((r, i) => ({ rank: i + 1, userId: r.userId, name, score: r.score, game: r.game }));
}
