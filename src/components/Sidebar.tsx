import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Users, 
  Megaphone, 
  Settings, 
  CreditCard,
  LogOut,
  Sparkles,
  Layers,
  CheckCircle2
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userEmail?: string;
  onLogout?: () => void;
  currentPlan?: string;
}

export default function Sidebar({ currentView, onViewChange, userEmail = "countdurular@gmail.com", onLogout, currentPlan = "PRO Plan" }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inbox", label: "AI Inbox", icon: Inbox, badge: "AI Active" },
    { id: "crm", label: "CRM Contacts", icon: Users },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "whatsapp", label: "WhatsApp Link", icon: Settings },
    { id: "workspace", label: "Workspace Link", icon: Sparkles, badge: "Sync Live" },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
  ];

  return (
    <aside id="app-sidebar" className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between h-full select-none shrink-0">
      <div>
        {/* Editorial Brand Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-black text-sm tracking-tighter">
              W
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">
                WA-AI.PLATFORM
              </h1>
              <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-1">Marketing Suite</p>
            </div>
          </div>
        </div>

        {/* Navigation Items (Editorial Style: simple, elegant spacing) */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-btn-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium text-sm transition-colors text-left cursor-pointer ${
                  isActive
                    ? "bg-slate-100 text-black font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-slate-200/60 text-slate-800 px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase tracking-wide">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Meta API status & active credentials */}
      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-3 px-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Meta API Live</span>
        </div>

        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-xs shrink-0 font-mono border border-slate-200">
              {userEmail.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-800 font-semibold truncate leading-none mb-1">Alex Rivera</p>
              <p className="text-[10px] text-slate-400 font-mono truncate leading-none">{currentPlan}</p>
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              id="logout-btn"
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
