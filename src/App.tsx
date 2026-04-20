import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc,
  serverTimestamp,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';

// Test connection on boot
const testConnection = async () => {
  try {
    // We use a path that is allowed for authenticated users in firestore.rules
    await getDocFromServer(doc(db, '_connection_test_', 'boot'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
};
testConnection();
import { 
  Users, 
  BookOpen, 
  CreditCard, 
  TrendingUp, 
  LogOut, 
  Plus, 
  Search,
  ChevronRight,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Trash2,
  UserCheck,
  FileText,
  Link2,
  ExternalLink,
  UploadCloud,
  Video,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Class, Payment, UserProfile, Role, EnglishLevel, PaymentStatus, Grade, Enrollment, Attendance, Material } from './types';

// --- Helpers ---

function formatReferenceMonth(monthStr: string | undefined): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthIdx = parseInt(month, 10) - 1;
  return `${months[monthIdx]} de ${year}`;
}

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Ocorreu um erro inesperado.";
      try {
        const info = JSON.parse(this.state.error?.message || '{}');
        if (info.error?.includes('insufficient permissions')) {
          message = "Você não tem permissão para realizar esta ação ou acessar estes dados.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6 text-center">
          <AlertCircle size={48} className="text-red-600 mb-4" />
          <h2 className="text-2xl font-serif italic mb-2">Ops! Algo deu errado.</h2>
          <p className="text-sm font-mono opacity-60 max-w-md mb-6">{message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#003366] text-white text-xs font-mono uppercase tracking-widest"
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---

const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-white">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full"
    />
  </div>
);

const LoginScreen = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-6xl font-sans font-bold tracking-tighter text-[#003366]">BTechnology</h1>
          <p className="text-sm font-mono uppercase tracking-widest opacity-60">English School Manager</p>
        </div>
        
        <div className="p-8 border border-[#003366] bg-white shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]">
          <p className="mb-8 text-sm opacity-80">Acesse o painel administrativo para gerir alunos, turmas e finanças.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-[#003366] text-white font-mono text-sm uppercase tracking-wider hover:bg-opacity-90 transition-all flex items-center justify-center gap-3"
          >
            Entrar com Google
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Fetch or create profile
        const profileRef = doc(db, 'users', u.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            setProfile({ id: u.uid, ...profileSnap.data() } as UserProfile);
          } else {
            // Check if user is a student in the system
            const studentsRef = collection(db, 'students');
            const q = query(studentsRef, where('email', '==', u.email));
            const studentQuerySnap = await getDocs(q);
            
            let role: Role = 'TEACHER';
            let studentId: string | undefined = undefined;

            const adminEmails = ["upgradeangola@gmail.com", "hospitalsanatoriodonamibe@gmail.com", "joaoselson@gmail.com"];
            if (u.email && adminEmails.includes(u.email)) {
              role = 'ADMIN';
            } else if (!studentQuerySnap.empty) {
              role = 'STUDENT';
              studentId = studentQuerySnap.docs[0].id;
            }

            const newProfile = {
              name: u.displayName || 'User',
              email: u.email || '',
              role: role,
              studentId: studentId,
              createdAt: serverTimestamp()
            };
            await setDoc(profileRef, newProfile);
            setProfile({ id: u.uid, ...newProfile } as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listeners
  useEffect(() => {
    if (!user || !profile) return;

    let unsubStudents = () => {};
    let unsubClasses = () => {};
    let unsubPayments = () => {};
    let unsubGrades = () => {};
    let unsubEnrollments = () => {};
    let unsubAttendances = () => {};
    let unsubMaterials = () => {};

    if (profile.role !== 'STUDENT') {
      // Broad listeners for Staff
      unsubStudents = onSnapshot(query(collection(db, 'students'), orderBy('name')), (snap) => {
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'students'));

      unsubClasses = onSnapshot(query(collection(db, 'classes'), orderBy('name')), (snap) => {
        setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'classes'));

      unsubPayments = onSnapshot(query(collection(db, 'payments'), orderBy('dueDate', 'desc')), (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments'));

      unsubGrades = onSnapshot(query(collection(db, 'grades'), orderBy('date', 'desc')), (snap) => {
        setGrades(snap.docs.map(d => ({ id: d.id, ...d.data() } as Grade)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'grades'));

      unsubEnrollments = onSnapshot(query(collection(db, 'enrollments')), (snap) => {
        setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Enrollment)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'enrollments'));

      unsubAttendances = onSnapshot(query(collection(db, 'attendance')), (snap) => {
        setAttendances(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));

      unsubMaterials = onSnapshot(query(collection(db, 'materials'), orderBy('createdAt', 'desc')), (snap) => {
        setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() } as Material)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'materials'));
    } else {
      // Filtered listeners for Students
      const sid = profile.studentId;
      
      if (sid) {
        unsubStudents = onSnapshot(doc(db, 'students', sid), (snap) => {
          if (snap.exists()) {
            setStudents([{ id: snap.id, ...snap.data() } as Student]);
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, `students/${sid}`));

        unsubPayments = onSnapshot(query(collection(db, 'payments'), where('studentId', '==', sid), orderBy('dueDate', 'desc')), (snap) => {
          setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments'));

        unsubGrades = onSnapshot(query(collection(db, 'grades'), where('studentId', '==', sid), orderBy('date', 'desc')), (snap) => {
          setGrades(snap.docs.map(d => ({ id: d.id, ...d.data() } as Grade)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'grades'));

        unsubEnrollments = onSnapshot(query(collection(db, 'enrollments'), where('studentId', '==', sid)), (snap) => {
          setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Enrollment)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'enrollments'));

        unsubAttendances = onSnapshot(query(collection(db, 'attendance'), where('studentId', '==', sid)), (snap) => {
          setAttendances(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));

        unsubClasses = onSnapshot(query(collection(db, 'classes')), (snap) => {
          setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'classes'));

        unsubMaterials = onSnapshot(query(collection(db, 'materials'), orderBy('createdAt', 'desc')), (snap) => {
          setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() } as Material)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'materials'));
      }
    }

    return () => {
      unsubStudents();
      unsubClasses();
      unsubPayments();
      unsubGrades();
      unsubEnrollments();
      unsubAttendances();
      unsubMaterials();
    };
  }, [user, profile]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  const handleLogout = () => signOut(auth);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col md:flex-row bg-white relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-6 border-b border-[#003366] bg-white z-50 sticky top-0">
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tighter text-[#003366]">BTechnology</h2>
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">Management System</p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#003366]"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar / Mobile Menu Overlay */}
        <div 
          className={`fixed inset-0 bg-[#003366] bg-opacity-50 z-30 transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <aside className={`
          fixed inset-0 z-40 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 md:inset-auto md:w-64 md:border-r border-[#003366] p-6 flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="mb-12 hidden md:block">
            <h2 className="text-3xl font-sans font-bold tracking-tighter text-[#003366]">BTechnology</h2>
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">Management System</p>
          </div>

          <nav className="flex-1 space-y-2 mt-20 md:mt-0">
            {(profile?.role === 'STUDENT' ? [
              { id: 'overview', label: 'Painel', icon: TrendingUp },
              { id: 'my-record', label: 'Minhas Aulas', icon: BookOpen },
              { id: 'my-grades', label: 'Meu Progresso', icon: GraduationCap },
              { id: 'my-finance', label: 'Pagamentos', icon: CreditCard },
            ] : [
              { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
              { id: 'students', label: 'Alunos', icon: Users },
              { id: 'classes', label: 'Turmas', icon: BookOpen },
              { id: 'progress', label: 'Progresso', icon: GraduationCap },
              { id: 'attendance', label: 'Chamada', icon: UserCheck },
              { id: 'finance', label: 'Financeiro', icon: CreditCard },
            ]).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-mono uppercase tracking-wider transition-all ${
                  activeTab === item.id 
                    ? 'bg-[#003366] text-white' 
                    : 'hover:bg-[#003366] hover:text-white opacity-60 hover:opacity-100'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-[#003366] border-opacity-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#003366] text-white flex items-center justify-center text-xs font-mono">
                {profile?.name?.charAt(0) || '?'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{profile?.name || 'Carregando...'}</p>
                <p className="text-[10px] font-mono opacity-50 uppercase">{profile?.role || '...'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
            >
              <LogOut size={14} />
              Sair do Sistema
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {(profile?.role === 'STUDENT') ? (
                <>
                  {activeTab === 'overview' && <StudentOverview profile={profile} students={students} classes={classes} attendances={attendances} payments={payments} grades={grades} />}
                  {activeTab === 'my-record' && <StudentClasses profile={profile} enrollments={enrollments} classes={classes} attendances={attendances} materials={materials} />}
                  {activeTab === 'my-grades' && <StudentProgress profile={profile} grades={grades} />}
                  {activeTab === 'my-finance' && <StudentFinance profile={profile} payments={payments} />}
                </>
              ) : (
                <>
                  {activeTab === 'overview' && <Overview students={students} classes={classes} payments={payments} />}
                  {activeTab === 'students' && <StudentsManager students={students} enrollments={enrollments} />}
                  {activeTab === 'classes' && <ClassesManager classes={classes} students={students} enrollments={enrollments} materials={materials} profile={profile} />}
                  {activeTab === 'finance' && <FinanceManager payments={payments} students={students} />}
                  {activeTab === 'progress' && <ProgressManager students={students} grades={grades} />}
                  {activeTab === 'attendance' && <AttendanceManager classes={classes} students={students} enrollments={enrollments} attendances={attendances} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}

// --- Sub-Views ---

function Overview({ students, classes, payments }: { students: Student[], classes: Class[], payments: Payment[] }) {
  const pendingPayments = payments.filter(p => p.status === 'PENDING').length;
  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Dashboard</h1>
          <p className="text-sm font-mono opacity-50 uppercase mt-2">Resumo da Escola</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Alunos', value: students.length, icon: Users },
          { label: 'Turmas Ativas', value: classes.length, icon: GraduationCap },
          { label: 'Pagamentos Pendentes', value: pendingPayments, icon: AlertCircle, color: 'text-orange-600' },
          { label: 'Receita Total', value: `Kz ${totalRevenue.toLocaleString()}`, icon: CreditCard },
        ].map((stat, i) => (
          <div key={i} className="p-4 sm:p-6 border border-[#003366] bg-white shadow-[4px_4px_0px_0px_rgba(0,51,102,1)]">
            <div className="flex justify-between items-start mb-4">
              <stat.icon size={20} className="opacity-40" />
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Stat {i+1}</span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono uppercase opacity-50 mb-1">{stat.label}</p>
            <p className={`text-2xl sm:text-3xl font-serif ${stat.color || ''}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <h3 className="text-xs font-mono uppercase tracking-widest border-b border-[#003366] pb-2 mb-6">Alunos Recentes</h3>
          <div className="space-y-4">
            {students.slice(0, 5).map(student => (
              <div key={student.id} className="flex items-center justify-between p-4 border border-[#003366] border-opacity-10 hover:border-opacity-100 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#003366] bg-opacity-5 flex items-center justify-center font-mono text-sm">
                    {student.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{student.name}</p>
                    <p className="text-[10px] font-mono opacity-50 uppercase">{student.level}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-mono uppercase tracking-widest border-b border-[#003366] pb-2 mb-6">Próximos Pagamentos</h3>
          <div className="space-y-4">
            {payments.filter(p => p.status === 'PENDING').slice(0, 5).map(payment => {
              const student = students.find(s => s.id === payment.studentId);
              return (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-[#003366] border-opacity-10">
                  <div className="flex items-center gap-4">
                    <Clock size={16} className="opacity-40" />
                    <div>
                      <p className="text-sm font-bold">{student?.name || 'Aluno Desconhecido'}</p>
                      <p className="text-[10px] font-mono opacity-50 uppercase">Vence em: {payment.dueDate?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-mono font-bold">Kz {payment.amount.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function StudentsManager({ students, enrollments }: { students: Student[], enrollments: Enrollment[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleDeleteStudent = async (id: string) => {
    try {
      // 1. Delete student document
      await deleteDoc(doc(db, 'students', id));
      
      // 2. Cleanup related enrollments
      const studentEnrollments = enrollments.filter(e => e.studentId === id);
      for (const enrollment of studentEnrollments) {
        await deleteDoc(doc(db, 'enrollments', enrollment.id));
      }
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    // Check for duplicate email
    if (students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      alert("Este email já está cadastrado para outro aluno.");
      return;
    }

    const data = {
      name: formData.get('name') as string,
      email: email,
      phone: formData.get('phone') as string,
      level: formData.get('level') as EnglishLevel,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'students'), data);
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'students');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Alunos</h1>
            <p className="text-sm font-mono opacity-50 uppercase mt-2">Gestão Acadêmica</p>
          </div>
          <div className="px-4 py-2 bg-[#003366] border border-[#003366] inline-block shadow-[4px_4px_0px_0px_rgba(0,51,102,0.2)]">
            <p className="text-[10px] font-mono uppercase text-white opacity-60 leading-none mb-1">Total</p>
            <p className="text-xl font-mono font-bold leading-none text-white">{students.length}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto px-6 py-3 bg-[#003366] text-white font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-opacity-90"
        >
          <Plus size={16} />
          Novo Aluno
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="p-4 sm:p-8 border border-[#003366] bg-white shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]"
        >
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Nome Completo</label>
              <input name="name" required className="w-full p-2 sm:p-3 border border-[#003366] text-sm focus:outline-none focus:ring-1 focus:ring-[#003366]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Email</label>
              <input name="email" type="email" required className="w-full p-2 sm:p-3 border border-[#003366] text-sm focus:outline-none focus:ring-1 focus:ring-[#003366]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Telefone</label>
              <input name="phone" className="w-full p-2 sm:p-3 border border-[#003366] text-sm focus:outline-none focus:ring-1 focus:ring-[#003366]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Nível Inicial</label>
              <select name="level" className="w-full p-2 sm:p-3 border border-[#003366] text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] bg-white">
                <option value="BEGINNER">Beginner</option>
                <option value="ELEMENTARY">Elementary</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="UPPER_INTERMEDIATE">Upper Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="PROFICIENT">Proficient</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-xs font-mono uppercase opacity-50 hover:opacity-100">Cancelar</button>
              <button type="submit" className="w-full sm:w-auto px-8 py-2 bg-[#003366] text-white text-xs font-mono uppercase tracking-widest">Salvar Aluno</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
        <input 
          placeholder="PESQUISAR POR NOME..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border border-[#003366] bg-white text-sm font-mono uppercase focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#003366]">
              <th className="text-left py-4 px-4 text-[10px] font-mono uppercase opacity-40">#</th>
              <th className="text-left py-4 px-4 text-[10px] font-mono uppercase opacity-40">Nome</th>
              <th className="text-left py-4 px-4 text-[10px] font-mono uppercase opacity-40">Nível</th>
              <th className="text-left py-4 px-4 text-[10px] font-mono uppercase opacity-40">Email</th>
              <th className="text-right py-4 px-4 text-[10px] font-mono uppercase opacity-40">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student, i) => (
              <tr key={student.id} className="border-b border-[#003366] border-opacity-5 hover:bg-white transition-colors group">
                <td className="py-4 px-4 text-xs font-mono opacity-40">{i + 1}</td>
                <td className="py-4 px-4 text-sm font-bold">{student.name}</td>
                <td className="py-4 px-4">
                  <span className="text-[10px] font-mono uppercase px-2 py-1 bg-[#003366] bg-opacity-5 border border-[#003366] border-opacity-10">
                    {student.level}
                  </span>
                </td>
                <td className="py-4 px-4 text-xs opacity-60">{student.email}</td>
                <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                  {deletingId === student.id ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-[10px] font-mono uppercase text-red-600 font-bold hover:underline"
                      >
                        Confirmar
                      </button>
                      <button 
                        onClick={() => setDeletingId(null)}
                        className="text-[10px] font-mono uppercase opacity-40 hover:opacity-100"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <button className="text-[10px] font-mono uppercase opacity-0 group-hover:opacity-100 hover:underline transition-opacity">Ver Perfil</button>
                      <button 
                        onClick={() => setDeletingId(student.id)}
                        className="p-2 text-red-600 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 hover:bg-red-50 transition-all rounded"
                        title="Eliminar Aluno"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClassesManager({ classes, students, enrollments, materials, profile }: { classes: Class[], students: Student[], enrollments: Enrollment[], materials: Material[], profile: UserProfile | null }) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      teacherId: auth.currentUser?.uid || '',
      schedule: formData.get('schedule') as string,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'classes'), data);
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'classes');
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClassId) return;
    
    const formData = new FormData(e.currentTarget);
    const studentId = formData.get('studentId') as string;

    // Check if already enrolled
    if (enrollments.some(e => e.classId === selectedClassId && e.studentId === studentId)) {
      alert('Aluno já matriculado nesta turma.');
      return;
    }

    const data = {
      classId: selectedClassId,
      studentId,
      startDate: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'enrollments'), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'enrollments');
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    try {
      await deleteDoc(doc(db, 'enrollments', enrollmentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `enrollments/${enrollmentId}`);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'classes', id));
      const classEnrollments = enrollments.filter(e => e.classId === id);
      for (const enrollment of classEnrollments) {
        await deleteDoc(doc(db, 'enrollments', enrollment.id));
      }
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${id}`);
    }
  };

  if (selectedClassId) {
    const cls = classes.find(c => c.id === selectedClassId);
    const classEnrollments = enrollments.filter(e => e.classId === selectedClassId);
    
    return (
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <button 
              onClick={() => setSelectedClassId(null)}
              className="text-[10px] font-mono uppercase opacity-50 hover:opacity-100 mb-2 flex items-center gap-1"
            >
              ← Voltar para Turmas
            </button>
            <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">{cls?.name}</h1>
            <p className="text-sm font-mono opacity-50 uppercase mt-2">{cls?.schedule}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-widest border-b border-[#003366] pb-2">Alunos Matriculados</h3>
            <div className="space-y-4">
              {classEnrollments.map(enrollment => {
                const student = students.find(s => s.id === enrollment.studentId);
                return (
                  <div key={enrollment.id} className="flex items-center justify-between p-4 border border-[#003366] bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#003366] bg-opacity-5 flex items-center justify-center font-mono text-sm">
                        {student?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{student?.name || 'Aluno Desconhecido'}</p>
                        <p className="text-[10px] font-mono opacity-50 uppercase">{student?.level}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveEnrollment(enrollment.id)}
                      className="text-[10px] font-mono uppercase text-red-600 opacity-50 hover:opacity-100"
                    >
                      Remover
                    </button>
                  </div>
                );
              })}
              {classEnrollments.length === 0 && (
                <p className="text-sm font-mono opacity-40 italic">Nenhum aluno matriculado nesta turma.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-widest border-b border-[#003366] pb-2">Matricular Aluno</h3>
            <form onSubmit={handleEnrollStudent} className="space-y-4 p-6 border border-[#003366] bg-white shadow-[4px_4px_0px_0px_rgba(0,51,102,1)]">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase opacity-50">Selecionar Aluno</label>
                <select name="studentId" required className="w-full p-3 border border-[#003366] text-sm focus:outline-none bg-white">
                  <option value="">Escolha um aluno</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-[#003366] text-white text-xs font-mono uppercase tracking-widest">
                Matricular
              </button>
            </form>
          </div>
        </div>

        <MaterialsSection classId={selectedClassId} materials={materials} user={profile} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Turmas</h1>
          <p className="text-sm font-mono opacity-50 uppercase mt-2">Horários e Grupos</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto px-6 py-3 bg-[#003366] text-white font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Nova Turma
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="p-4 sm:p-8 border border-[#003366] bg-white shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]"
        >
          <form onSubmit={handleAddClass} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Nome da Turma</label>
              <input name="name" placeholder="Ex: English 101" required className="w-full p-2 sm:p-3 border border-[#003366] text-sm focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Horário</label>
              <input name="schedule" placeholder="Ex: Seg/Qua 18:00" required className="w-full p-2 sm:p-3 border border-[#003366] text-sm focus:outline-none" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-xs font-mono uppercase opacity-50">Cancelar</button>
              <button type="submit" className="w-full sm:w-auto px-8 py-2 bg-[#003366] text-white text-xs font-mono uppercase tracking-widest">Criar Turma</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classes.map(cls => {
          const count = enrollments.filter(e => e.classId === cls.id).length;
          return (
            <div key={cls.id} className="p-4 sm:p-6 border border-[#003366] bg-white hover:shadow-[6px_6px_0px_0px_rgba(0,51,102,1)] transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border border-[#003366] flex items-center justify-center relative">
                  <GraduationCap size={24} />
                  {deletingId === cls.id ? (
                    <div className="absolute -top-12 -left-4 bg-white border border-[#003366] p-2 flex flex-col gap-1 shadow-lg z-10 w-24">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls.id);
                        }}
                        className="text-[8px] font-mono uppercase text-red-600 font-bold hover:underline"
                      >
                        Confirmar
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="text-[8px] font-mono uppercase opacity-40"
                      >
                        Sair
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(cls.id);
                      }}
                      className="absolute -top-2 -left-2 p-1 bg-white border border-red-600 text-red-600 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity hover:bg-red-50 rounded"
                      title="Eliminar Turma"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
                <span className="text-[10px] font-mono uppercase opacity-40">ID: {cls.id.slice(0, 6)}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-sans font-bold tracking-tight mb-2">{cls.name}</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs font-mono opacity-60">
                  <Calendar size={14} />
                  {cls.schedule}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono opacity-60">
                  <Users size={14} />
                  {count} Alunos
                </div>
              </div>
              <button 
                onClick={() => setSelectedClassId(cls.id)}
                className="w-full py-2 border border-[#003366] text-[10px] font-mono uppercase tracking-widest hover:bg-[#003366] hover:text-white transition-colors"
              >
                Gerir Turma
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinanceManager({ payments, students }: { payments: Payment[], students: Student[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      studentId: formData.get('studentId') as string,
      amount: Number(formData.get('amount')),
      dueDate: new Date(formData.get('dueDate') as string),
      referenceMonth: formData.get('referenceMonth') as string,
      status: 'PENDING' as PaymentStatus,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'payments'), data);
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'payments');
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payments', id));
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `payments/${id}`);
    }
  };

  const handleConfirmPayment = async (id: string) => {
    try {
      await updateDoc(doc(db, 'payments', id), {
        status: 'PAID',
        paidAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `payments/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Financeiro</h1>
          <p className="text-sm font-mono opacity-50 uppercase mt-2">Controle de Propinas</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto px-6 py-3 bg-[#003366] text-white font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Lançar Cobrança
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="p-8 border border-[#003366] bg-white shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]"
        >
          <form onSubmit={handleAddPayment} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Aluno</label>
              <select name="studentId" required className="w-full p-3 border border-[#003366] text-sm focus:outline-none bg-white">
                <option value="">Selecionar Aluno</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Valor (Kz)</label>
              <input name="amount" type="number" required className="w-full p-3 border border-[#003366] text-sm focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Vencimento</label>
              <input name="dueDate" type="date" required className="w-full p-3 border border-[#003366] text-sm focus:outline-none bg-white font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Mês de Referência</label>
              <input name="referenceMonth" type="month" required className="w-full p-3 border border-[#003366] text-sm focus:outline-none bg-white font-mono" />
            </div>
            <div className="md:col-span-3 flex justify-end gap-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-xs font-mono uppercase opacity-50">Cancelar</button>
              <button type="submit" className="px-8 py-2 bg-[#003366] text-white text-xs font-mono uppercase tracking-widest">Lançar</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        {payments.map(payment => {
          const student = students.find(s => s.id === payment.studentId);
          return (
            <div key={payment.id} className="p-4 sm:p-6 border border-[#003366] bg-white flex flex-col gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center border border-[#003366] ${payment.status === 'PAID' ? 'bg-green-50' : 'bg-orange-50'}`}>
                  {payment.status === 'PAID' ? <CheckCircle2 size={24} className="text-green-600" /> : <AlertCircle size={24} className="text-orange-600" />}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base sm:text-lg font-sans font-bold tracking-tight truncate">{student?.name || 'Aluno Desconhecido'}</h4>
                    {payment.referenceMonth && (
                      <span className="text-[10px] font-mono bg-[#003366] text-white px-2 py-0.5 rounded-full uppercase">
                        {formatReferenceMonth(payment.referenceMonth)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono uppercase opacity-50">Vencimento: {payment.dueDate?.toDate().toLocaleDateString()}</p>
                </div>
                {deletingId === payment.id ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeletePayment(payment.id)}
                      className="text-[10px] font-mono uppercase text-red-600 font-bold hover:underline"
                    >
                      Apagar
                    </button>
                    <button 
                      onClick={() => setDeletingId(null)}
                      className="text-[10px] font-mono uppercase opacity-40"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setDeletingId(payment.id)}
                    className="p-2 text-red-600 opacity-20 hover:opacity-100 hover:bg-red-50 transition-all rounded"
                    title="Eliminar Pagamento"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap items-end justify-between gap-4 pt-4 border-t border-[#003366] border-opacity-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase opacity-50">Valor</p>
                  <p className="text-xl font-mono font-bold">Kz {payment.amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-mono uppercase opacity-50">Status</p>
                  <p className={`text-xs font-mono uppercase font-bold ${payment.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                    {payment.status}
                  </p>
                </div>
                {payment.status !== 'PAID' && (
                  <button 
                    onClick={() => handleConfirmPayment(payment.id)}
                    className="w-full sm:w-auto px-6 py-3 bg-[#003366] text-white text-[10px] font-mono uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-[4px_4px_0px_0px_rgba(0,51,102,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    Confirmar Pagamento
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressManager({ students, grades }: { students: Student[], grades: Grade[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteGrade = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'grades', id));
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `grades/${id}`);
    }
  };

  const handleAddGrade = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      studentId: formData.get('studentId') as string,
      subject: formData.get('subject') as string,
      score: Number(formData.get('score')),
      date: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'grades'), data);
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'grades');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Progresso</h1>
          <p className="text-sm font-mono opacity-50 uppercase mt-2">Notas e Avaliações</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto px-6 py-3 bg-[#003366] text-white font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Lançar Nota
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="p-4 sm:p-8 border border-[#003366] bg-white shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]"
        >
          <form onSubmit={handleAddGrade} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Aluno</label>
              <select name="studentId" required className="w-full p-2 sm:p-3 border border-[#003366] text-sm focus:outline-none bg-white">
                <option value="">Selecionar Aluno</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Matéria / Habilidade</label>
              <input name="subject" placeholder="Ex: Speaking, Writing" required className="w-full p-2 sm:p-3 border border-[#003366] text-sm focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-50">Nota (0-100)</label>
              <input name="score" type="number" min="0" max="100" required className="w-full p-2 sm:p-3 border border-[#003366] text-sm focus:outline-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-xs font-mono uppercase opacity-50">Cancelar</button>
              <button type="submit" className="w-full sm:w-auto px-8 py-2 bg-[#003366] text-white text-xs font-mono uppercase tracking-widest">Salvar Nota</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {students.map(student => {
          const studentGrades = grades.filter(g => g.studentId === student.id);
          const avg = studentGrades.length > 0 
            ? (studentGrades.reduce((acc, g) => acc + g.score, 0) / studentGrades.length).toFixed(1)
            : 'N/A';

          return (
            <div key={student.id} className="p-4 sm:p-6 border border-[#003366] bg-white">
              <div className="flex justify-between items-start mb-4">
                <div className="overflow-hidden">
                  <h4 className="text-base sm:text-lg font-sans font-bold tracking-tight truncate">{student.name}</h4>
                  <p className="text-[10px] font-mono uppercase opacity-50">Nível: {student.level}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-mono uppercase opacity-50">Média</p>
                  <p className="text-xl sm:text-2xl font-mono font-bold">{avg}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {studentGrades.slice(0, 3).map(grade => (
                  <div key={grade.id} className="flex justify-between items-center text-xs border-t border-[#003366] border-opacity-5 pt-2 group/grade">
                    <div className="flex items-center gap-2">
                      <span className="font-mono uppercase opacity-60">{grade.subject}</span>
                      {deletingId === grade.id ? (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleDeleteGrade(grade.id)}
                            className="text-red-600 font-bold hover:underline"
                          >
                            Eliminar?
                          </button>
                          <button 
                            onClick={() => setDeletingId(null)}
                            className="opacity-40"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setDeletingId(grade.id)}
                          className="text-red-600 sm:opacity-0 sm:group-hover/grade:opacity-100 opacity-100 hover:underline"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                    <span className="font-bold">{grade.score}</span>
                  </div>
                ))}
                {studentGrades.length === 0 && <p className="text-[10px] font-mono opacity-30 italic">Sem avaliações registadas.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttendanceManager({ classes, students, enrollments, attendances }: { classes: Class[], students: Student[], enrollments: Enrollment[], attendances: Attendance[] }) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const classEnrollments = enrollments.filter(e => e.classId === selectedClassId);
  const enrolledStudents = classEnrollments
    .map(e => students.find(s => s.id === e.studentId))
    .filter((s): s is Student => s !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleMarkAttendance = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setIsSubmitting(true);
    const existing = attendances.find(a => a.studentId === studentId && a.classId === selectedClassId && a.date === selectedDate);
    
    try {
      if (existing) {
        await updateDoc(doc(db, 'attendance', existing.id), { status });
      } else {
        const id = `${selectedClassId}_${studentId}_${selectedDate}`;
        await setDoc(doc(db, 'attendance', id), {
          studentId,
          classId: selectedClassId,
          date: selectedDate,
          status
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatus = (studentId: string) => {
    return attendances.find(a => a.studentId === studentId && a.classId === selectedClassId && a.date === selectedDate)?.status;
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Chamada</h1>
        <p className="text-sm font-mono opacity-50 uppercase mt-2">Controle de Presenças</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#003366] bg-opacity-5 p-6 border border-[#003366] border-opacity-10 shadow-[4px_4px_0px_0px_rgba(0,51,102,0.1)]">
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase opacity-50">Selecione a Turma</label>
          <select 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full p-3 border border-[#003366] text-sm focus:outline-none bg-white"
          >
            <option value="">Escolha uma turma</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase opacity-50">Data da Aula</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3 border border-[#003366] text-sm focus:outline-none bg-white font-mono"
          />
        </div>
      </div>

      {!selectedClassId ? (
        <div className="text-center py-20 border-2 border-dashed border-[#003366] border-opacity-10">
          <UserCheck size={48} className="mx-auto opacity-10 mb-4" />
          <p className="font-mono text-sm opacity-40">Selecione uma turma para iniciar a chamada.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#003366] pb-2">
            <h3 className="text-xs font-mono uppercase tracking-widest">Alunos da Turma</h3>
            <p className="text-[10px] font-mono opacity-50">{enrolledStudents.length} Alunos</p>
          </div>

          <div className="space-y-3">
            {enrolledStudents.map(student => {
              const status = getStatus(student.id);
              return (
                <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[#003366] bg-white group hover:shadow-[4px_4px_0px_0px_rgba(0,51,102,1)] transition-all">
                  <div className="mb-4 sm:mb-0">
                    <p className="text-sm font-bold">{student.name}</p>
                    <p className="text-[10px] font-mono opacity-50 uppercase">{student.level}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {[
                      { id: 'PRESENT', label: 'P', color: 'bg-green-600', full: 'Presente' },
                      { id: 'ABSENT', label: 'F', color: 'bg-red-600', full: 'Falta' },
                      { id: 'LATE', label: 'A', color: 'bg-orange-500', full: 'Atraso' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        disabled={isSubmitting}
                        onClick={() => handleMarkAttendance(student.id, opt.id as any)}
                        className={`w-10 h-10 flex items-center justify-center text-xs font-mono font-bold transition-all border border-[#003366] ${
                          status === opt.id 
                            ? `${opt.color} text-white scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` 
                            : 'bg-white text-[#003366] opacity-30 hover:opacity-100'
                        }`}
                        title={opt.full}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {enrolledStudents.length === 0 && (
              <p className="text-center py-12 text-sm font-mono opacity-40 italic">Esta turma não possui alunos matriculados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentOverview({ profile, students, classes, attendances, payments, grades }: { 
  profile: UserProfile | null, 
  students: Student[], 
  classes: Class[], 
  attendances: Attendance[], 
  payments: Payment[], 
  grades: Grade[] 
}) {
  const myGrades = grades.filter(g => g.studentId === profile?.studentId);
  const avg = myGrades.length > 0 ? (myGrades.reduce((acc, g) => acc + g.score, 0) / myGrades.length).toFixed(1) : 'N/A';
  const myAttendances = attendances.filter(a => a.studentId === profile?.studentId);
  const presenceRate = myAttendances.length > 0 
    ? Math.round((myAttendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length / myAttendances.length) * 100)
    : 0;
  const pendingPayments = payments.filter(p => p.studentId === profile?.studentId && p.status === 'PENDING').length;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Olá, {profile?.name}</h1>
        <p className="text-sm font-mono opacity-50 uppercase mt-2">Bem-vindo ao seu painel acadêmico</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Média Atual', value: avg, icon: GraduationCap },
          { label: 'Presença', value: `${presenceRate}%`, icon: UserCheck },
          { label: 'Pendências Financeiras', value: pendingPayments, icon: AlertCircle, color: pendingPayments > 0 ? 'text-red-600' : 'text-green-600' },
        ].map((stat, i) => (
          <div key={i} className="p-6 border border-[#003366] bg-white shadow-[4px_4px_0px_0px_rgba(0,51,102,1)]">
            <stat.icon size={20} className="opacity-40 mb-4" />
            <p className="text-[10px] font-mono uppercase opacity-50 mb-1">{stat.label}</p>
            <p className={`text-3xl font-serif ${stat.color || ''}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-widest border-b border-[#003366] pb-2">Últimas Notas</h3>
          <div className="space-y-4">
            {myGrades.slice(0, 5).map(grade => (
              <div key={grade.id} className="flex justify-between items-center p-4 border border-[#003366] bg-white">
                <div>
                  <p className="text-sm font-bold">{grade.subject}</p>
                  <p className="text-[10px] font-mono opacity-40 uppercase">{new Date(grade.date?.toDate?.() || grade.date).toLocaleDateString()}</p>
                </div>
                <span className="text-xl font-mono font-bold">{grade.score}</span>
              </div>
            ))}
            {myGrades.length === 0 && <p className="text-sm font-mono opacity-40 italic">Nenhuma nota registada ainda.</p>}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-widest border-b border-[#003366] pb-2">Resumo de Presenças</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border border-[#003366] border-opacity-10">
              <p className="text-2xl font-mono font-bold text-green-600">{myAttendances.filter(a => a.status === 'PRESENT').length}</p>
              <p className="text-[9px] font-mono uppercase opacity-50">Presente</p>
            </div>
            <div className="text-center p-4 border border-[#003366] border-opacity-10">
              <p className="text-2xl font-mono font-bold text-red-600">{myAttendances.filter(a => a.status === 'ABSENT').length}</p>
              <p className="text-[9px] font-mono uppercase opacity-50">Faltas</p>
            </div>
            <div className="text-center p-4 border border-[#003366] border-opacity-10">
              <p className="text-2xl font-mono font-bold text-orange-500">{myAttendances.filter(a => a.status === 'LATE').length}</p>
              <p className="text-[9px] font-mono uppercase opacity-50">Atrasos</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StudentClasses({ profile, enrollments, classes, attendances, materials }: { 
  profile: UserProfile | null, 
  enrollments: Enrollment[], 
  classes: Class[], 
  attendances: Attendance[],
  materials: Material[]
}) {
  const myEnrollments = enrollments.filter(e => e.studentId === profile?.studentId);
  const myClasses = myEnrollments.map(e => classes.find(c => c.id === e.classId)).filter((c): c is Class => c !== undefined);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Minhas Aulas</h1>
        <p className="text-sm font-mono opacity-50 uppercase mt-2">Suas turmas e horários</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myClasses.map(cls => {
          const classAttendances = attendances.filter(a => a.classId === cls.id && a.studentId === profile?.studentId);
          return (
            <div key={cls.id} className="p-6 border border-[#003366] bg-white group hover:shadow-[4px_4px_0px_0px_rgba(0,51,102,1)] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold">{cls.name}</h3>
                  <div className="flex items-center gap-2 text-xs font-mono opacity-60 mt-1 uppercase">
                    <Calendar size={12} />
                    {cls.schedule}
                  </div>
                </div>
                <BookOpen size={24} className="opacity-20" />
              </div>
              
              <div className="space-y-4">
                <h4 className="text-[10px] font-mono uppercase opacity-40 tracking-widest border-b border-[#003366] border-opacity-10 pb-1">Histórico nesta turma</h4>
                <div className="flex flex-wrap gap-1">
                  {classAttendances.slice(-10).map((a, i) => (
                    <div 
                      key={i} 
                      className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono font-bold border ${
                        a.status === 'PRESENT' ? 'bg-green-600 text-white border-green-600' : 
                        a.status === 'ABSENT' ? 'bg-red-600 text-white border-red-600' : 
                        'bg-orange-500 text-white border-orange-500'
                      }`}
                      title={`${a.date}: ${a.status}`}
                    >
                      {a.status[0]}
                    </div>
                  ))}
                  {classAttendances.length === 0 && <p className="text-[10px] font-mono opacity-30 italic">Sem registos ainda.</p>}
                </div>
              </div>
              <MaterialsSection classId={cls.id} materials={materials} user={profile} />
            </div>
          );
        })}
        {myClasses.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-[#003366] border-opacity-10">
            <BookOpen size={48} className="mx-auto opacity-10 mb-4" />
            <p className="font-mono text-sm opacity-40">Você não está matriculado em nenhuma turma no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StudentProgress({ profile, grades }: { profile: UserProfile | null, grades: Grade[] }) {
  const myGrades = grades.filter(g => g.studentId === profile?.studentId);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Meu Progresso</h1>
        <p className="text-sm font-mono opacity-50 uppercase mt-2">Suas avaliações e desempenho</p>
      </header>

      <div className="p-4 sm:p-8 border border-[#003366] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#003366] border-opacity-10">
              <th className="py-4 px-2 text-left text-[10px] font-mono uppercase opacity-50">Matéria / Avaliação</th>
              <th className="py-4 px-2 text-left text-[10px] font-mono uppercase opacity-50">Data</th>
              <th className="py-4 px-2 text-right text-[10px] font-mono uppercase opacity-50">Nota</th>
            </tr>
          </thead>
          <tbody>
            {myGrades.map(grade => (
              <tr key={grade.id} className="border-b border-[#003366] border-opacity-5 hover:bg-[#003366] hover:bg-opacity-5 transition-colors group">
                <td className="py-4 px-2 text-sm font-bold">{grade.subject}</td>
                <td className="py-4 px-2 text-xs font-mono opacity-60">
                   {new Date(grade.date?.toDate?.() || grade.date).toLocaleDateString()}
                </td>
                <td className="py-4 px-2 text-right">
                  <span className={`text-lg font-mono font-bold ${grade.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                    {grade.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {myGrades.length === 0 && (
          <p className="text-center py-12 text-sm font-mono opacity-40 italic">Ainda não há notas lançadas para o seu perfil.</p>
        )}
      </div>
    </div>
  );
}

function StudentFinance({ profile, payments }: { profile: UserProfile | null, payments: Payment[] }) {
  const myPayments = payments.filter(p => p.studentId === profile?.studentId);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Financeiro</h1>
        <p className="text-sm font-mono opacity-50 uppercase mt-2">Mensalidades e pagamentos</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myPayments.map(payment => (
          <div key={payment.id} className="p-6 border border-[#003366] bg-white flex justify-between items-center group hover:shadow-[4px_4px_0px_0px_rgba(0,51,102,1)] transition-all">
            <div>
               <div className="flex items-center gap-2 mb-1">
                 <p className="text-xl font-mono font-bold">Kz {payment.amount.toLocaleString()}</p>
                 <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${
                   payment.status === 'PAID' ? 'bg-green-600 text-white border-green-600' :
                   payment.status === 'OVERDUE' ? 'bg-red-600 text-white border-red-600' :
                   'bg-white text-orange-600 border-orange-600'
                 }`}>
                   {payment.status === 'PAID' ? 'Pago' : payment.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                 </span>
               </div>
               
               {payment.referenceMonth && (
                 <p className="text-xs font-mono font-bold text-[#003366] uppercase mb-2">
                   Mês de Referência: {formatReferenceMonth(payment.referenceMonth)}
                 </p>
               )}

               <p className="text-[10px] font-mono opacity-50 uppercase">
                 Vence em: {new Date(payment.dueDate?.toDate?.() || payment.dueDate).toLocaleDateString()}
               </p>
               {payment.paidAt && (
                 <p className="text-[9px] font-mono text-green-600 uppercase mt-1">
                   Pago em: {new Date(payment.paidAt?.toDate?.() || payment.paidAt).toLocaleDateString()}
                 </p>
               )}
            </div>
            <CreditCard className="opacity-10 group-hover:opacity-40 transition-opacity" size={32} />
          </div>
        ))}
        {myPayments.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-[#003366] border-opacity-10">
            <CreditCard size={48} className="mx-auto opacity-10 mb-4" />
            <p className="font-mono text-sm opacity-40">Nenhum registo financeiro encontrado.</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-[#003366] bg-opacity-5 border border-[#003366] border-opacity-10">
         <div className="flex items-start gap-4">
            <AlertCircle className="text-[#003366] flex-shrink-0" size={20} />
            <div className="space-y-2">
               <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#003366]">Informação de Pagamento</h4>
               <p className="text-xs opacity-70 leading-relaxed">
                 Para regularizar suas pendências, dirija-se à secretaria da escola ou utilize os dados bancários informados na sua ficha de inscrição. Em caso de dúvidas, contate o suporte.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}

function MaterialsSection({ classId, materials, user }: { classId: string, materials: Material[], user: UserProfile | null }) {
  const [isAdding, setIsAdding] = useState(false);
  const [uploadType, setUploadType] = useState<'LINK' | 'FILE'>('LINK');
  const [progress, setProgress] = useState<number | null>(null);
  const classMaterials = materials.filter(m => m.classId === classId);

  const handleAddMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const type = formData.get('type') as any;

    if (uploadType === 'FILE') {
      const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      
      if (!file) return;

      const storageRef = ref(storage, `materials/${classId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (error) => {
          console.error("Upload error:", error);
          setProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await saveToFirestore(title, downloadURL, type);
          setProgress(null);
          setIsAdding(false);
        }
      );
    } else {
      const url = formData.get('url') as string;
      await saveToFirestore(title, url, type);
      setIsAdding(false);
    }
  };

  const saveToFirestore = async (title: string, url: string, type: any) => {
    const data = {
      title,
      url,
      type,
      classId,
      teacherId: user?.id || '',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'materials'), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'materials');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'materials', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `materials/${id}`);
    }
  };

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-[#003366] border-opacity-10">
      <div className="flex justify-between items-center">
        <h4 className="text-[10px] font-mono uppercase opacity-50 tracking-widest flex items-center gap-2">
          <FileText size={12} />
          Materiais & Conteúdos
        </h4>
        {user?.role !== 'STUDENT' && (
          <button 
            type="button"
            onClick={() => {
              setIsAdding(!isAdding);
              setProgress(null);
            }}
            className="text-[10px] font-mono uppercase text-[#003366] font-bold hover:underline"
          >
            {isAdding ? 'Fechar' : '+ Adicionar Material'}
          </button>
        )}
      </div>

      {isAdding && user?.role !== 'STUDENT' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border border-[#003366] bg-[#003366] space-y-6"
        >
          <div className="flex gap-4 border-b border-white border-opacity-10 pb-4">
            <button 
              type="button"
              onClick={() => setUploadType('LINK')}
              className={`text-[10px] font-mono uppercase tracking-widest pb-1 border-b-2 transition-all ${uploadType === 'LINK' ? 'border-white text-white opacity-100' : 'border-transparent text-white opacity-40'}`}
            >
              Link Externo
            </button>
            <button 
              type="button"
              onClick={() => setUploadType('FILE')}
              className={`text-[10px] font-mono uppercase tracking-widest pb-1 border-b-2 transition-all ${uploadType === 'FILE' ? 'border-white text-white opacity-100' : 'border-transparent text-white opacity-40'}`}
            >
              Upload de Ficheiro
            </button>
          </div>

          <form onSubmit={handleAddMaterial} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-white opacity-60">Título do Material</label>
              <input name="title" required placeholder="Ex: PDF Aula 01" className="w-full p-2 border border-white border-opacity-20 text-xs focus:outline-none bg-white font-sans text-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-white opacity-60">Tipo</label>
              <select name="type" required className="w-full p-2 border border-white border-opacity-20 text-xs focus:outline-none bg-white font-sans text-black">
                {uploadType === 'LINK' ? (
                  <>
                    <option value="DOCUMENT">Documento (Link)</option>
                    <option value="LINK">Link Geral</option>
                    <option value="DRIVE">Google Drive</option>
                    <option value="VIDEO">Vídeo (URL)</option>
                  </>
                ) : (
                  <>
                    <option value="DOCUMENT">Documento (Word/Excel/etc)</option>
                    <option value="PDF">Documento PDF</option>
                    <option value="VIDEO">Ficheiro de Vídeo</option>
                    <option value="LINK">Outro Ficheiro</option>
                  </>
                )}
              </select>
            </div>
            
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-mono uppercase text-white opacity-60">
                {uploadType === 'LINK' ? 'URL / Link' : 'Selecionar Ficheiro'}
              </label>
              {uploadType === 'LINK' ? (
                <input name="url" type="url" required={uploadType === 'LINK'} placeholder="https://..." className="w-full p-2 border border-white border-opacity-20 text-xs focus:outline-none bg-white font-mono text-black" />
              ) : (
                <div className="relative border-2 border-dashed border-white border-opacity-20 p-8 text-center group hover:border-opacity-100 transition-all bg-white bg-opacity-5">
                   <input type="file" required={uploadType === 'FILE'} className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const titleInput = (e.target.form as any).title;
                       if (!titleInput.value) titleInput.value = file.name.split('.')[0];
                     }
                   }} />
                   <div className="space-y-2">
                     <UploadCloud className="mx-auto text-white opacity-40 group-hover:opacity-100 transition-all" size={32} />
                     <p className="text-[10px] font-mono uppercase text-white opacity-60">Clique ou arraste para carregar</p>
                   </div>
                </div>
              )}
            </div>

            {progress !== null && (
              <div className="sm:col-span-2 space-y-1">
                 <div className="flex justify-between text-[8px] font-mono uppercase text-white">
                   <span>A carregar ficheiro...</span>
                   <span>{Math.round(progress)}%</span>
                 </div>
                 <div className="h-1 bg-white bg-opacity-20 overflow-hidden">
                   <motion.div 
                     className="h-full bg-white" 
                     initial={{ width: 0 }}
                     animate={{ width: `${progress}%` }}
                   />
                 </div>
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <button 
                type="submit" 
                disabled={progress !== null}
                className="px-6 py-2 bg-white text-[#003366] text-[10px] font-mono uppercase font-bold tracking-widest hover:bg-opacity-90 disabled:opacity-50 transition-colors"
              >
                {progress !== null ? 'Processando...' : 'Publicar Material'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {classMaterials.map(m => (
          <div key={m.id} className="p-4 border border-[#003366] bg-white flex items-center justify-between group/mat transition-all hover:bg-[#003366] hover:bg-opacity-5">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-[#003366] bg-opacity-5 text-[#003366]">
                  {m.type === 'VIDEO' ? <Video size={16} /> : (m.type === 'PDF' || m.type === 'DOCUMENT') ? <FileDown size={16} /> : m.type === 'DRIVE' ? <Link2 size={16} /> : <FileText size={16} />}
               </div>
               <div className="overflow-hidden">
                 <p className="text-xs font-bold truncate">{m.title}</p>
                 <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-[#003366] opacity-40 hover:opacity-100 flex items-center gap-1 uppercase tracking-tighter">
                   <ExternalLink size={10} />
                   Aceder ao {(m.type === 'PDF' || m.type === 'DOCUMENT') ? 'Documento' : m.type === 'VIDEO' ? 'Vídeo' : 'Link'}
                 </a>
               </div>
            </div>
            {user?.role !== 'STUDENT' && (
              <button 
                type="button"
                onClick={() => handleDeleteMaterial(m.id)}
                className="p-2 text-red-600 opacity-20 hover:opacity-100 transition-opacity"
                title="Eliminar Material"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        {classMaterials.length === 0 && (
          <p className="text-[10px] font-mono opacity-30 italic">Sem materiais publicados para esta turma.</p>
        )}
      </div>
    </div>
  );
}
