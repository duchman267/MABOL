import { MembershipRequest } from '../types';
import { getAuthToken } from './authService';

function mapBackendStatusToFrontend(
  status: string
): 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak' {
  if (status === 'approved' || status === 'Disetujui') return 'Disetujui';
  if (status === 'rejected' || status === 'Ditolak') return 'Ditolak';
  return 'Menunggu Persetujuan';
}

function mapFrontendStatusToBackend(
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak' | 'approved' | 'rejected' | 'pending'
): 'approved' | 'rejected' | 'pending' {
  if (status === 'Disetujui' || status === 'approved') return 'approved';
  if (status === 'Ditolak' || status === 'rejected') return 'rejected';
  return 'pending';
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchPendingMembershipRequestsCount(
  communityId: string = 'comm-ck17'
): Promise<number> {
  try {
    const res = await fetch(`/api/membership-requests/pending-count?communityId=${encodeURIComponent(communityId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.pendingCount === 'number' ? data.pendingCount : 0;
  } catch (err) {
    console.warn('[MembershipService] Error fetching pending count:', err);
    return 0;
  }
}

export async function fetchMembershipRequestsFromServer(
  communityId: string = 'comm-ck17',
  status?: string
): Promise<MembershipRequest[]> {
  try {
    let url = `/api/membership-requests?communityId=${encodeURIComponent(communityId)}`;
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data.requests)) {
      return [];
    }

    return data.requests.map((r: any) => ({
      id: r.id,
      communityId: r.communityId,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      notes: r.notes || undefined,
      position: r.position,
      jerseyNumber: r.jerseyNumber,
      status: mapBackendStatusToFrontend(r.status),
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt || undefined,
      reviewedBy: r.reviewedBy || undefined,
    }));
  } catch (err) {
    console.warn('[MembershipService] Error fetching requests from server:', err);
    return [];
  }
}

export async function submitMembershipRequestToServer(payload: {
  communityId?: string;
  position?: 'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder';
  jerseyNumber?: number;
  notes?: string;
}): Promise<MembershipRequest> {
  const res = await fetch('/api/membership-requests', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengirimkan pengajuan keanggotaan.');
  }

  const r = data.request;
  return {
    id: r.id,
    communityId: r.communityId,
    userId: r.userId,
    userName: r.userName,
    userEmail: r.userEmail,
    notes: r.notes || undefined,
    position: r.position,
    jerseyNumber: r.jerseyNumber,
    status: mapBackendStatusToFrontend(r.status),
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt || undefined,
    reviewedBy: r.reviewedBy || undefined,
  };
}

export async function reviewMembershipRequestOnServer(
  id: string,
  status: 'Disetujui' | 'Ditolak' | 'approved' | 'rejected',
  adminNotes?: string
): Promise<{ request: any; message: string }> {
  const backendStatus = mapFrontendStatusToBackend(status);
  const res = await fetch(`/api/membership-requests/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      status: backendStatus,
      adminNotes,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Gagal meninjau pengajuan keanggotaan.');
  }

  return data;
}
