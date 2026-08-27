import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Inbox, 
  FileText, 
  Layers, 
  ShieldCheck, 
  Coins, 
  Car, 
  AlertTriangle,
  X
} from 'lucide-react';
import { AppNotification } from '../types';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearNotifications 
} from '../services/notificationService';

interface NotificationCenterProps {
  userEmail: string;
  isAdmin: boolean;
}

export default function NotificationCenter({ userEmail, isAdmin }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'semua' | 'usulan' | 'renja_dpa' | 'sppd' | 'keamanan'>('semua');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifs = async () => {
    try {
      const data = await getNotifications(userEmail, isAdmin);
      setNotifications(data);
    } catch (e) {
      console.warn('Error loading notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifs();
    // Poll every 15 seconds for fresh notifications
    const interval = setInterval(loadNotifs, 15000);
    return () => clearInterval(interval);
  }, [userEmail, isAdmin]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !(n.readBy || []).includes(userEmail)).length;

  const handleMarkAsRead = async (notifId: string) => {
    await markNotificationAsRead(notifId, userEmail);
    setNotifications(prev => prev.map(n => {
      if (n.id === notifId) {
        return { ...n, readBy: [...(n.readBy || []), userEmail] };
      }
      return n;
    }));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(userEmail, isAdmin);
    setNotifications(prev => prev.map(n => ({
      ...n,
      readBy: Array.from(new Set([...(n.readBy || []), userEmail]))
    })));
  };

  const handleClearAll = async () => {
    if (window.confirm('Bersihkan seluruh daftar notifikasi?')) {
      await clearNotifications();
      setNotifications([]);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeTab === 'semua') return true;
    if (activeTab === 'usulan') return n.type.startsWith('proposal_');
    if (activeTab === 'renja_dpa') return n.type === 'renja_linked' || n.type === 'dpa_updated';
    if (activeTab === 'sppd') return n.type.startsWith('sppd_');
    if (activeTab === 'keamanan') return n.type === 'security_alert' || n.type === 'system_info';
    return true;
  });

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'proposal_new':
        return <div className="p-2 rounded-lg bg-blue-100 text-blue-700"><Inbox className="w-4 h-4" /></div>;
      case 'proposal_status':
        return <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700"><Check className="w-4 h-4" /></div>;
      case 'renja_linked':
        return <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700"><Layers className="w-4 h-4" /></div>;
      case 'dpa_updated':
        return <div className="p-2 rounded-lg bg-amber-100 text-amber-700"><Coins className="w-4 h-4" /></div>;
      case 'sppd_submitted':
      case 'sppd_cair':
        return <div className="p-2 rounded-lg bg-teal-100 text-teal-700"><Car className="w-4 h-4" /></div>;
      case 'security_alert':
        return <div className="p-2 rounded-lg bg-rose-100 text-rose-700"><AlertTriangle className="w-4 h-4" /></div>;
      case 'system_info':
      default:
        return <div className="p-2 rounded-lg bg-slate-100 text-slate-700"><ShieldCheck className="w-4 h-4" /></div>;
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      return `${diffDays} hari lalu`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Pusat Notifikasi & Aktivitas"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Notifikasi e-URK & DPA</h4>
                <p className="text-[11px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1.5 text-xs text-blue-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {isAdmin && notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Kosongkan notifikasi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/80 px-2 py-1 gap-1 overflow-x-auto text-[11px] font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('semua')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'semua' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-slate-200/60'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveTab('usulan')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'usulan' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-slate-200/60'
              }`}
            >
              Usulan
            </button>
            <button
              onClick={() => setActiveTab('renja_dpa')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'renja_dpa' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-slate-200/60'
              }`}
            >
              RENJA & DPA
            </button>
            <button
              onClick={() => setActiveTab('sppd')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'sppd' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-slate-200/60'
              }`}
            >
              SPPD
            </button>
            <button
              onClick={() => setActiveTab('keamanan')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'keamanan' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-slate-200/60'
              }`}
            >
              Sistem
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifs.length === 0 ? (
              <div className="py-10 text-center text-slate-400 px-4">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium">Tidak ada notifikasi di kategori ini</p>
              </div>
            ) : (
              filteredNotifs.map((notif) => {
                const isRead = (notif.readBy || []).includes(userEmail);
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors flex items-start gap-3 hover:bg-slate-50 ${
                      !isRead ? 'bg-blue-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h5 className={`text-xs truncate ${!isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {notif.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      
                      <div className="mt-2 flex items-center justify-between">
                        {!isRead ? (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Tandai Dibaca
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sudah dibaca</span>
                        )}

                        {notif.linkUrl && (
                          <a
                            href={notif.linkUrl}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
                          >
                            Buka <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] font-semibold text-slate-500">
              Sistem Notifikasi Terpadu • DPUPR Kab. Nagekeo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
