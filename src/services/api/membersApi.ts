/**
 * MABOL Member API Service
 * - Handles server-side CRUD for registered & manual community members
 * - Primary source of truth for community members
 * - Enforces zero-leak error reporting and explicit type mapping
 */

import { Member, CommunityRole } from '../../types';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from './apiClient';

export interface BackendMemberRow {
  id: string;
  communityId: string;
  accountId: string | null;
  nickname: string;
  fullName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  position: string | null;
  jerseyNumber: number | null;
  role: string;
  status: string;
  memberType: string;
  photoUrl: string | null;
  joinedAt: string;
}

export function mapBackendMemberToFrontend(row: BackendMemberRow): Member {
  const cleanPosition = (row.position || 'Gelandang') as Member['position'];
  const validPositions: Member['position'][] = ['Kiper', 'Bek', 'Gelandang', 'Penyerang', 'All-Rounder'];
  const position = validPositions.includes(cleanPosition) ? cleanPosition : 'Gelandang';

  return {
    id: row.id,
    communityId: row.communityId,
    userId: row.accountId || undefined,
    nickname: row.nickname,
    fullName: row.fullName || row.nickname,
    phone: row.phone || row.whatsapp || '',
    whatsapp: row.whatsapp || row.phone || '',
    email: row.email || undefined,
    photo: row.photoUrl || undefined,
    position,
    jerseyNumber: typeof row.jerseyNumber === 'number' ? row.jerseyNumber : 0,
    role: (row.role === 'admin' ? 'admin' : 'member') as CommunityRole,
    status: row.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
    memberType: row.memberType === 'MANUAL' ? 'MANUAL' : 'REGISTERED',
    joinedAt: row.joinedAt ? String(row.joinedAt).split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

export async function fetchMembersFromServer(
  communityId: string = 'comm-ck17',
  status?: string
): Promise<Member[]> {
  let url = `/api/members?communityId=${encodeURIComponent(communityId)}`;
  if (status && status.toLowerCase() !== 'all') {
    url += `&status=${encodeURIComponent(status)}`;
  }

  const rows = await apiGet<BackendMemberRow[]>(url);
  if (!Array.isArray(rows)) {
    throw new Error('Format data anggota dari server tidak valid (respons bukan array).');
  }
  return rows.map(mapBackendMemberToFrontend);
}

export async function createManualMemberOnServer(payload: {
  communityId?: string;
  name: string;
  whatsapp: string;
  email?: string;
  position?: Member['position'];
  jerseyNumber?: number;
  photo?: string;
}): Promise<Member> {
  const row = await apiPost<BackendMemberRow>('/api/members/manual', {
    communityId: payload.communityId || 'comm-ck17',
    name: payload.name.trim(),
    whatsapp: payload.whatsapp.trim(),
    email: payload.email?.trim() || undefined,
    position: payload.position || 'Gelandang',
    jerseyNumber: payload.jerseyNumber || 0,
    photo: payload.photo?.trim() || undefined,
  });

  return mapBackendMemberToFrontend(row);
}

export async function updateMemberOnServer(
  id: string,
  payload: {
    communityId?: string;
    nickname?: string;
    fullName?: string;
    whatsapp?: string;
    email?: string;
    position?: Member['position'];
    jerseyNumber?: number;
    photo?: string;
    status?: 'Aktif' | 'Nonaktif';
  }
): Promise<Member> {
  const row = await apiPut<BackendMemberRow>(`/api/members/${encodeURIComponent(id)}`, {
    communityId: payload.communityId || 'comm-ck17',
    nickname: payload.nickname?.trim(),
    fullName: payload.fullName?.trim() || payload.nickname?.trim(),
    whatsapp: payload.whatsapp?.trim(),
    email: payload.email?.trim() || undefined,
    position: payload.position,
    jerseyNumber: payload.jerseyNumber,
    photo: payload.photo?.trim() || undefined,
    status: payload.status,
  });

  return mapBackendMemberToFrontend(row);
}

export async function deleteMemberOnServer(
  id: string,
  communityId: string = 'comm-ck17'
): Promise<{ success: boolean; message: string; action?: 'deleted' | 'deactivated' }> {
  return apiDelete<{ success: boolean; message: string; action?: 'deleted' | 'deactivated' }>(
    `/api/members/${encodeURIComponent(id)}?communityId=${encodeURIComponent(communityId)}`
  );
}

export { ApiError };
