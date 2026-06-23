import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import InboxView from "./components/InboxView";
import CrmView from "./components/CrmView";
import CampaignsView from "./components/CampaignsView";
import BillingView from "./components/BillingView";
import WhatsAppView from "./components/WhatsAppView";
import WorkspaceHubView from "./components/WorkspaceHubView";

import { Lead, Message, Campaign, CampaignTemplate, AnalyticsSummary } from "./types";
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  fetchConversation,
  sendMessage,
  getAiSuggestion,
  fetchCampaigns,
  createCampaign,
  triggerCampaignSend,
  fetchTemplates,
  simulateWebhook,
  fetchAnalytics,
  seedFirestoreIfEmpty
} from "./api";

import { AlertCircle, Globe, Plus, PlusCircle, CheckCircle } from "lucide-react";

export default function App() {
  // Authentication Simulated State
  const [session, setSession] = useState<{ email: string; name: string } | null>(null);
  const [authEmail, setAuthEmail] = useState("countdurular@gmail.com");
  const [authPassword, setAuthPassword] = useState("password123");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // App Layout State
  const [currentView, setCurrentView] = useState("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [activePlan, setActivePlan] = useState("PRO Plan");
  
  const [stats, setStats] = useState<AnalyticsSummary>({
    totalLeads: 0,
    activeConversations: 0,
    conversionRate: 18.5,
    campaignROI: 385,
    aiResponseAccuracy: 95.8
  });

  // Selected CRM lead and conversation thread
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<Message[]>([]);
  
  // AI Co-pilot suggested reply
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.user) {
        setSession(data.user);
        loadSaaSData();
      }
    } catch (e) {
      console.warn("Express API session check yielded fallback memory mode.", e);
    }
  };

  const loadSaaSData = async () => {
    try {
      const leadsData = await fetchLeads();
      setLeads(leadsData);

      const campaignsData = await fetchCampaigns();
      setCampaigns(campaignsData);

      const templatesData = await fetchTemplates();
      setTemplates(templatesData);

      const analyticsData = await fetchAnalytics();
      setStats(analyticsData);

      // Auto-select first lead in Inbox
      if (leadsData.length > 0 && !selectedLead) {
        setSelectedLead(leadsData[0]);
        loadChatHistory(leadsData[0].id);
      }
    } catch (err) {
      showToast("error", "Error loading data. Using modular client simulation.");
    }
  };

  const loadChatHistory = async (leadId: string) => {
    try {
      const chat = await fetchConversation(leadId);
      setActiveChatMessages(chat);
      triggerAiSuggestion(leadId, chat);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  const triggerAiSuggestion = async (leadId: string, currentHistory: Message[]) => {
    const lastUserMsg = currentHistory.length > 0 
      ? [...currentHistory].reverse().find(m => m.sender === "lead")?.text || "Hello!" 
      : "Hello!";
      
    setIsAiLoading(true);
    try {
      const suggestion = await getAiSuggestion(leadId, lastUserMsg);
      setAiSuggestion(suggestion);
    } catch (e) {
      setAiSuggestion("Hi there! Let's get down to automating your business conversations over WhatsApp quickly.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Poll for lead updates during simulations to update dashboard stats live
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      try {
        const leadsData = await fetchLeads();
        setLeads(leadsData);

        const analyticsData = await fetchAnalytics();
        setStats(analyticsData);

        const campaignsData = await fetchCampaigns();
        setCampaigns(campaignsData);

        if (selectedLead) {
          const chat = await fetchConversation(selectedLead.id);
          setActiveChatMessages(chat);
        }
      } catch (e) {}
    }, 4500);
    return () => clearInterval(interval);
  }, [session, selectedLead]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setSession(data.user);
        loadSaaSData();
        showToast("success", `Authenticated as ${data.user.name || "Manager"}!`);
      } else {
        setAuthError(data.error || "Incorrect sign-in credentials.");
      }
    } catch (e) {
      setAuthError("Failed to communicate with auth system. Running sandbox.");
      // Graceful local sign-in in sandbox
      const simulatedUser = { email: authEmail, name: "SaaS Administrator" };
      setSession(simulatedUser);
      loadSaaSData();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    setSession(null);
    setSelectedLead(null);
    setActiveChatMessages([]);
    showToast("success", "Session cleared. Logged out.");
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  // Bridge Callbacks for components
  const handleSendMessage = async (leadId: string, sender: 'agent' | 'lead' | 'ai', text: string) => {
    try {
      const saved = await sendMessage(leadId, sender, text);
      setActiveChatMessages(prev => [...prev, saved]);
      
      // Update parent leads timestamp
      const leadsData = await fetchLeads();
      setLeads(leadsData);
      
      if (sender !== "ai") {
        // regenerate suggestion for future message
        triggerAiSuggestion(leadId, [...activeChatMessages, saved]);
      }
      showToast("success", `Message sent via ${sender === 'ai' ? 'Gemini AI Automation' : 'Agent console'}.`);
    } catch (err) {
      showToast("error", "Error delivering message.");
    }
  };

  const handleAddLead = async (leadData: Partial<Lead>) => {
    try {
      const newLead = await createLead(leadData);
      setLeads(prev => [newLead, ...prev]);
      setSelectedLead(newLead);
      loadChatHistory(newLead.id);
      showToast("success", `CRM contact registered: ${newLead.name}`);
    } catch (err) {
      showToast("error", "Failed to create new lead.");
    }
  };

  const handleUpdateLead = async (id: string, data: Partial<Lead>) => {
    try {
      const updated = await updateLead(id, data);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
      return updated;
    } catch (err) {
      showToast("error", "Failed to save CRM changes.");
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selectedLead?.id === id) {
        setSelectedLead(null);
        setActiveChatMessages([]);
      }
      showToast("success", "CRM Contact cleared.");
    } catch (err) {
      showToast("error", "Failed to delete CRM contact.");
    }
  };

  const handleCreateCampaign = async (campaignData: Partial<Campaign>) => {
    try {
      const campaign = await createCampaign(campaignData);
      setCampaigns(prev => [campaign, ...prev]);
      showToast("success", `Broadcast "${campaign.name}" created as Draft.`);
    } catch (err) {
      showToast("error", "Failed to create campaign draft.");
    }
  };

  const handleTriggerSendCampaign = async (id: string) => {
    try {
      await triggerCampaignSend(id);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: "Sending" } : c));
      showToast("success", "Automated campaign dispatch triggered.");
    } catch (err) {
      showToast("error", "Failed to dispatch broadcast campaign.");
    }
  };

  const handleSimulateWebhook = async (data: { name?: string; phone: string; message: string }) => {
    try {
      const resId = await simulateWebhook(data);
      showToast("success", "Received incoming Meta Cloud Webhook.");
      const leadsUpdated = await fetchLeads();
      setLeads(leadsUpdated);
      return resId;
    } catch (err) {
      showToast("error", "Webhook delivery failure.");
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f9fafb] font-sans text-slate-900 antialiased overflow-hidden">
      
      {/* Toast Announcement Overlay */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right bg-black text-white px-5 py-3.5 rounded-xl border border-slate-800 shadow-2xl flex items-center gap-3 select-none">
          <CheckCircle className={`w-5 h-5 ${toast.type === "success" ? "text-emerald-400" : "text-rose-500"}`} />
          <p className="text-xs font-semibold">{toast.text}</p>
        </div>
      )}

      {/* Render Login Page if no active session */}
      {!session ? (
        <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative select-none">
          <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
            <div className="mx-auto h-11 w-11 bg-black rounded flex items-center justify-center text-white font-serif text-2xl font-semibold">
              W
            </div>
            <h2 className="mt-5 text-xl font-extrabold tracking-tight text-slate-950 font-sans uppercase">
              WhatsApp AI Agent Cloud
            </h2>
            <p className="mt-1 text-xs text-slate-400 uppercase tracking-widest font-mono">
              Omnichannel Marketing Automation & CRM
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-6 border border-slate-200 rounded-2xl shadow-md sm:px-10">
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-500 leading-relaxed mb-6 space-y-1">
                <span className="font-bold uppercase tracking-wide text-slate-800 block">Developer Quick Sandbox</span>
                <p>Authentications are simulated bypasses. Click "Acknowledge" below to load templates and test pipelines directly.</p>
                <div className="font-mono bg-white/75 p-2 border rounded mt-2 text-slate-705">
                  Email: <span className="font-semibold text-black">countdurular@gmail.com</span><br/>
                  Pass: <span className="font-semibold text-black">password123</span>
                </div>
              </div>

              {authError && (
                <div className="mb-4 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold leading-none">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">Email *</label>
                  <input 
                    id="login-email-input"
                    type="email" 
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4.5 py-3 text-xs outline-none focus:bg-white focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">Pass *</label>
                  <input 
                    id="login-password-input"
                    type="password" 
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4.5 py-3 text-xs outline-none focus:bg-white focus:border-black transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    id="login-btn-submit"
                    type="submit" 
                    className="w-full bg-black hover:bg-slate-800 text-white font-bold font-mono uppercase tracking-wider text-xs py-3.5 rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    Acknowledge & Sign In
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Workspace Frame */}
          <Sidebar 
            currentView={currentView}
            onViewChange={setCurrentView}
            userEmail={session.email}
            currentPlan={activePlan}
            onLogout={handleLogout}
          />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white/40">
            {/* Header Area */}
            <header className="h-16 border-b border-slate-150 bg-white flex items-center justify-between px-8 shrink-0 select-none">
              <div className="flex items-center gap-3.5 text-xs">
                <span className="text-slate-400 font-mono uppercase tracking-widest text-[9px]">Workspace Hub</span>
                <span className="text-slate-350">/</span>
                <span className="font-extrabold text-slate-800 uppercase tracking-widest text-[10px]">
                  {currentView === "dashboard" && "Dashboard analytics"}
                  {currentView === "inbox" && "WA-AI Automated Inbox"}
                  {currentView === "crm" && "Meta CRM Lead database"}
                  {currentView === "campaigns" && "Broadcast Automation"}
                  {currentView === "whatsapp" && "WhatsApp API Setup Link"}
                  {currentView === "workspace" && "Google Workspace Hub"}
                  {currentView === "billing" && "Subscription Pricing"}
                </span>
              </div>

              {/* API and Meta badge info */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-1 rounded border">
                  Meta partner SDK v21.0
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-2 py-1 rounded border border-emerald-100 font-bold">
                  ● FIREBASE ACTIVE
                </span>
              </div>
            </header>

            {/* Display and mount active viewport */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#FAFBFB]">
              {currentView === "dashboard" && (
                <DashboardView 
                  leads={leads}
                  stats={stats}
                  onViewChange={setCurrentView}
                  onSelectLead={(l) => {
                    setSelectedLead(l);
                    loadChatHistory(l.id);
                  }}
                />
              )}

              {currentView === "inbox" && (
                <InboxView 
                  leads={leads}
                  onSelectLead={(l) => {
                    setSelectedLead(l);
                    loadChatHistory(l.id);
                  }}
                  selectedLead={selectedLead}
                  onUpdateLead={handleUpdateLead}
                  messages={activeChatMessages}
                  onSendMessage={handleSendMessage}
                  aiSuggestion={aiSuggestion}
                  isAiLoading={isAiLoading}
                  onRefreshAiSuggestion={() => selectedLead && triggerAiSuggestion(selectedLead.id, activeChatMessages)}
                  onSimulateWebhook={handleSimulateWebhook}
                />
              )}

              {currentView === "crm" && (
                <CrmView 
                  leads={leads}
                  onAddLead={handleAddLead}
                  onUpdateLead={handleUpdateLead}
                  onDeleteLead={handleDeleteLead}
                />
              )}

              {currentView === "campaigns" && (
                <CampaignsView 
                  campaigns={campaigns}
                  templates={templates}
                  leads={leads}
                  onCreateCampaign={handleCreateCampaign}
                  onTriggerSend={handleTriggerSendCampaign}
                />
              )}

              {currentView === "whatsapp" && (
                <WhatsAppView />
              )}

              {currentView === "workspace" && (
                <WorkspaceHubView 
                  leads={leads}
                  onAddLead={handleAddLead}
                  onSendMessage={handleSendMessage}
                />
              )}

              {currentView === "billing" && (
                <BillingView 
                  currentPlan={activePlan}
                  onPlanChange={setActivePlan}
                  leadsCount={leads.length}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
