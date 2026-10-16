/**
 * MABOL — Members Refresh Concurrency Coordinator
 * Stage 3C.1.1: Members Refresh Concurrency Safety
 *
 * Guarantees:
 * 1. Only the latest request for the currently active community can mutate members state,
 *    data source ('server' | 'cache'), error message, loading status, or cache.
 * 2. Stale requests (older sequence number or mismatched community) are strictly ignored.
 * 3. Stale requests cannot terminate loading belonging to a newer request.
 * 4. Empty array [] from latest valid response is applied authoritatively as empty members list.
 * 5. If the latest request fails, existing member cache is preserved and error status is set.
 * 6. All non-member database tables (matches, cash transactions, etc.) remain untouched.
 */

import { Member } from '../types';
import { AppDatabase } from './storage';

export interface MembersRefreshState {
  db: AppDatabase;
  membersSource: 'server' | 'cache';
  membersError: string | null;
  isMembersLoading: boolean;
}

export type ConcurrencyEffectReason =
  | 'STALE_REQUEST'
  | 'COMMUNITY_MISMATCH'
  | 'APPLIED_SUCCESS'
  | 'APPLIED_CACHE_FALLBACK'
  | 'INVALID_FORMAT';

export interface RefreshResultEffect {
  applied: boolean;
  reason: ConcurrencyEffectReason;
}

export class MembersRefreshCoordinator {
  private latestRequestId: number = 0;
  private activeCommunityId: string;

  constructor(initialActiveCommunityId: string = 'comm-ck17') {
    this.activeCommunityId = initialActiveCommunityId;
  }

  public getActiveCommunityId(): string {
    return this.activeCommunityId;
  }

  public setActiveCommunityId(communityId: string): void {
    this.activeCommunityId = communityId;
  }

  public getLatestRequestId(): number {
    return this.latestRequestId;
  }

  /**
   * Starts a new refresh request tracking sequence.
   * Increments the request sequence and pairs it with the target community ID.
   */
  public startRequest(targetCommunityId?: string): { requestId: number; communityId: string } {
    this.latestRequestId += 1;
    const communityId = targetCommunityId || this.activeCommunityId;
    return {
      requestId: this.latestRequestId,
      communityId,
    };
  }

  /**
   * Validates whether a given request is still the latest request AND matches the active community.
   */
  public isRequestCurrent(requestId: number, communityId: string): boolean {
    return requestId === this.latestRequestId && communityId === this.activeCommunityId;
  }

  /**
   * Applies the server response to state only if the request is current and active.
   * If stale or community changed, discards response without modifying state.
   */
  public applyResponse(
    requestId: number,
    communityId: string,
    serverMembers: Member[] | unknown,
    currentState: MembersRefreshState
  ): { nextState: MembersRefreshState; effect: RefreshResultEffect } {
    if (requestId !== this.latestRequestId) {
      return {
        nextState: currentState,
        effect: { applied: false, reason: 'STALE_REQUEST' },
      };
    }

    if (communityId !== this.activeCommunityId) {
      return {
        nextState: currentState,
        effect: { applied: false, reason: 'COMMUNITY_MISMATCH' },
      };
    }

    if (Array.isArray(serverMembers)) {
      return {
        nextState: {
          ...currentState,
          db: {
            ...currentState.db,
            members: serverMembers as Member[],
          },
          membersSource: 'server',
          membersError: null,
          isMembersLoading: false,
        },
        effect: { applied: true, reason: 'APPLIED_SUCCESS' },
      };
    }

    // Invalid non-array response -> retain existing cache, update error & source
    return {
      nextState: {
        ...currentState,
        membersSource: 'cache',
        membersError: 'Format data anggota dari server tidak valid.',
        isMembersLoading: false,
      },
      effect: { applied: true, reason: 'INVALID_FORMAT' },
    };
  }

  /**
   * Handles request failure only if the request is current and active.
   * Preserves existing member cache and records error message.
   */
  public applyError(
    requestId: number,
    communityId: string,
    errorMessage: string,
    currentState: MembersRefreshState
  ): { nextState: MembersRefreshState; effect: RefreshResultEffect } {
    if (requestId !== this.latestRequestId) {
      return {
        nextState: currentState,
        effect: { applied: false, reason: 'STALE_REQUEST' },
      };
    }

    if (communityId !== this.activeCommunityId) {
      return {
        nextState: currentState,
        effect: { applied: false, reason: 'COMMUNITY_MISMATCH' },
      };
    }

    return {
      nextState: {
        ...currentState,
        membersSource: 'cache',
        membersError: errorMessage || 'Gagal menyinkronkan data anggota dengan server.',
        isMembersLoading: false,
      },
      effect: { applied: true, reason: 'APPLIED_CACHE_FALLBACK' },
    };
  }

  /**
   * Determines if loading state should be terminated by this request.
   * Returns false if a newer request has already superseded this one or community changed.
   */
  public shouldFinalizeLoading(requestId: number, communityId: string): boolean {
    return requestId === this.latestRequestId && communityId === this.activeCommunityId;
  }
}
