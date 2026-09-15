export type UserRole = 'admin' | 'student';

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  username?: string;
  classRoom?: string;
}

export interface Student {
  id: string;
  fullName: string;
  username: string;
  passwordHash?: string; // only stored on server
  classRoom: string;
  parentPhone?: string;
  notes?: string;
  isLocked: boolean;
  createdAt: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  topic: string; // e.g., 'Văn bản - Thơ', 'Văn bản - Truyện', 'Tiếng Việt', 'Tập làm văn', 'Nghị luận xã hội', 'Nghị luận văn học', 'Đọc hiểu & Ôn thi'
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  assignedType: 'all' | 'specific';
  assignedStudentIds: string[];
  createdAt: string;
}

export interface Question {
  id: string;
  type: 'choice' | 'essay';
  questionText: string;
  points: number;
  options?: string[]; // for choice (e.g. 4 options)
  correctAnswerIndex?: number; // for choice (0-3)
}

export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  questions: Question[];
  attachedMaterialIds: string[];
  dueDate: string; // ISO string
  targetType: 'all' | 'specific';
  targetStudentIds: string[];
  createdAt: string;
}

export interface AnswerItem {
  choiceIndex?: number;
  textAnswer?: string;
  attachedFileUrl?: string;
  attachedFileName?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentClass?: string;
  status: 'draft' | 'submitted' | 'graded';
  answers: Record<string, AnswerItem>; // questionId -> AnswerItem
  submittedAt?: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  lastSavedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetType: 'all' | 'specific';
  targetStudentIds?: string[];
  createdAt: string;
}

export interface AdminStats {
  totalStudents: number;
  totalMaterials: number;
  totalAssignments: number;
  totalSubmissions: number;
  pendingGradingCount: number;
  completedGradingCount: number;
}
