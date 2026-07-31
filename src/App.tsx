import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { initAuth, googleSignIn, logout, getAccessToken } from './auth';
import { User } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { LogOut, Settings as SettingsIcon, LayoutDashboard, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(localStorage.getItem('urk_spreadsheet_id'));

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

  const updateSpreadsheetId = (id: string) => {
    setSpreadsheetId(id);
    localStorage.setItem('urk_spreadsheet_id', id);
  };

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">URK PUPR Nagekeo</h1>
            <p className="text-slate-500 mt-2">Sistem Informasi Usulan Rencana Kerja</p>
          </div>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 48 48" className="w-6 h-6">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 h-full flex flex-col text-slate-300 border-r border-slate-800">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-blue-900 font-extrabold text-xl shadow-lg shadow-yellow-400/20">
              NK
            </div>
            <div>
              <h1 className="text-white font-bold leading-tight">e-URK DIGITAL</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">PUPR NAGEKEO</p>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-2 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-4 tracking-widest">Main Menu</div>
            <Link to="/" className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-yellow-400/20 hover:text-blue-900 text-slate-300">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-yellow-400/20 hover:text-blue-900 text-slate-300">
              <SettingsIcon className="w-5 h-5" />
              <span>Pengaturan Admin</span>
            </Link>
          </nav>

          <div className="p-6 mt-auto border-t border-slate-800">
            <div className="bg-blue-950 rounded-2xl p-4 border border-blue-900/50 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-[10px] text-slate-400">Google Sheets Sync</span>
              </div>
              <p className="text-xs text-slate-300">Connected: <span className="text-yellow-400 font-mono">{spreadsheetId ? 'Aktif' : 'Off'}</span></p>
            </div>
            <div className="flex items-center gap-3 mb-4 px-2">
              <img src={user?.photoURL || ''} alt="Profile" className="w-10 h-10 rounded-full bg-slate-700 shadow-md" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.displayName}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!spreadsheetId && (
            <div className="bg-amber-50 border-b border-amber-200 p-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <p className="text-amber-800 text-sm font-medium">
                  Google Sheet belum dikonfigurasi. Silakan atur Spreadsheet ID di Pengaturan.
                </p>
                <Link to="/settings" className="text-amber-900 text-sm font-semibold hover:underline">
                  Buka Pengaturan &rarr;
                </Link>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-5xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard spreadsheetId={spreadsheetId} userEmail={user?.email || ''} userName={user?.displayName || ''} />} />
                <Route path="/settings" element={<Settings spreadsheetId={spreadsheetId} updateSpreadsheetId={updateSpreadsheetId} />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
