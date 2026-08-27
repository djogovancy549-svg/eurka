import { IndependenceDayBanner } from './components/IndependenceDayBanner';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { initAuth, googleSignIn, logout, getAccessToken } from './auth';
import { User } from 'firebase/auth';
import { RefreshProvider, useRefresh } from './context/RefreshContext';
import RefreshButton from './components/RefreshButton';
import Settings from './components/Settings';
import BidangDashboard from './components/BidangDashboard';
import AdminDashboard from './components/AdminDashboard';
import RenjaDashboard from './components/RenjaDashboard';
import UrkRenjaMatrix from './components/UrkRenjaMatrix';
import DpaDashboard from './components/DpaDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NotificationCenter from './components/NotificationCenter';
import PlanningBanner from './components/PlanningBanner';
import { 
  LogOut, 
  Settings as SettingsIcon, 
  LayoutDashboard, 
  FileSpreadsheet, 
  FolderGit2, 
  GitMerge, 
  Layers, 
  BookOpen, 
  ShieldCheck,
  WalletCards,
  BarChart3,
  Bell,
  Menu,
  X,
  CheckCircle2
} from 'lucide-react';
import { ADMIN_EMAILS } from './types';

function GlobalRefreshToast() {
  const { refreshSuccessMsg } = useRefresh();
  if (!refreshSuccessMsg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
      <div className="bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 text-xs font-bold backdrop-blur-md">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{refreshSuccessMsg}</span>
      </div>
    </div>
  );
}

function MainApp() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isAdmin = !!(user && user.email && ADMIN_EMAILS.includes(user.email));

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setUser(user);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6 animate-in zoom-in-95">
          <IndependenceDayBanner />
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">e-URK DPUPR Nagekeo</h1>
            <p className="text-slate-500 text-xs mt-1">Sistem Informasi Perencanaan, RENJA, DPA & Realisasi SPPD</p>
          </div>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 rounded-2xl px-4 py-3 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 active:scale-95"
          >
            <svg viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            {isLoggingIn ? 'Memproses Masuk...' : 'Masuk dengan Akun Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 flex overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-950 flex flex-col text-slate-300 border-r border-slate-800 transition-transform duration-200 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Logo & Title */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-yellow-400/20">
              NK
            </div>
            <div>
              <h1 className="text-white font-black leading-tight tracking-tight">e-URK DIGITAL</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">DPUPR NAGEKEO</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)} 
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2 tracking-widest">
            Modul Perencanaan & Anggaran
          </div>
          
          {/* 1. Usulan Rencana Kerja (e-URK) */}
          <NavLink 
            to="/" 
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="truncate">e-URK (Aspirasi)</div>
              <div className="text-[10px] font-normal opacity-75 truncate">Penampungan & Filter SIPD</div>
            </div>
          </NavLink>

          {/* 2. Rencana Kerja OPD (RENJA) */}
          <NavLink 
            to="/renja" 
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`
            }
          >
            <FolderGit2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="truncate">RENJA OPD Dinas</div>
              <div className="text-[10px] font-normal opacity-75 truncate">Program, Keg & Sub-Keg</div>
            </div>
          </NavLink>

          {/* 3. Matriks Keterkaitan URK ↔ RENJA */}
          <NavLink 
            to="/matriks" 
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`
            }
          >
            <GitMerge className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="truncate">Matriks URK ↔ RENJA</div>
              <div className="text-[10px] font-normal opacity-75 truncate">Penyelarasan Aspirasi</div>
            </div>
          </NavLink>

          {/* 4. Dokumen Pelaksanaan Anggaran (DPA) & SPPD */}
          <NavLink 
            to="/dpa" 
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`
            }
          >
            <WalletCards className="w-4 h-4 text-yellow-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="truncate">DPA & Realisasi SPPD</div>
              <div className="text-[10px] font-normal opacity-75 truncate">Anggaran & Realisasi Fisik</div>
            </div>
          </NavLink>

          {/* 5. Executive Analytics Dashboard */}
          <NavLink 
            to="/analytics" 
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`
            }
          >
            <BarChart3 className="w-4 h-4 text-pink-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="truncate">Analitik & Rekapitulasi</div>
              <div className="text-[10px] font-normal opacity-75 truncate">Executive Data Center</div>
            </div>
          </NavLink>

          {isAdmin && (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase px-3 pt-5 pb-2 tracking-widest">
                Administrator
              </div>
              <NavLink 
                to="/settings" 
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                <SettingsIcon className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">Pengaturan & Biaya</div>
                  <div className="text-[10px] font-normal opacity-75 truncate">Aturan, Keamanan, Wilayah</div>
                </div>
              </NavLink>
            </>
          )}
        </nav>

        {/* User Profile Card */}
        <div className="p-4 mt-auto border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3 mb-3 px-1">
            <img 
              src={user?.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + (user?.displayName || 'User')} 
              alt="Profile" 
              className="w-9 h-9 rounded-xl bg-slate-800 object-cover shadow-sm" 
            />
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Pegawai OPD'}</p>
              <p className="text-[10px] text-slate-400 truncate">{isAdmin ? 'Administrator Utama' : 'Pengguna Bidang'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Sesi
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Server Terhubung &bull; Dinas PUPR Kab. Nagekeo TA 2025</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* TOMBOL REFRESH / SINKRON DATA GLOBAL */}
            <RefreshButton variant="header" label="Segarkan Data" />

            <div className="h-6 w-px bg-slate-200" />

            {/* NOTIFICATION CENTER DROPDOWN */}
            <NotificationCenter 
              userEmail={user?.email || 'user@nagekeokab.go.id'} 
              isAdmin={isAdmin} 
            />

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">{user?.displayName}</div>
                <div className="text-[10px] font-semibold text-slate-400">{user?.email}</div>
              </div>
              <img 
                src={user?.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + (user?.displayName || 'User')} 
                alt="Profile" 
                className="w-8 h-8 rounded-xl bg-slate-100 object-cover shadow-2xs border border-slate-200" 
              />
            </div>
          </div>
        </header>

        {/* Body Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PlanningBanner />
            <Routes>
              <Route 
                path="/" 
                element={
                  isAdmin ? (
                    <AdminDashboard userEmail={user?.email || ''} userName={user?.displayName || ''} />
                  ) : (
                    <BidangDashboard userEmail={user?.email || ''} userName={user?.displayName || ''} />
                  )
                } 
              />
              <Route 
                path="/renja" 
                element={
                  <RenjaDashboard 
                    userEmail={user?.email || ''} 
                    userName={user?.displayName || ''} 
                    isAdmin={isAdmin} 
                  />
                } 
              />
              <Route 
                path="/matriks" 
                element={
                  <UrkRenjaMatrix 
                    userEmail={user?.email || ''} 
                    userName={user?.displayName || ''} 
                    isAdmin={isAdmin} 
                  />
                } 
              />
              <Route 
                path="/dpa" 
                element={
                  <DpaDashboard 
                    userEmail={user?.email || ''} 
                    userName={user?.displayName || ''} 
                    isAdmin={isAdmin} 
                  />
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <AnalyticsDashboard 
                    userEmail={user?.email || ''} 
                    userName={user?.displayName || ''} 
                    isAdmin={isAdmin} 
                  />
                } 
              />
              {isAdmin && (
                <Route 
                  path="/settings" 
                  element={
                    <Settings 
                      userEmail={user?.email || ''} 
                      userName={user?.displayName || ''} 
                      isAdmin={isAdmin} 
                    />
                  } 
                />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      <GlobalRefreshToast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RefreshProvider>
        <MainApp />
      </RefreshProvider>
    </BrowserRouter>
  );
}
