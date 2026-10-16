import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import {
  Community,
  User,
  UserProfile,
  CommunityMembership,
  Member,
  Match,
  MatchParticipant,
  PaymentRecord,
  MatchExpense,
  MatchAddOn,
  Sponsor,
  MatchSponsorship,
  CashTransaction,
  MatchProposal,
  MembershipRequest,
  JerseyProgram,
  JerseyOrder,
  PenaltyRecord,
  AppNotification,
  SupportAppreciation,
  RsvpStatus,
  AttendanceStatus,
  PaymentMethod,
  PaymentStatus,
} from '../types';
import { loadDatabase, saveDatabase, resetDatabaseToDefault, AppDatabase } from '../services/storage';
import { calculateMatchFinances, calculateCommunityBalance, getSupportAppreciationData, formatRupiah } from '../services/financialService';
import { ParsedWhatsAppItem } from '../utils/whatsappParser';
import {
  registerManual,
  loginManual,
  logoutManual,
  getCurrentSession,
  getUserProfileById,
  initializeAuth,
  fetchCurrentAuthFromServer,
} from '../services/authService';
import {
  fetchPendingMembershipRequestsCount,
  fetchMembershipRequestsFromServer,
  submitMembershipRequestToServer,
  reviewMembershipRequestOnServer,
} from '../services/membershipRequestService';
import {
  fetchMembersFromServer,
  createManualMemberOnServer,
  updateMemberOnServer,
  deleteMemberOnServer,
} from '../services/api/membersApi';
import { MembersRefreshCoordinator } from '../services/membersRefreshCoordinator';

interface AppContextType {
  // Manual Auth & User Profile
  authLoading: boolean;
  userProfile: UserProfile | null;
  userMemberships: CommunityMembership[];
  activeMembership: CommunityMembership | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    details?: {
      position?: 'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder';
      jerseyNumber?: number;
    }
  ) => Promise<void>;
  logout: () => void;
  joinCommunity: (communityId: string, role?: 'ADMIN' | 'MEMBER') => Promise<void>;
  pendingMembershipCount: number;
  refreshMembershipRequests: () => Promise<void>;
  refreshAuthSession: () => Promise<boolean>;
  isServerOnline: boolean;
  checkServerConnectivity: () => Promise<boolean>;

  // Komunitas & User
  communities: Community[];
  activeCommunity: Community;
  switchCommunity: (communityId: string) => void;
  createCommunity: (data: Omit<Community, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  users: User[];
  currentUser: User;
  currentMember: Member | undefined;
  isAdmin: boolean;
  switchUser: (userId: string) => void;
  members: Member[];
  createMember: (data: Omit<Member, 'id' | 'joinedAt'>) => void;
  createManualMember: (data: {
    name: string;
    whatsapp: string;
    email?: string;
    position?: Member['position'];
    jerseyNumber?: number;
    photo?: string;
  }) => Promise<Member>;
  updateManualMember: (id: string, data: Partial<Member>) => Promise<void>;
  deleteManualMember: (id: string) => Promise<{ success: boolean; message: string; action?: 'deleted' | 'deactivated' }>;
  refreshMembers: (targetCommunityId?: string) => Promise<void>;
  isMembersLoading: boolean;
  membersSource: 'server' | 'cache';
  membersError: string | null;

  // Pertandingan
  matches: Match[];
  createMatch: (data: Omit<Match, 'id' | 'createdAt' | 'cashSettled'>) => string;
  updateMatch: (id: string, data: Partial<Match>) => void;
  cancelMatch: (id: string) => void;
  completeMatch: (id: string) => void;

  // Partisipan & Kehadiran
  participants: MatchParticipant[];
  addMemberToMatch: (
    matchId: string,
    memberId: string,
    rsvpStatus?: RsvpStatus,
    attendanceStatus?: AttendanceStatus
  ) => void;
  rsvpMatch: (matchId: string, status: RsvpStatus) => { success: boolean; message: string };
  updateParticipantRsvp: (participantId: string, status: RsvpStatus) => void;
  updateAttendance: (participantId: string, status: AttendanceStatus) => void;
  addGuestParticipant: (
    matchId: string,
    guestName: string,
    guestPhone?: string,
    rsvpStatus?: RsvpStatus,
    attendanceStatus?: AttendanceStatus,
    paymentDetails?: {
      amount: number;
      method: PaymentMethod;
      status: PaymentStatus;
    }
  ) => void;
  convertGuestToMember: (
    participantId: string,
    guestName: string,
    email: string,
    phone: string,
    position: Member['position'],
    jerseyNumber: number
  ) => void;
  importWhatsAppParticipants: (matchId: string, items: ParsedWhatsAppItem[]) => void;

  // Pembayaran
  payments: PaymentRecord[];
  recordPayment: (
    matchId: string,
    participantId: string,
    amount: number,
    method: PaymentMethod,
    status: PaymentStatus,
    notes?: string
  ) => void;

  // Modul Support of the Match
  supportModal: { isOpen: boolean; data: SupportAppreciation | null };
  closeSupportModal: () => void;

  // Finansial & Kas Komunitas
  expenses: MatchExpense[];
  addExpense: (data: Omit<MatchExpense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addOns: MatchAddOn[];
  addAddOn: (data: Omit<MatchAddOn, 'id'>) => void;
  deleteAddOn: (id: string) => void;
  sponsors: Sponsor[];
  addSponsor: (data: Omit<Sponsor, 'id' | 'createdAt'>) => void;
  matchSponsorships: MatchSponsorship[];
  addMatchSponsorship: (data: Omit<MatchSponsorship, 'id'>) => void;
  cashTransactions: CashTransaction[];
  addCashTransaction: (data: Omit<CashTransaction, 'id'>) => void;
  communityCashBalance: number;

  // Pengajuan Pertandingan & Keanggotaan
  proposals: MatchProposal[];
  submitProposal: (data: Omit<MatchProposal, 'id' | 'createdAt' | 'status' | 'communityId'>) => void;
  reviewProposal: (proposalId: string, status: 'Disetujui' | 'Ditolak', adminNotes?: string) => void;
  membershipRequests: MembershipRequest[];
  requestJoinCommunity: (
    communityId: string,
    notes?: string,
    position?: 'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder',
    jerseyNumber?: number
  ) => Promise<void>;
  reviewMembershipRequest: (
    requestId: string,
    status: 'Disetujui' | 'Ditolak',
    adminNotes?: string
  ) => Promise<void>;

  // Jersey
  jerseyPrograms: JerseyProgram[];
  jerseyOrders: JerseyOrder[];
  createJerseyOrder: (data: Omit<JerseyOrder, 'id' | 'orderedAt'>) => void;
  updateJerseyOrderStatus: (id: string, paymentStatus: JerseyOrder['paymentStatus'], paidAmount: number) => void;

  // Game Penalti
  penaltyRecords: PenaltyRecord[];
  savePenaltyScore: (score: number, goals: number, saves: number, attempts: number, highestStreak: number) => void;

  // Notifikasi
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;

  // Reset demo data
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [supportModal, setSupportModal] = useState<{ isOpen: boolean; data: SupportAppreciation | null }>({
    isOpen: false,
    data: null,
  });

  // Manual Auth States
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pendingMembershipCount, setPendingMembershipCount] = useState<number>(0);
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [isMembersLoading, setIsMembersLoading] = useState<boolean>(false);
  const [membersSource, setMembersSource] = useState<'server' | 'cache'>('cache');
  const [membersError, setMembersError] = useState<string | null>(null);

  // Concurrency Coordinator for Members Refresh (Stage 3C.1.1)
  const membersCoordinatorRef = useRef<MembersRefreshCoordinator>(
    new MembersRefreshCoordinator('comm-ck17')
  );

  // Probe server connectivity safely without excessive polling
  const checkServerConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const reachable = res.ok;
      setIsServerOnline(reachable);
      return reachable;
    } catch {
      setIsServerOnline(false);
      return false;
    }
  };

  useEffect(() => {
    checkServerConnectivity();
    const handleOnline = () => {
      checkServerConnectivity();
    };
    const handleOffline = () => {
      setIsServerOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Community Memberships (Source of truth for user community roles)
  const [memberships, setMemberships] = useState<CommunityMembership[]>(() => {
    const adminMembership: CommunityMembership = {
      uid: 'usr-admin-dicky',
      userId: 'usr-admin-dicky',
      communityId: 'comm-ck17',
      role: 'ADMIN',
      status: 'AKTIF',
      displayName: 'Dicky Maulana',
      position: 'Gelandang',
      jerseyNumber: 17,
      joinedAt: '2026-01-01',
    };

    const demoKeywords = [
      'epul',
      'xherdan',
      'ghaisan',
      'abah',
      'kazeo',
      'ari',
      'haikal',
    ];

    try {
      const raw = localStorage.getItem('mabol_memberships_v1');
      if (raw) {
        const parsed: CommunityMembership[] = JSON.parse(raw);
        // Hapus keanggotaan demo yang tidak diinginkan
        const cleaned = parsed.filter((m) => {
          const name = (m.displayName || '').toLowerCase();
          const uid = (m.uid || m.userId || '').toLowerCase();
          const isDemo = demoKeywords.some((k) => name.includes(k) || uid.includes(k));
          return !isDemo;
        });

        // Pastikan akun Dicky Maulana memiliki role ADMIN di Cornerkick17
        const adminFound = cleaned.find(
          (m) =>
            (m.uid === 'usr-admin-dicky' || m.userId === 'usr-admin-dicky') &&
            m.communityId === 'comm-ck17'
        );

        if (adminFound) {
          adminFound.role = 'ADMIN';
          adminFound.displayName = 'Dicky Maulana';
          adminFound.status = 'AKTIF';
          return cleaned;
        } else {
          return [adminMembership, ...cleaned];
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Seed default: Akun admin Dicky Maulana adalah ADMIN di Cornerkick17
    return [adminMembership];
  });

  // Simpan otomatis memberships ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mabol_memberships_v1', JSON.stringify(memberships));
    } catch (e) {
      console.error(e);
    }
  }, [memberships]);

  // Fungsi pemeriksaan sesi dan verifikasi membership terpusat dari server
  const refreshAuthSession = async (): Promise<boolean> => {
    try {
      const serverAuth = await fetchCurrentAuthFromServer();
      if (serverAuth !== undefined) {
        if (serverAuth && serverAuth.user && serverAuth.user.status === 'ACTIVE') {
          setUserProfile(serverAuth.user);
          if (serverAuth.memberships && serverAuth.memberships.length > 0) {
            const mapped = serverAuth.memberships.map((m: any) => ({
              uid: m.userId,
              userId: m.userId,
              communityId: m.communityId,
              role: m.role,
              status: m.status,
              displayName: m.displayName,
              position: m.position,
              jerseyNumber: m.jerseyNumber,
              joinedAt: m.joinedAt,
            }));
            setMemberships((prev) => {
              const other = prev.filter(
                (m) => m.userId !== serverAuth.user.id && m.uid !== serverAuth.user.id
              );
              return [...other, ...mapped];
            });
            return mapped.some((m: any) => m.communityId === 'comm-ck17' && m.status === 'AKTIF');
          } else {
            // Jika server mengembalikan memberships kosong, bersihkan keanggotaan lokal untuk user ini
            setMemberships((prev) =>
              prev.filter((m) => m.userId !== serverAuth.user.id && m.uid !== serverAuth.user.id)
            );
            return false;
          }
        } else {
          logoutManual();
          setUserProfile(null);
          setMemberships([]);
          return false;
        }
      }
      return false;
    } catch (err) {
      console.warn('[AppContext] Error refreshing auth session:', err);
      return false;
    }
  };

  // Cek sesi login saat mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await initializeAuth();
        const session = getCurrentSession();
        if (session && session.userId) {
          const hasActiveMembership = await refreshAuthSession();
          if (!hasActiveMembership) {
            // Sesi ada namun user belum/tidak memiliki membership aktif di server
          }
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
        logoutManual();
        setUserProfile(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Simpan otomatis database MABOL
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  // Komunitas Aktif
  const activeCommunity = useMemo(() => {
    return (
      db.communities.find((c) => c.id === db.activeCommunityId) ||
      db.communities[0] || {
        id: 'comm-ck17',
        name: 'Cornerkick17 OLAHGAYA',
        description: 'Komunitas Sepak Bola',
        primaryColor: '#1261FF',
        status: 'Aktif',
        createdAt: new Date().toISOString(),
      }
    );
  }, [db.communities, db.activeCommunityId]);

  // Memberships milik user yang sedang login
  const userMemberships = useMemo(() => {
    if (!userProfile) return [];
    return memberships.filter(
      (m) => m.uid === userProfile.id || m.userId === userProfile.id
    );
  }, [memberships, userProfile]);

  // Membership di komunitas aktif
  const activeMembership = useMemo(() => {
    if (!userProfile) return null;
    return userMemberships.find((m) => m.communityId === activeCommunity.id) || null;
  }, [userProfile, userMemberships, activeCommunity.id]);

  // Current User (hanya terisi jika ada userProfile / sesi login yang valid)
  const currentUser: User = useMemo(() => {
    if (userProfile) {
      const dbUser = db.users.find((u) => u.id === userProfile.id || u.email === userProfile.email);
      return {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        phone: dbUser?.phone || '',
        photo: userProfile.photoURL,
        status: (userProfile.status === 'ACTIVE' ? 'Aktif' : userProfile.status) as 'Aktif' | 'Nonaktif',
        createdAt: userProfile.createdAt,
      };
    }
    // Sesi tidak ada/unauthenticated: jangan pernah jadikan Dicky atau demo user sebagai currentUser
    return {
      id: '',
      name: '',
      email: '',
      phone: '',
      status: 'Nonaktif',
      createdAt: '',
    };
  }, [userProfile, db.users]);

  // Current Member in Active Community
  const currentMember = useMemo(() => {
    if (!userProfile) return undefined;
    return db.members.find(
      (m) =>
        m.communityId === activeCommunity.id &&
        (m.userId === userProfile.id || m.userId === currentUser.id)
    );
  }, [db.members, activeCommunity.id, currentUser.id, userProfile]);

  // ADMIN AUTHORIZATION:
  // Role ADMIN wajib bersumber dari membership komunitas terverifikasi server/database
  const isAdmin = useMemo(() => {
    if (!userProfile) return false;
    // Otoritas admin murni bersumber dari activeMembership terverifikasi
    return Boolean(
      activeMembership &&
      activeMembership.role === 'ADMIN' &&
      activeMembership.status === 'AKTIF'
    );
  }, [userProfile, activeMembership]);

  // Saldo Kas Komunitas aktif dari Ledger (Source of truth)
  const communityCashBalance = useMemo(() => {
    return calculateCommunityBalance(db.cashTransactions, activeCommunity.id).balance;
  }, [db.cashTransactions, activeCommunity.id]);

  // Actions Komunitas
  const switchCommunity = (communityId: string) => {
    membersCoordinatorRef.current.setActiveCommunityId(communityId);
    setDb((prev) => ({ ...prev, activeCommunityId: communityId }));
  };

  const joinCommunity = async (communityId: string = 'comm-ck17') => {
    if (!userProfile) return;
    // Pendaftaran komunitas wajib melalui alur pengajuan resmi ke server
    await submitMembershipRequestToServer({
      communityId,
      notes: 'Pengajuan bergabung ke komunitas',
    });
    await refreshMembershipRequests();
  };

  const createCommunity = async (_data: Omit<Community, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    // Pencegahan privilege escalation: pembuatan komunitas baru tidak diizinkan.
    throw new Error('Pembuatan komunitas baru dibatasi. Komunitas resmi MABOL adalah Cornerkick17 OLAHGAYA.');
  };

  // Keep coordinator active community in sync with activeCommunity
  useEffect(() => {
    membersCoordinatorRef.current.setActiveCommunityId(activeCommunity.id);
  }, [activeCommunity.id]);

  // Auth Actions
  const refreshMembershipRequests = async () => {
    try {
      const commId = activeCommunity?.id || 'comm-ck17';
      const count = await fetchPendingMembershipRequestsCount(commId);
      setPendingMembershipCount(count);

      const serverReqs = await fetchMembershipRequestsFromServer(commId);
      if (serverReqs && serverReqs.length > 0) {
        setDb((prev) => {
          const serverIds = new Set(serverReqs.map((r) => r.id));
          const localRemaining = (prev.membershipRequests || []).filter((r) => !serverIds.has(r.id));
          return {
            ...prev,
            membershipRequests: [...serverReqs, ...localRemaining],
          };
        });
      }
    } catch (err) {
      console.warn('[AppContext] Failed to refresh membership requests:', err);
    }
  };

  const refreshMembers = async (targetCommunityId?: string) => {
    const coordinator = membersCoordinatorRef.current;
    if (targetCommunityId && targetCommunityId !== coordinator.getActiveCommunityId()) {
      coordinator.setActiveCommunityId(targetCommunityId);
    }
    const { requestId, communityId } = coordinator.startRequest(targetCommunityId);

    setIsMembersLoading(true);
    setMembersError(null);

    try {
      const serverMembers = await fetchMembersFromServer(communityId);

      // Concurrency check before applying state:
      if (!coordinator.isRequestCurrent(requestId, communityId)) {
        return;
      }

      if (Array.isArray(serverMembers)) {
        setDb((prev) => {
          // Double-check activeCommunityId inside state updater
          if (prev.activeCommunityId && prev.activeCommunityId !== communityId) {
            return prev;
          }
          const updated = { ...prev, members: serverMembers };
          saveDatabase(updated);
          return updated;
        });
        setMembersSource('server');
        setMembersError(null);
      } else {
        setMembersSource('cache');
        setMembersError('Format data anggota dari server tidak valid.');
      }
    } catch (err: any) {
      if (!coordinator.isRequestCurrent(requestId, communityId)) {
        return;
      }
      console.warn('[AppContext] Failed to refresh members from server:', err);
      setMembersSource('cache');
      setMembersError(err.message || 'Gagal menyinkronkan data anggota dengan server.');
    } finally {
      // Stale requests must NOT terminate or clear loading belonging to newer requests
      if (coordinator.shouldFinalizeLoading(requestId, communityId)) {
        setIsMembersLoading(false);
      }
    }
  };

  useEffect(() => {
    if (userProfile) {
      refreshMembershipRequests();
    }
    refreshMembers();
  }, [userProfile?.id, activeCommunity.id]);

  const login = async (email: string, pass: string) => {
    const res = await loginManual(email, pass);
    setUserProfile(res);
    if (res.memberships && res.memberships.length > 0) {
      setMemberships((prev) => {
        const other = prev.filter((m) => m.userId !== res.id && m.uid !== res.id);
        const mapped = res.memberships!.map((m: any) => ({
          uid: m.userId,
          userId: m.userId,
          communityId: m.communityId,
          role: m.role,
          status: m.status,
          displayName: m.displayName,
          position: m.position,
          jerseyNumber: m.jerseyNumber,
          joinedAt: m.joinedAt,
        }));
        return [...other, ...mapped];
      });
    } else {
      // Pastikan akun tanpa keanggotaan aktif bersih dari membership rogue/lokal
      setMemberships((prev) => prev.filter((m) => m.userId !== res.id && m.uid !== res.id));
    }
    await refreshMembershipRequests();
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    details?: {
      position?: 'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder';
      jerseyNumber?: number;
    }
  ) => {
    const res = await registerManual(name, email, pass);
    setUserProfile(res);
    // User baru belum disetujui admin, bersihkan keanggotaan aktif
    setMemberships((prev) => prev.filter((m) => m.userId !== res.id && m.uid !== res.id));

    // Otomatis ajukan bergabung ke Cornerkick17 OLAHGAYA (comm-ck17) sebagai komunitas default
    try {
      const serverReq = await submitMembershipRequestToServer({
        communityId: 'comm-ck17',
        position: details?.position || 'Gelandang',
        jerseyNumber: details?.jerseyNumber || 10,
        notes: 'Pendaftaran anggota baru',
      });
      if (serverReq) {
        setDb((prev) => ({
          ...prev,
          membershipRequests: [
            serverReq,
            ...(prev.membershipRequests || []).filter((r) => r.id !== serverReq.id),
          ],
        }));
      }
    } catch (reqErr: any) {
      console.warn('[AppContext] Info pengajuan keanggotaan otomatis:', reqErr?.message || reqErr);
    }

    await refreshMembershipRequests();
  };

  const logout = () => {
    logoutManual();
    setUserProfile(null);
    setPendingMembershipCount(0);
  };

  // Switch User (Demo & Auth)
  const switchUser = (userId: string) => {
    setDb((prev) => ({ ...prev, currentUserId: userId }));
  };

  const createMember = (data: Omit<Member, 'id' | 'joinedAt'>) => {
    const newMember: Member = {
      ...data,
      id: `mem-${Date.now()}`,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setDb((prev) => ({ ...prev, members: [...prev.members, newMember] }));
  };

  // TAMBAH ANGGOTA MANUAL OLEH ADMIN (Khusus bapak-bapak/anggota tanpa akun MABOL)
  const createManualMember = async (data: {
    name: string;
    whatsapp: string;
    email?: string;
    position?: Member['position'];
    jerseyNumber?: number;
    photo?: string;
  }): Promise<Member> => {
    if (!isAdmin) {
      throw new Error('Hanya Admin yang berwenang menambah anggota manual.');
    }
    const cleanName = data.name.trim();
    const cleanWhatsapp = data.whatsapp.trim();
    if (!cleanName) {
      throw new Error('Nama lengkap wajib diisi.');
    }
    if (!cleanWhatsapp) {
      throw new Error('Nomor WhatsApp wajib diisi.');
    }

    // Call server FIRST (Pessimistic UI - server is source of truth)
    const newMember = await createManualMemberOnServer({
      communityId: activeCommunity.id,
      name: cleanName,
      whatsapp: cleanWhatsapp,
      email: data.email?.trim() || undefined,
      position: data.position || 'Gelandang',
      jerseyNumber: data.jerseyNumber || 0,
      photo: data.photo?.trim() || undefined,
    });

    const newMembership: CommunityMembership = {
      uid: newMember.id,
      userId: newMember.id,
      communityId: activeCommunity.id,
      role: 'MEMBER',
      status: 'AKTIF',
      displayName: cleanName,
      photoURL: data.photo?.trim() || undefined,
      position: data.position || 'Gelandang',
      jerseyNumber: data.jerseyNumber || 0,
      memberType: 'MANUAL',
      joinedAt: newMember.joinedAt,
    };

    // Update state & cache only AFTER server confirms
    setDb((prev) => {
      const updatedMembers = [...prev.members.filter((m) => m.id !== newMember.id), newMember];
      const updatedDb = {
        ...prev,
        members: updatedMembers,
      };
      saveDatabase(updatedDb);
      return updatedDb;
    });

    setMemberships((prev) => [...prev.filter((m) => m.uid !== newMember.id), newMembership]);

    return newMember;
  };

  // EDIT ANGGOTA MANUAL OLEH ADMIN
  const updateManualMember = async (id: string, data: Partial<Member>): Promise<void> => {
    if (!isAdmin) {
      throw new Error('Hanya Admin yang berwenang mengubah data anggota.');
    }

    // Call server FIRST
    const updatedMember = await updateMemberOnServer(id, {
      communityId: activeCommunity.id,
      nickname: data.nickname,
      fullName: data.fullName,
      whatsapp: data.whatsapp || data.phone,
      email: data.email,
      position: data.position,
      jerseyNumber: data.jerseyNumber,
      photo: data.photo,
      status: data.status,
    });

    // Update state & cache after server confirms
    setDb((prev) => {
      const updatedMembers = prev.members.map((m) =>
        m.id === id || (m.userId && m.userId === id) ? updatedMember : m
      );
      const updatedDb = { ...prev, members: updatedMembers };
      saveDatabase(updatedDb);
      return updatedDb;
    });

    // Sinkronkan ke memberships
    setMemberships((prevM) =>
      prevM.map((m) =>
        (m.userId === updatedMember.userId || m.uid === updatedMember.id) && m.communityId === updatedMember.communityId
          ? {
              ...m,
              displayName: updatedMember.nickname,
              position: updatedMember.position,
              jerseyNumber: updatedMember.jerseyNumber,
              photoURL: updatedMember.photo || m.photoURL,
              status: updatedMember.status === 'Aktif' ? 'AKTIF' : 'NONAKTIF',
            }
          : m
      )
    );
  };

  // HAPUS ANGGOTA OLEH ADMIN
  const deleteManualMember = async (
    id: string
  ): Promise<{ success: boolean; message: string; action?: 'deleted' | 'deactivated' }> => {
    if (!isAdmin) {
      throw new Error('Hanya Admin yang berwenang menghapus anggota.');
    }
    if (id === 'mem-admin' || id === 'usr-admin-dicky') {
      throw new Error('Akun Admin utama tidak dapat dihapus.');
    }

    // Resolve target member in local state to extract both member ID and user/account ID
    const targetMember = db.members.find((m) => m.id === id || m.userId === id);
    const targetUserId = targetMember?.userId;
    const targetMemberId = targetMember?.id || id;

    if (
      targetMember?.role === 'admin' &&
      (targetUserId === 'usr-admin-dicky' || targetMember.email === 'dickymaulanazayn@gmail.com')
    ) {
      throw new Error('Akun Admin utama tidak dapat dihapus.');
    }

    // Call server FIRST (pessimistic: if network or server fails, it throws here and local state is untouched)
    const result = await deleteMemberOnServer(id, activeCommunity.id);

    // Refresh state authoritatively from server
    await refreshMembers();

    if (result.action === 'deactivated') {
      // Backend soft-deactivated member due to historical records
      setDb((prev) => {
        const updatedMembers = prev.members.map((m) =>
          m.id === targetMemberId || (targetUserId && m.userId === targetUserId)
            ? { ...m, status: 'Nonaktif' as const }
            : m
        );
        const updatedDb = { ...prev, members: updatedMembers };
        saveDatabase(updatedDb);
        return updatedDb;
      });

      setMemberships((prevM) =>
        prevM.map((m) =>
          ((targetUserId && m.userId === targetUserId) ||
            m.userId === id ||
            m.uid === id ||
            m.uid === targetMemberId) &&
          m.communityId === activeCommunity.id
            ? { ...m, status: 'NONAKTIF' as const }
            : m
        )
      );
    } else {
      // Backend permanently deleted member
      setDb((prev) => {
        const updatedMembers = prev.members.filter(
          (m) =>
            m.id !== targetMemberId &&
            (!targetUserId || m.userId !== targetUserId) &&
            m.id !== id &&
            m.userId !== id
        );
        const updatedDb = { ...prev, members: updatedMembers };
        saveDatabase(updatedDb);
        return updatedDb;
      });

      setMemberships((prevM) =>
        prevM.filter(
          (m) =>
            !(
              ((targetUserId && m.userId === targetUserId) ||
                m.userId === id ||
                m.uid === id ||
                m.uid === targetMemberId) &&
              m.communityId === activeCommunity.id
            )
        )
      );
    }

    return result;
  };

  // Match Actions
  const createMatch = (data: Omit<Match, 'id' | 'createdAt' | 'cashSettled'>): string => {
    const newMatchId = `match-${Date.now()}`;
    const newMatch: Match = {
      ...data,
      id: newMatchId,
      createdAt: new Date().toISOString(),
      cashSettled: false,
    };
    setDb((prev) => ({
      ...prev,
      matches: [newMatch, ...prev.matches],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          communityId: data.communityId,
          title: 'Pertandingan Baru Dijadwalkan ⚽',
          message: `${data.title} dijadwalkan pada ${data.date} di ${data.venue}. Yuk daftar sekarang!`,
          type: 'match',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
    return newMatchId;
  };

  const updateMatch = (id: string, data: Partial<Match>) => {
    setDb((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }));
  };

  const cancelMatch = (id: string) => {
    setDb((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => (m.id === id ? { ...m, status: 'Dibatalkan' } : m)),
    }));
  };

  // Complete match: calculates net result and auto-transfers surplus to community cash (Section 22)
  const completeMatch = (id: string) => {
    setDb((prev) => {
      const match = prev.matches.find((m) => m.id === id);
      if (!match || match.cashSettled) {
        return {
          ...prev,
          matches: prev.matches.map((m) => (m.id === id ? { ...m, status: 'Selesai' } : m)),
        };
      }

      // Hitung finansial match
      const summary = calculateMatchFinances(
        match,
        prev.payments,
        prev.expenses,
        prev.addOns,
        prev.matchSponsorships
      );

      const newTransactions = [...prev.cashTransactions];
      // Jika ada surplus, otomatis catat ke buku kas komunitas
      if (summary.isSurplus && summary.surplusAmount > 0) {
        newTransactions.push({
          id: `trx-surplus-${match.id}`,
          communityId: match.communityId,
          type: 'Pemasukan',
          category: 'Match',
          amount: summary.surplusAmount,
          matchId: match.id,
          description: `Surplus Pertandingan: ${match.title}`,
          date: new Date().toISOString(),
          createdBy: 'Sistem Kas Otomatis',
        });
      }

      return {
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === id ? { ...m, status: 'Selesai', cashSettled: true } : m
        ),
        cashTransactions: newTransactions,
      };
    });
  };

  // RSVP Match
  const rsvpMatch = (matchId: string, status: RsvpStatus): { success: boolean; message: string } => {
    if (!currentMember) {
      return { success: false, message: 'Anda harus terdaftar sebagai anggota komunitas ini.' };
    }

    const match = db.matches.find((m) => m.id === matchId);
    if (!match) return { success: false, message: 'Pertandingan tidak ditemukan.' };

    if (match.status !== 'Aktif') {
      return { success: false, message: 'Pertandingan tidak aktif untuk pendaftaran.' };
    }

    // Cek cancellation deadline jika member ingin membatalkan
    if (status === 'Batal' && !isAdmin) {
      const deadline = new Date(match.cancellationDeadline).getTime();
      const now = Date.now();
      if (now > deadline) {
        return {
          success: false,
          message: 'Batas pembatalan telah lewat. Hubungi admin untuk perubahan darurat.',
        };
      }
    }

    setDb((prev) => {
      const existingIdx = prev.participants.findIndex(
        (p) => p.matchId === matchId && p.memberId === currentMember.id
      );

      const updatedParticipants = [...prev.participants];

      if (existingIdx >= 0) {
        const existing = updatedParticipants[existingIdx];
        updatedParticipants[existingIdx] = {
          ...existing,
          rsvpStatus: status,
          attendanceStatus: status === 'Ikut' ? 'Belum Dicek' : 'Tidak Hadir',
        };
      } else {
        // Tambahkan baru
        const newPart: MatchParticipant = {
          id: `part-${Date.now()}`,
          matchId,
          memberId: currentMember.id,
          participantType: 'Anggota',
          rsvpStatus: status,
          attendanceStatus: status === 'Ikut' ? 'Belum Dicek' : 'Tidak Hadir',
          createdAt: new Date().toISOString(),
        };
        updatedParticipants.push(newPart);

        // Buat record payment awal status Belum Bayar jika Ikut
        if (status === 'Ikut') {
          const newPay: PaymentRecord = {
            id: `pay-${Date.now()}`,
            matchId,
            participantId: newPart.id,
            standardFee: match.standardFee,
            amount: 0,
            extraContribution: 0,
            method: 'Tunai',
            status: 'Belum Bayar',
            paidAt: '',
            recordedBy: currentMember.nickname,
          };
          return {
            ...prev,
            participants: updatedParticipants,
            payments: [...prev.payments, newPay],
          };
        }
      }

      return {
        ...prev,
        participants: updatedParticipants,
      };
    });

    return {
      success: true,
      message: status === 'Ikut' ? 'Berhasil bergabung pertandingan! ⚽' : 'Status berhasil diubah menjadi batal.',
    };
  };

  // TAMBAH ANGGOTA (TERMASUK MANUAL MEMBER) KE PERTANDINGAN OLEH ADMIN
  const addMemberToMatch = (
    matchId: string,
    memberId: string,
    rsvpStatus: RsvpStatus = 'Ikut',
    attendanceStatus: AttendanceStatus = 'Belum Dicek'
  ) => {
    const match = db.matches.find((m) => m.id === matchId);
    const targetMember = db.members.find((m) => m.id === memberId);
    if (!match || !targetMember) return;

    setDb((prev) => {
      const existingIdx = prev.participants.findIndex(
        (p) => p.matchId === matchId && p.memberId === memberId
      );

      const updatedParticipants = [...prev.participants];

      if (existingIdx >= 0) {
        updatedParticipants[existingIdx] = {
          ...updatedParticipants[existingIdx],
          rsvpStatus,
          attendanceStatus: rsvpStatus === 'Ikut' ? attendanceStatus : 'Tidak Hadir',
        };
        return { ...prev, participants: updatedParticipants };
      }

      const newPartId = `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newPart: MatchParticipant = {
        id: newPartId,
        matchId,
        memberId,
        participantType: 'Anggota',
        rsvpStatus,
        attendanceStatus: rsvpStatus === 'Ikut' ? attendanceStatus : 'Tidak Hadir',
        createdAt: new Date().toISOString(),
      };

      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        matchId,
        participantId: newPartId,
        standardFee: match.standardFee,
        amount: 0,
        extraContribution: 0,
        method: 'Tunai',
        status: 'Belum Bayar',
        paidAt: '',
        recordedBy: currentUser.name,
      };

      return {
        ...prev,
        participants: [...prev.participants, newPart],
        payments: [...prev.payments, newPayment],
      };
    });
  };

  // Update Kehadiran Aktual
  const updateAttendance = (participantId: string, status: AttendanceStatus) => {
    setDb((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === participantId ? { ...p, attendanceStatus: status } : p
      ),
    }));
  };

  // Tambah Guest Participant
  const addGuestParticipant = (
    matchId: string,
    guestName: string,
    guestPhone?: string,
    rsvpStatus: RsvpStatus = 'Ikut',
    attendanceStatus: AttendanceStatus = 'Hadir',
    paymentDetails?: {
      amount: number;
      method: PaymentMethod;
      status: PaymentStatus;
    }
  ) => {
    const match = db.matches.find((m) => m.id === matchId);
    const standardFee = match ? match.standardFee : 35000;

    const newPartId = `part-guest-${Date.now()}`;
    const newParticipant: MatchParticipant = {
      id: newPartId,
      matchId,
      participantType: 'Guest',
      guestName,
      guestPhone,
      rsvpStatus,
      attendanceStatus,
      createdAt: new Date().toISOString(),
    };

    const payAmount = paymentDetails ? paymentDetails.amount : 0;
    const payMethod = paymentDetails ? paymentDetails.method : 'Tunai';
    const payStatus = paymentDetails ? paymentDetails.status : 'Belum Bayar';
    const extraContribution = Math.max(0, payAmount - standardFee);

    const newPayment: PaymentRecord = {
      id: `pay-guest-${Date.now()}`,
      matchId,
      participantId: newPartId,
      standardFee,
      amount: payAmount,
      extraContribution,
      method: payMethod,
      status: payStatus,
      paidAt: payStatus === 'Sudah Bayar' || payStatus === 'Bayar Sebagian' ? new Date().toISOString() : '',
      recordedBy: currentUser.name,
    };

    let updatedTransactions = [...db.cashTransactions];
    if ((payStatus === 'Sudah Bayar' || payStatus === 'Bayar Sebagian') && payAmount > 0) {
      updatedTransactions.unshift({
        id: `trx-pay-${Date.now()}`,
        communityId: match?.communityId || activeCommunity.id,
        type: 'Pemasukan',
        category: 'Match',
        amount: payAmount,
        matchId,
        sourceId: newPartId,
        description: `Pembayaran HTM: ${guestName} (Guest)${extraContribution > 0 ? ` (+Kontribusi ${formatRupiah(extraContribution)})` : ''}`,
        date: new Date().toISOString(),
        createdBy: currentUser.name,
      });
    }

    setDb((prev) => ({
      ...prev,
      participants: [...prev.participants, newParticipant],
      payments: [...prev.payments, newPayment],
      cashTransactions: updatedTransactions,
    }));
  };

  // Update RSVP Partisipan oleh Admin (Pembatalan admin atau aktivasi kembali)
  // Aturan mutlak: Pembatalan TIDAK menghapus histori pembayaran dan TIDAK melakukan refund otomatis
  const updateParticipantRsvp = (participantId: string, status: RsvpStatus) => {
    setDb((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === participantId
          ? {
              ...p,
              rsvpStatus: status,
              attendanceStatus: status === 'Batal' ? 'Tidak Hadir' : p.attendanceStatus,
            }
          : p
      ),
    }));
  };

  // Convert Guest to Registered Member (Section 10)
  const convertGuestToMember = (
    participantId: string,
    guestName: string,
    email: string,
    phone: string,
    position: Member['position'],
    jerseyNumber: number
  ) => {
    const newUserId = `user-${Date.now()}`;
    const newMemberId = `mem-${Date.now()}`;

    const newUser: User = {
      id: newUserId,
      name: guestName,
      email,
      phone,
      status: 'Aktif',
      createdAt: new Date().toISOString(),
    };

    const newMember: Member = {
      id: newMemberId,
      communityId: activeCommunity.id,
      userId: newUserId,
      nickname: guestName,
      position,
      jerseyNumber,
      role: 'member',
      status: 'Aktif',
      joinedAt: new Date().toISOString().split('T')[0],
    };

    setDb((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      members: [...prev.members, newMember],
      participants: prev.participants.map((p) =>
        p.id === participantId
          ? {
              ...p,
              participantType: 'Anggota',
              memberId: newMemberId,
              guestName: undefined,
              guestPhone: undefined,
            }
          : p
      ),
    }));
  };

  // WhatsApp Batch Import
  const importWhatsAppParticipants = (matchId: string, items: ParsedWhatsAppItem[]) => {
    const match = db.matches.find((m) => m.id === matchId);
    const standardFee = match ? match.standardFee : 35000;

    setDb((prev) => {
      const newParticipants = [...prev.participants];
      const newPayments = [...prev.payments];

      for (const item of items) {
        // Cek apakah partisipan ini sudah ada di match
        let existingPart = newParticipants.find((p) => {
          if (p.matchId !== matchId) return false;
          if (item.matchedMemberId && p.memberId === item.matchedMemberId) return true;
          if (item.isGuest && p.guestName?.toLowerCase() === item.name.toLowerCase()) return true;
          return false;
        });

        const partId = existingPart ? existingPart.id : `part-wa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        if (existingPart) {
          // Update status
          existingPart.attendanceStatus = item.attendanceStatus;
          existingPart.rsvpStatus = item.rsvpStatus;
        } else {
          // Insert baru
          const newPart: MatchParticipant = {
            id: partId,
            matchId,
            memberId: item.matchedMemberId,
            participantType: item.isGuest ? 'Guest' : 'Anggota',
            guestName: item.isGuest ? item.name : undefined,
            rsvpStatus: item.rsvpStatus,
            attendanceStatus: item.attendanceStatus,
            createdAt: new Date().toISOString(),
          };
          newParticipants.push(newPart);
        }

        // Cek payment
        const existingPayIdx = newPayments.findIndex(
          (pay) => pay.matchId === matchId && pay.participantId === partId
        );

        const paymentAmount = item.paymentAmount || (item.paymentStatus === 'Sudah Bayar' ? standardFee : 0);
        const extra = Math.max(0, paymentAmount - standardFee);

        if (existingPayIdx >= 0) {
          newPayments[existingPayIdx] = {
            ...newPayments[existingPayIdx],
            status: item.paymentStatus,
            method: item.paymentMethod,
            amount: paymentAmount,
            extraContribution: extra,
            paidAt: item.paymentStatus === 'Sudah Bayar' ? new Date().toISOString() : '',
          };
        } else {
          newPayments.push({
            id: `pay-wa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            matchId,
            participantId: partId,
            standardFee,
            amount: paymentAmount,
            extraContribution: extra,
            method: item.paymentMethod,
            status: item.paymentStatus,
            paidAt: item.paymentStatus === 'Sudah Bayar' ? new Date().toISOString() : '',
            recordedBy: 'Import WhatsApp',
          });
        }
      }

      return {
        ...prev,
        participants: newParticipants,
        payments: newPayments,
      };
    });
  };

  // Record Payment
  const recordPayment = (
    matchId: string,
    participantId: string,
    amount: number,
    method: PaymentMethod,
    status: PaymentStatus,
    notes?: string
  ) => {
    const match = db.matches.find((m) => m.id === matchId);
    const standardFee = match ? match.standardFee : 35000;
    const extraContribution = Math.max(0, amount - standardFee);

    // Cari nama partisipan untuk Support of the match
    const participant = db.participants.find((p) => p.id === participantId);
    let playerName = 'Pemain Cornerkick17';
    if (participant) {
      if (participant.participantType === 'Guest') {
        playerName = participant.guestName || 'Tamu';
      } else if (participant.memberId) {
        const mem = db.members.find((m) => m.id === participant.memberId);
        if (mem) playerName = mem.nickname;
      }
    }

    setDb((prev) => {
      const existingIdx = prev.payments.findIndex(
        (p) => p.matchId === matchId && p.participantId === participantId
      );

      const updatedPayments = [...prev.payments];
      if (existingIdx >= 0) {
        updatedPayments[existingIdx] = {
          ...updatedPayments[existingIdx],
          amount,
          extraContribution,
          method,
          status,
          paidAt: status === 'Sudah Bayar' || status === 'Bayar Sebagian' ? new Date().toISOString() : '',
          notes,
          recordedBy: currentUser.name,
        };
      } else {
        updatedPayments.push({
          id: `pay-${Date.now()}`,
          matchId,
          participantId,
          standardFee,
          amount,
          extraContribution,
          method,
          status,
          paidAt: status === 'Sudah Bayar' || status === 'Bayar Sebagian' ? new Date().toISOString() : '',
          recordedBy: currentUser.name,
          notes,
        });
      }

      // SINKRONISASI BUKU KAS (CASH LEDGER) SESUAI ATURAN SISTEM:
      // 1. Unpaid HTM ('Belum Bayar' atau nominal 0) TIDAK BOLEH masuk buku kas
      // 2. Setiap pembayaran riil ('Sudah Bayar' / 'Bayar Sebagian' > 0) otomatis dicatat di kas masuk
      // 3. Kontribusi tambahan otomatis tercermin pada kas masuk
      let updatedTransactions = [...prev.cashTransactions];
      const existingTrxIdx = updatedTransactions.findIndex(
        (t) => t.matchId === matchId && t.sourceId === participantId
      );

      const hasRealPayment = (status === 'Sudah Bayar' || status === 'Bayar Sebagian') && amount > 0;

      if (hasRealPayment) {
        const trxDesc = `Pembayaran HTM: ${playerName}${extraContribution > 0 ? ` (+Kontribusi ${formatRupiah(extraContribution)})` : ''}`;
        if (existingTrxIdx >= 0) {
          updatedTransactions[existingTrxIdx] = {
            ...updatedTransactions[existingTrxIdx],
            amount,
            description: trxDesc,
            date: new Date().toISOString(),
          };
        } else {
          updatedTransactions.push({
            id: `trx-pay-${Date.now()}`,
            communityId: activeCommunity.id,
            type: 'Pemasukan',
            category: 'Match',
            amount,
            matchId,
            sourceId: participantId,
            description: trxDesc,
            date: new Date().toISOString(),
            createdBy: currentUser.name,
          });
        }
      } else {
        // Jika status menjadi Belum Bayar atau amount 0, hapus dari buku kas jika ada
        if (existingTrxIdx >= 0) {
          updatedTransactions.splice(existingTrxIdx, 1);
        }
      }

      return {
        ...prev,
        payments: updatedPayments,
        cashTransactions: updatedTransactions,
      };
    });

    // Cek apakah memenuhi syarat SUPPORT OF THE MATCH (Section 16: amount > standardFee)
    const appreciation = getSupportAppreciationData(playerName, amount, standardFee);
    if (appreciation.isEligible && (status === 'Sudah Bayar' || status === 'Bayar Sebagian')) {
      setSupportModal({
        isOpen: true,
        data: {
          playerName,
          amount,
          standardFee,
          extraContribution: appreciation.extraContribution,
          message: appreciation.message,
        },
      });
    }
  };

  const closeSupportModal = () => {
    setSupportModal({ isOpen: false, data: null });
  };

  // Expenses & AddOns dengan sinkronisasi Buku Kas Komunitas
  const addExpense = (data: Omit<MatchExpense, 'id'>) => {
    const newExpenseId = `exp-${Date.now()}`;
    const newExpense: MatchExpense = {
      ...data,
      id: newExpenseId,
    };
    const newTrx: CashTransaction = {
      id: `trx-${newExpenseId}`,
      communityId: activeCommunity.id,
      type: 'Pengeluaran',
      category: 'Match',
      amount: newExpense.total,
      matchId: newExpense.matchId,
      sourceId: newExpenseId,
      description: `Pengeluaran: ${newExpense.name}`,
      date: newExpense.paidAt || new Date().toISOString(),
      createdBy: currentUser.name,
    };

    setDb((prev) => ({
      ...prev,
      expenses: [...prev.expenses, newExpense],
      cashTransactions: [newTrx, ...prev.cashTransactions],
    }));
  };

  const deleteExpense = (id: string) => {
    setDb((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
      cashTransactions: prev.cashTransactions.filter((t) => t.sourceId !== id),
    }));
  };

  const addAddOn = (data: Omit<MatchAddOn, 'id'>) => {
    const newAddOnId = `addon-${Date.now()}`;
    const newAddOn: MatchAddOn = {
      ...data,
      id: newAddOnId,
    };
    const newTrx: CashTransaction = {
      id: `trx-${newAddOnId}`,
      communityId: activeCommunity.id,
      type: 'Pengeluaran',
      category: 'Match',
      amount: newAddOn.total,
      matchId: newAddOn.matchId,
      sourceId: newAddOnId,
      description: `Pengeluaran: ${newAddOn.name}`,
      date: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    setDb((prev) => ({
      ...prev,
      addOns: [...prev.addOns, newAddOn],
      cashTransactions: [newTrx, ...prev.cashTransactions],
    }));
  };

  const deleteAddOn = (id: string) => {
    setDb((prev) => ({
      ...prev,
      addOns: prev.addOns.filter((a) => a.id !== id),
      cashTransactions: prev.cashTransactions.filter((t) => t.sourceId !== id),
    }));
  };

  // Sponsors
  const addSponsor = (data: Omit<Sponsor, 'id' | 'createdAt'>) => {
    const newSponsor: Sponsor = {
      ...data,
      id: `sp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({ ...prev, sponsors: [...prev.sponsors, newSponsor] }));
  };

  const addMatchSponsorship = (data: Omit<MatchSponsorship, 'id'>) => {
    const newSponsorship: MatchSponsorship = {
      ...data,
      id: `msp-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      matchSponsorships: [...prev.matchSponsorships, newSponsorship],
    }));
  };

  // Cash Ledger
  const addCashTransaction = (data: Omit<CashTransaction, 'id'>) => {
    const newTrx: CashTransaction = {
      ...data,
      id: `trx-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      cashTransactions: [newTrx, ...prev.cashTransactions],
    }));
  };

  // Match Proposals
  const submitProposal = (data: Omit<MatchProposal, 'id' | 'createdAt' | 'status' | 'communityId'>) => {
    const newProposal: MatchProposal = {
      ...data,
      id: `prop-${Date.now()}`,
      communityId: activeCommunity.id,
      status: 'Menunggu Persetujuan',
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      proposals: [newProposal, ...prev.proposals],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          communityId: activeCommunity.id,
          title: 'Pengajuan Main Baru Diajukan 📋',
          message: `${data.requesterName} mengajukan pertandingan di ${data.suggestedVenue} untuk tanggal ${data.requestedDate}.`,
          type: 'proposal',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const reviewProposal = (proposalId: string, status: 'Disetujui' | 'Ditolak', adminNotes?: string) => {
    setDb((prev) => {
      const prop = prev.proposals.find((p) => p.id === proposalId);
      if (!prop) return prev;

      let createdMatchId: string | undefined = undefined;
      const updatedMatches = [...prev.matches];

      // Jika disetujui, buat Draft Match (Section 11: Approval creates a draft match)
      if (status === 'Disetujui') {
        createdMatchId = `match-draft-${Date.now()}`;
        const draftMatch: Match = {
          id: createdMatchId,
          communityId: prop.communityId,
          title: `Main Bareng di ${prop.suggestedVenue}`,
          date: prop.requestedDate,
          kickoffTime: prop.requestedTime || '19:00',
          endTime: '21:00',
          venue: prop.suggestedVenue,
          address: 'Alamat lapangan menyusul',
          standardFee: 35000,
          playerQuota: prop.estimatedPlayers || 20,
          status: 'Draft',
          cancellationDeadline: `${prop.requestedDate}T12:00`,
          notes: prop.notes || 'Pertandingan dari pengajuan anggota.',
          createdBy: currentUser.name,
          createdAt: new Date().toISOString(),
          photographerAvailable: false,
          cashSettled: false,
        };
        updatedMatches.unshift(draftMatch);
      }

      const updatedProposals = prev.proposals.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              status,
              reviewedBy: currentUser.name,
              reviewedAt: new Date().toISOString(),
              adminNotes,
              createdMatchId,
            }
          : p
      );

      return {
        ...prev,
        matches: updatedMatches,
        proposals: updatedProposals,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            communityId: prop.communityId,
            title: status === 'Disetujui' ? 'Pengajuan Main Disetujui! 🎉' : 'Pengajuan Main Ditolak',
            message: `Pengajuan main di ${prop.suggestedVenue} telah ${status.toLowerCase()} oleh admin.`,
            type: 'proposal',
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev.notifications,
        ],
      };
    });
  };

  // Pengajuan Keanggotaan (Membership Requests)
  const requestJoinCommunity = async (
    communityId: string,
    notes?: string,
    position: 'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder' = 'Gelandang',
    jerseyNumber: number = 10
  ) => {
    if (!userProfile) return;

    try {
      const serverReq = await submitMembershipRequestToServer({
        communityId,
        position,
        jerseyNumber,
        notes,
      });

      setDb((prev) => ({
        ...prev,
        membershipRequests: [
          serverReq,
          ...(prev.membershipRequests || []).filter((r) => r.id !== serverReq.id),
        ],
      }));
      await refreshMembershipRequests();
    } catch (err: any) {
      console.error('[AppContext] Server membership request failed:', err?.message || err);
      await refreshMembershipRequests();
      throw err;
    }
  };

  const reviewMembershipRequest = async (
    requestId: string,
    status: 'Disetujui' | 'Ditolak',
    adminNotes?: string
  ) => {
    const req = (db.membershipRequests || []).find((r) => r.id === requestId);
    if (!req) return;

    // 1. Verifikasi wajib ke server terpusat. Jika gagal atau offline, STOP!
    try {
      await reviewMembershipRequestOnServer(
        requestId,
        status === 'Disetujui' ? 'approved' : 'rejected',
        adminNotes
      );
      setIsServerOnline(true);
    } catch (err: any) {
      setIsServerOnline(false);
      console.error('[AppContext] Server review failed:', err);
      const errorMessage =
        err?.message && !err.message.includes('fetch')
          ? err.message
          : 'Gagal menghubungi server. Persetujuan anggota membutuhkan koneksi internet aktif.';
      throw new Error(errorMessage);
    }

    // 2. Hanya setelah server berhasil, perbarui state lokal
    if (status === 'Disetujui') {
      const now = new Date().toISOString();
      const newMember: Member = {
        id: `mem-${req.userId}`,
        communityId: req.communityId,
        userId: req.userId,
        nickname: req.userName,
        position: req.position || 'Gelandang',
        jerseyNumber: req.jerseyNumber || 10,
        role: 'member',
        status: 'Aktif',
        joinedAt: now.split('T')[0],
      };

      const newMembership: CommunityMembership = {
        uid: req.userId,
        userId: req.userId,
        communityId: req.communityId,
        role: 'MEMBER',
        status: 'AKTIF',
        displayName: req.userName,
        position: req.position,
        jerseyNumber: req.jerseyNumber,
        joinedAt: now,
      };

      setMemberships((prev) => {
        const filtered = prev.filter(
          (m) => !(m.communityId === req.communityId && (m.uid === req.userId || m.userId === req.userId))
        );
        const updated = [...filtered, newMembership];
        try {
          localStorage.setItem('mabol_memberships_v1', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });

      setDb((prev) => ({
        ...prev,
        members: [...prev.members.filter((m) => m.userId !== req.userId), newMember],
        membershipRequests: (prev.membershipRequests || []).map((r) =>
          r.id === requestId
            ? { ...r, status: 'Disetujui', reviewedAt: now, reviewedBy: currentUser.name }
            : r
        ),
      }));
    } else {
      setDb((prev) => ({
        ...prev,
        membershipRequests: (prev.membershipRequests || []).map((r) =>
          r.id === requestId
            ? { ...r, status: 'Ditolak', reviewedAt: new Date().toISOString(), reviewedBy: currentUser.name }
            : r
        ),
      }));
    }

    await refreshMembershipRequests();
    await refreshMembers();
  };

  // Jersey Orders
  const createJerseyOrder = (data: Omit<JerseyOrder, 'id' | 'orderedAt'>) => {
    const newOrder: JerseyOrder = {
      ...data,
      id: `jo-${Date.now()}`,
      orderedAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      jerseyOrders: [newOrder, ...prev.jerseyOrders],
    }));
  };

  const updateJerseyOrderStatus = (id: string, paymentStatus: JerseyOrder['paymentStatus'], paidAmount: number) => {
    setDb((prev) => ({
      ...prev,
      jerseyOrders: prev.jerseyOrders.map((o) =>
        o.id === id ? { ...o, paymentStatus, paidAmount } : o
      ),
    }));
  };

  // Penalty Game
  const savePenaltyScore = (score: number, goals: number, saves: number, attempts: number, highestStreak: number) => {
    const newRecord: PenaltyRecord = {
      id: `pen-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      communityId: activeCommunity.id,
      attempts,
      goals,
      saves,
      score,
      highestStreak,
      playedAt: new Date().toISOString(),
    };

    setDb((prev) => {
      // Cek apakah sudah ada record user ini di komunitas ini, perbarui jika skor lebih tinggi
      const existingIdx = prev.penaltyRecords.findIndex(
        (r) => r.userId === currentUser.id && r.communityId === activeCommunity.id
      );

      const updated = [...prev.penaltyRecords];
      if (existingIdx >= 0) {
        if (score > updated[existingIdx].score) {
          updated[existingIdx] = newRecord;
        } else {
          // Akumulasi attempts, goals, saves
          updated[existingIdx] = {
            ...updated[existingIdx],
            attempts: updated[existingIdx].attempts + attempts,
            goals: updated[existingIdx].goals + goals,
            saves: updated[existingIdx].saves + saves,
            highestStreak: Math.max(updated[existingIdx].highestStreak, highestStreak),
            playedAt: new Date().toISOString(),
          };
        }
      } else {
        updated.push(newRecord);
      }

      return {
        ...prev,
        penaltyRecords: updated,
      };
    });
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const resetDemoData = () => {
    const fresh = resetDatabaseToDefault();
    setDb(fresh);
  };

  const value: AppContextType = {
    authLoading,
    userProfile,
    userMemberships,
    activeMembership,
    login,
    register,
    logout,
    joinCommunity,
    pendingMembershipCount,
    refreshMembershipRequests,
    refreshAuthSession,
    isServerOnline,
    checkServerConnectivity,

    communities: db.communities,
    activeCommunity,
    switchCommunity,
    createCommunity,
    users: db.users,
    currentUser,
    currentMember,
    isAdmin,
    switchUser,
    members: db.members,
    createMember,
    createManualMember,
    updateManualMember,
    deleteManualMember,
    refreshMembers,
    isMembersLoading,
    membersSource,
    membersError,

    matches: db.matches,
    createMatch,
    updateMatch,
    cancelMatch,
    completeMatch,

    participants: db.participants,
    addMemberToMatch,
    rsvpMatch,
    updateParticipantRsvp,
    updateAttendance,
    addGuestParticipant,
    convertGuestToMember,
    importWhatsAppParticipants,

    payments: db.payments,
    recordPayment,

    supportModal,
    closeSupportModal,

    expenses: db.expenses,
    addExpense,
    deleteExpense,
    addOns: db.addOns,
    addAddOn,
    deleteAddOn,
    sponsors: db.sponsors,
    addSponsor,
    matchSponsorships: db.matchSponsorships,
    addMatchSponsorship,
    cashTransactions: db.cashTransactions,
    addCashTransaction,
    communityCashBalance,

    proposals: db.proposals,
    submitProposal,
    reviewProposal,

    membershipRequests: db.membershipRequests || [],
    requestJoinCommunity,
    reviewMembershipRequest,

    jerseyPrograms: db.jerseyPrograms,
    jerseyOrders: db.jerseyOrders,
    createJerseyOrder,
    updateJerseyOrderStatus,

    penaltyRecords: db.penaltyRecords,
    savePenaltyScore,

    notifications: db.notifications,
    markNotificationAsRead,

    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
