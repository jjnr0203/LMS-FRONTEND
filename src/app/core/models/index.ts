export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId?: string;
  roleName?: string;
  isActive: boolean;
  birthDate?: string;

  phone?: string;
  avatarUrl?: string;
  faculties?: any[];
  createdAt: string;
  updatedAt?: string;
  requiresPasswordChange?: boolean;
}

export interface Tuition {
  id: string;
  studentId: string;
  status: 'pago_total' | 'pendiente' | 'no_paga';
  paidInstallments: number;
}

export interface CareerSubject {
  id: string;
  name: string;
  semester: number;
  modalityNames?: string[];
}

export interface SemesterColor {
  semester: number;
  color: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  hours: number;
  teacherId?: string;
  description?: string;
  careerId?: string;
  semester?: number;
  modalityIds?: string[];
  curriculumId?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  enrolledAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  facultyId?: string;
  modalityIds?: string[];
  jornadaIds?: string[];
  description?: string;
  subjectId: string;
  teacherId: string;
  dueDate: string;
  maxScore: number;
  createdAt: string;
  updatedAt?: string;
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
  requiresPasswordChange: boolean;
  isLoggedIn: boolean;
}

export type AppRole = 'admin' | 'coordinator' | 'treasury' | 'teacher' | 'student' | 'secretary' | 'human_resources';

export interface AcademicTerm {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Modality {
  id: string;
  name: string;
  isActive: boolean;
  description?: string;
}

export interface Jornada {
  id: string;
  name: string;
  isActive: boolean;
  description?: string;
}

export interface Career {
  id: string;
  code: string;
  name: string;
  durationSemesters: number;
  modalityIds?: string[];
  coordinatorId?: string;
  isActive: boolean;
  facultyId?: string;
}

export interface Faculty {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  description: string | null;
  resource: string;
  createdAt: string;
}

export interface Curriculum {
  id: string;
  careerId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Inscription {
  id: string;
  studentId: string;
  careerId: string;
  status: 'pending' | 'approved' | 'rejected';
  documentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EnrollmentDetail {
  id: string;
  studentId: string;
  academicTermId: string;
  careerId: string;
  level: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface EnrollmentSubject {
  id: string;
  enrollmentDetailId: string;
  subjectId: string;
  status: 'enrolled' | 'approved' | 'failed';
  grade?: number;
  createdAt: string;
}

export interface AcademicRecord {
  subjectName: string;
  grade: number;
  credits: number;
  term: string;
}

export interface AcademicHistory {
  studentId: string;
  approved: AcademicRecord[];
  failed: AcademicRecord[];
  average: number;
  totalCredits: number;
}

export interface Certificate {
  id: string;
  studentId: string;
  type: 'matricula' | 'estudios' | 'notas' | 'egreso';
  pdfUrl?: string;
  generatedAt: string;
  createdAt: string;
}
