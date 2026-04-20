export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type EnglishLevel = 
  | 'BEGINNER' 
  | 'ELEMENTARY' 
  | 'INTERMEDIATE' 
  | 'UPPER_INTERMEDIATE' 
  | 'ADVANCED' 
  | 'PROFICIENT';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  createdAt: any;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  level: EnglishLevel;
  createdAt: any;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  schedule: string;
  createdAt: any;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  startDate: any;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  dueDate: any;
  paidAt?: any;
  status: PaymentStatus;
  referenceMonth?: string; // Format: "YYYY-MM" or "Month Year"
}

export interface Grade {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  date: any;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface Material {
  id: string;
  title: string;
  url: string;
  type: 'LINK' | 'DRIVE' | 'PDF' | 'VIDEO' | 'DOCUMENT';
  classId: string;
  teacherId: string;
  createdAt: any;
}
