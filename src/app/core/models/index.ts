export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  isActive: boolean;
  birthDate?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Tuition {
  id: string;
  studentId: string;
  status: 'pago_total' | 'pendiente' | 'no_paga';
  paidInstallments: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  coordinatorId: string;
  description?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  enrolledAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  teacherId: string;
  dueDate: string;
  maxScore: number;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next: string | null;
    prev: string | null;
  };
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  isLoggedIn: boolean;
}

export type AppRole = 'admin' | 'coordinator' | 'treasury' | 'teacher' | 'student';
