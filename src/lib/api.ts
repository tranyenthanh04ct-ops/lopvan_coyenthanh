import {
  AuthUser,
  Student,
  Material,
  Assignment,
  Submission,
  Announcement,
  AdminStats,
} from '../types';

const TOKEN_KEY = 'yenthanh_auth_token';
const USER_KEY = 'yenthanh_auth_user';
const ROLE_KEY = 'yenthanh_last_role';

const memStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memStorage[key] ?? null;
  } catch {
    return memStorage[key] ?? null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // fallback to memory
  }
  memStorage[key] = value;
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // fallback to memory
  }
  delete memStorage[key];
}

export function getStoredToken(): string | null {
  return safeGetItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = safeGetItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getLastRole(): 'admin' | 'student' | null {
  const r = safeGetItem(ROLE_KEY);
  return r === 'admin' || r === 'student' ? r : null;
}

export function setLastRole(role: 'admin' | 'student'): void {
  safeSetItem(ROLE_KEY, role);
}

export function saveSession(token: string, user: AuthUser): void {
  safeSetItem(TOKEN_KEY, token);
  safeSetItem(USER_KEY, JSON.stringify(user));
  safeSetItem(ROLE_KEY, user.role);
}

export function clearSession(): void {
  safeRemoveItem(TOKEN_KEY);
  safeRemoveItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau vài giây!');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Yêu cầu thất bại (${response.status})`);
  }

  return data as T;
}

// Auth API
export const apiAuth = {
  login: async (credentials: { role: 'admin' | 'student'; username?: string; password: string }) => {
    const res = await request<{ success: boolean; token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    saveSession(res.token, res.user);
    return res.user;
  },

  getMe: async () => {
    return request<AuthUser>('/api/auth/me');
  },

  getCurrentUser: () => {
    return getStoredUser();
  },

  logout: async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearSession();
    }
  },
};

// File Upload
export const apiUpload = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{
      success: boolean;
      url: string;
      fileName: string;
      fileSize: number;
      fileType: string;
    }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

// Teacher (Admin) API
export const apiAdmin = {
  getStats: async () => {
    return request<AdminStats>('/api/admin/stats');
  },

  // Students
  getStudents: async () => {
    return request<Student[]>('/api/admin/students');
  },
  createStudent: async (data: {
    fullName: string;
    username: string;
    password: string;
    classRoom: string;
    parentPhone?: string;
    notes?: string;
  }) => {
    return request<{ success: boolean; student: Student }>('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateStudent: async (
    id: string,
    data: Partial<Student> & { newPassword?: string }
  ) => {
    return request<{ success: boolean; student: Student }>(`/api/admin/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteStudent: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/admin/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Materials
  getMaterials: async () => {
    return request<Material[]>('/api/admin/materials');
  },
  createMaterial: async (data: Omit<Material, 'id' | 'createdAt'>) => {
    return request<{ success: boolean; material: Material }>('/api/admin/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateMaterial: async (id: string, data: Partial<Material>) => {
    return request<{ success: boolean; material: Material }>(`/api/admin/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteMaterial: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/admin/materials/${id}`, {
      method: 'DELETE',
    });
  },

  // Assignments
  getAssignments: async () => {
    return request<Assignment[]>('/api/admin/assignments');
  },
  createAssignment: async (data: Omit<Assignment, 'id' | 'createdAt'>) => {
    return request<{ success: boolean; assignment: Assignment }>('/api/admin/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateAssignment: async (id: string, data: Partial<Assignment>) => {
    return request<{ success: boolean; assignment: Assignment }>(`/api/admin/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteAssignment: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/admin/assignments/${id}`, {
      method: 'DELETE',
    });
  },

  // Submissions & Grading
  getAssignmentSubmissions: async (assignmentId: string) => {
    return request<{
      assignment: Assignment;
      studentsSubmissions: Array<{
        studentId: string;
        studentName: string;
        studentClass: string;
        submissionId: string | null;
        status: 'not_started' | 'draft' | 'submitted' | 'graded';
        answers: Record<string, any>;
        submittedAt: string | null;
        score: number | null;
        feedback: string | null;
        gradedAt: string | null;
      }>;
    }>(`/api/admin/assignments/${assignmentId}/submissions`);
  },
  gradeSubmission: async (submissionId: string, score: number, feedback: string) => {
    return request<{ success: boolean; submission: Submission; message: string }>(
      `/api/admin/submissions/${submissionId}/grade`,
      {
        method: 'POST',
        body: JSON.stringify({ score, feedback }),
      }
    );
  },

  // Announcements
  getAnnouncements: async () => {
    return request<Announcement[]>('/api/announcements');
  },
  createAnnouncement: async (title: string, content: string) => {
    return request<{ success: boolean; announcement: Announcement }>('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  },
  deleteAnnouncement: async (id: string) => {
    return request<{ success: boolean }>(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
    });
  },
};

// Student API
export const apiStudent = {
  getDashboard: async () => {
    return request<{
      student: { id: string; fullName: string; username: string; classRoom: string };
      materialsCount: number;
      assignmentsCount: number;
      completedCount: number;
      upcomingDue: Array<Assignment & { status: string; score?: number }>;
      recentAssigned: Array<Assignment & { status: string; score?: number }>;
      announcements: Announcement[];
    }>('/api/student/dashboard');
  },

  getMaterials: async () => {
    return request<Material[]>('/api/student/materials');
  },

  getAssignments: async () => {
    return request<Array<Assignment & {
      submissionId: string | null;
      status: 'not_started' | 'draft' | 'submitted' | 'graded';
      score: number | null;
      feedback: string | null;
      submittedAt: string | null;
      gradedAt: string | null;
    }>>('/api/student/assignments');
  },

  getAssignmentDetail: async (id: string) => {
    return request<{
      assignment: Assignment;
      attachedMaterials: Material[];
      submission: Submission | null;
    }>(`/api/student/assignments/${id}`);
  },

  saveAssignment: async (id: string, answers: Record<string, any>, isOfficialSubmit: boolean) => {
    return request<{
      success: boolean;
      submission: Submission;
      message: string;
    }>(`/api/student/assignments/${id}/save`, {
      method: 'POST',
      body: JSON.stringify({ answers, isOfficialSubmit }),
    });
  },
};
