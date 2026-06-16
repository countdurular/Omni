import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Send, 
  User, 
  Bot, 
  Sliders, 
  AlertCircle, 
  Sparkles, 
  TrendingUp, 
  Check, 
  FileText, 
  UserX, 
  ToggleLeft, 
  ToggleRight,
  RefreshCw,
  Zap,
  Globe,
  Radio,
  FileSpreadsheet
} from "lucide-react";
import { Lead, Message } from "../types";

interface InboxViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  selectedLead: Lead | null;
  onUpdateLead: (id: string, data: Partial<Lead>) => Promise<any>;
  messages: Message[];
  onSendMessage: (leadId: string, sender: 'agent' | 'lead' | 'ai', text: string) => Promise<any>;
  aiSuggestion: string;
  isAiLoading: boolean;
  onRefreshAiSuggestion: () => void;
  onSimulateWebhook: (data: { name?: string; phone: string; message: string }) => Promise<any>;
}

export default function InboxView({
  leads,
  onSelectLead,
  selectedLead,
  onUpdateLead,
  messages,
  onSendMessage,
  aiSuggestion,
  isAiLoading,
  onRefreshAiSuggestion,
  onSimulateWebhook
}: InboxViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [inboxStatusFilter, setInboxStatusFilter] = useState<"All" | "AI Active" | "Human Takeover">("All");
  
  // Textbox state
  const [typedMessage, setTypedMessage] = useState("");
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Webhook Simulator state
  const [hookText, setHookText] = useState("Hi! I'm interested in booking a direct demo of your platform.");
  const [hookName, setHookName] = useState("");
  const [hookPhone, setHookPhone] = useState("+1 (555) 888-9999");
  const [isSimulatingHook, setIsSimulatingHook] = useState(false);

  // Tag creation state
  const [newTagInput, setNewTagInput] = useState("");

  // Scroll to bottom whenever messages list grows
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filtering leads
  const filteredInboxLeads = leads.filter((l) => {
    const matchesSearch = 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.phone.includes(searchTerm) || 
      l.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesInboxFilter = inboxStatusFilter === "All" || l.aiStatus === inboxStatusFilter;
    return matchesSearch && matchesInboxFilter;
  });

  // Handle messages dispatch from agent
  const handleSendFromAgent = async () => {
    if (!selectedLead || !typedMessage.trim()) return;
    const textToSend = typedMessage;
    setTypedMessage("");
    await onSendMessage(selectedLead.id, "agent", textToSend);
  };

  // Allow simulating message from client right inside the chat pane for dynamic testing!
  const handleSimulateFromUser = async () => {
    if (!selectedLead || !typedMessage.trim()) return;
    const textToSend = typedMessage;
    setTypedMessage("");
    await onSendMessage(selectedLead.id, "lead", textToSend);
  };

  // Webhook execution
  const triggerMetaSimulator = async () => {
    if (!hookPhone.trim() || !hookText.trim()) return;
    setIsSimulatingHook(true);
    const createdId = await onSimulateWebhook({
      name: hookName || undefined,
      phone: hookPhone,
      message: hookText
    });
    setHookText("");
    setIsSimulatingHook(false);
    
    // Find newly added lead and auto select
    const target = leads.find(l => l.id === createdId || l.phone === hookPhone);
    if (target) {
      onSelectLead(target);
    }
  };

  // Toggle Automated answers in CRM block
  const handleToggleAutomated = async () => {
    if (!selectedLead) return;
    const current = selectedLead.aiStatus;
    const nextStatus = current === "AI Active" ? "Human Takeover" : "AI Active";
    await onUpdateLead(selectedLead.id, { aiStatus: nextStatus });
    // Trigger callback parent update
    onSelectLead({ ...selectedLead, aiStatus: nextStatus });
  };

  const handleAppendCustomTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newTagInput.trim()) return;
    const normalized = newTagInput.trim();
    if (!selectedLead.tags.includes(normalized)) {
      const updatedTags = [...selectedLead.tags, normalized];
      await onUpdateLead(selectedLead.id, { tags: updatedTags });
      onSelectLead({ ...selectedLead, tags: updatedTags });
    }
    setNewTagInput("");
  };

  const handleRemoveTag = async (val: string) => {
    if (!selectedLead) return;
    const filteredTags = selectedLead.tags.filter(t => t !== val);
    await onUpdateLead(selectedLead.id, { tags: filteredTags });
    onSelectLead({ ...selectedLead, tags: filteredTags });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-170px)] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-fade-in select-none">
      
      {/* Pane 1: Conversations Ticker List (Span 3) */}
      <div className="lg:col-span-3 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <h4 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
            CRM Chat Ledger
            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded border">
              {filteredInboxLeads.length} active
            </span>
          </h4>

          {/* Inline search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input 
              id="inbox-ledger-search"
              type="text"
              placeholder="Filter names/phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:bg-white focus:border-black transition-all"
            />
          </div>

          {/* Quick status tab selector */}
          <div className="flex gap-1.5 text-[10px] bg-slate-100 p-0.5 rounded-md border text-slate-600 font-mono">
            <button 
              onClick={() => setInboxStatusFilter("All")}
              className={`flex-1 text-center py-1 rounded transition-all cursor-pointer ${inboxStatusFilter === "All" ? "bg-white text-black font-semibold shadow-xs" : "hover:text-black"}`}
            >
              All
            </button>
            <button 
              onClick={() => setInboxStatusFilter("AI Active")}
              className={`flex-1 text-center py-1 rounded transition-all cursor-pointer ${inboxStatusFilter === "AI Active" ? "bg-white text-black font-semibold shadow-xs" : "hover:text-black"}`}
            >
              AI Live
            </button>
            <button 
              onClick={() => setInboxStatusFilter("Human Takeover")}
              className={`flex-1 text-center py-1 rounded transition-all cursor-pointer ${inboxStatusFilter === "Human Takeover" ? "bg-white text-black font-semibold shadow-xs" : "hover:text-black"}`}
            >
              Manual
            </button>
          </div>
        </div>

        {/* Scrollable Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredInboxLeads.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400 font-sans">
              No matching conversation found. Add new leads or utilize the webhook simulator payload below.
            </p>
          ) : (
            filteredInboxLeads.map((l) => {
              const isActive = selectedLead?.id === l.id;
              
              return (
                <div 
                  key={l.id} 
                  id={`inbox-lead-item-${l.id}`}
                  onClick={() => onSelectLead(l)}
                  className={`p-3.5 flex items-start gap-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors relative ${isActive ? "bg-slate-50 border-l-2 border-black" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-150 flex items-center justify-center text-[10px] font-bold font-mono text-slate-800 shrink-0">
                    {l.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h5 className="font-bold text-slate-900 text-xs truncate leading-none">{l.name}</h5>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">
                        {new Date(l.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate max-w-[130px] font-mono mb-1">{l.phone}</p>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ${
                        l.aiStatus === "AI Active" 
                          ? "bg-emerald-50 text-emerald-700" 
                          : l.aiStatus === "Human Takeover" 
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {l.aiStatus}
                      </span>
                      <span className="text-[9px] font-bold font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                        s: {l.score}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Webhook Quick Mock Tool in lower sidebar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-1.5 mb-2">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">Meta API Webhook Mock</span>
          </div>

          <div className="space-y-2">
            {/* Inline tiny form */}
            <input 
              id="webhook-phone"
              type="text" 
              placeholder="Contact Mobile (e.g. +1...)"
              value={hookPhone}
              onChange={(e) => setHookPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] outline-none"
            />
            <textarea 
              id="webhook-message"
              rows={2} 
              placeholder="Hi, automate my WhatsApp sales funnel!"
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] outline-none resize-none"
            />
            <button 
              id="webhook-submit-btn"
              onClick={triggerMetaSimulator}
              disabled={isSimulatingHook}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-[9px] uppercase tracking-wider py-1.5 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              {isSimulatingHook ? (
                <span>Firing Webhook...</span>
              ) : (
                <>
                  <Zap className="w-3 h-3 text-emerald-100 shrink-0" />
                  <span>Simulate Meta Event</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Pane 2: Chat Canvas Timeline (Span 6) */}
      <div className="lg:col-span-6 bg-white flex flex-col justify-between overflow-hidden">
        {selectedLead ? (
          <>
            {/* Header detail */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/20">
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight leading-none mb-1">{selectedLead.name}</h3>
                <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-mono">
                  <span>{selectedLead.phone}</span>
                  <span>•</span>
                  <span>{selectedLead.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  selectedLead.aiStatus === "AI Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse" : "bg-amber-50 text-amber-700 border border-amber-100"
                }`}>
                  {selectedLead.aiStatus === "AI Active" ? "AI Automation Live" : "Human Agent Exclusive"}
                </span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#efeae2]/45 space-y-4">
              {messages.length === 0 ? (
                <div className="py-20 text-center font-sans space-y-1 select-none">
                  <p className="text-sm font-bold text-slate-600">Secure conversation channel open.</p>
                  <p className="text-xs text-slate-400">Type below to start communicating with CRM lead record.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.sender === "lead";
                  const isAi = m.sender === "ai";
                  
                  return (
                    <div 
                      key={m.id} 
                      className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                    >
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs shadow-sm leading-relaxed relative ${
                        isUser 
                          ? "bg-white text-slate-900 rounded-tl-none border border-slate-100" 
                          : isAi 
                          ? "bg-slate-900 text-white rounded-tr-none" 
                          : "bg-emerald-600 text-white rounded-tr-none"
                      }`}>
                        {/* Bubble tail decorations */}
                        {isUser ? (
                          <span className="absolute left-[-4px] top-0 border-white border-8 border-y-transparent border-l-transparent" />
                        ) : isAi ? (
                          <span className="absolute right-[-4px] top-0 border-slate-900 border-8 border-y-transparent border-r-transparent" />
                        ) : (
                          <span className="absolute right-[-4px] top-0 border-emerald-600 border-8 border-y-transparent border-r-transparent" />
                        )}

                        {/* Top source flag for transparency */}
                        <div className="flex items-center justify-between gap-4 mb-1 text-[9px] font-bold font-mono opacity-65 tracking-wider uppercase select-none">
                          <span>{isUser ? "CRM Lead" : isAi ? "Gemini Automated AI" : "Agent Console"}</span>
                          <span className="text-[8px] transform scale-90">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <p className="font-sans whitespace-pre-wrap">{m.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Gemini Automated Drafting Proposal Box */}
            {selectedLead.aiStatus === "AI Active" && (
              <div id="ai-glowing-draft-box" className="mx-6 mt-4 p-4.5 bg-slate-900 text-white rounded-xl border border-slate-700/60 shadow-lg flex flex-col justify-between gap-3.5 relative overflow-hidden select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5.5 h-5.5 text-yellow-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-widest leading-none">Gemini Co-Pilot Suggestion</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Based on CRM logs and HubSpot metrics</p>
                    </div>
                  </div>
                  <button 
                    onClick={onRefreshAiSuggestion}
                    disabled={isAiLoading}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Regenerate Gemini Draft"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? "animate-spin text-yellow-400" : ""}`} />
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                  {isAiLoading ? (
                    <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono py-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping shrink-0" />
                      <span>Gemini analysis processing CRM metrics...</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed italic font-serif">
                      "{aiSuggestion || "Draft generated. Ready to send."}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button 
                    onClick={() => setTypedMessage(aiSuggestion)}
                    disabled={isAiLoading || !aiSuggestion}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-[11px] px-3.5 py-1.5 rounded transition-all cursor-pointer"
                  >
                    Edit Suggestion
                  </button>
                  <button 
                    onClick={() => {
                      onSendMessage(selectedLead.id, "ai", aiSuggestion);
                    }}
                    disabled={isAiLoading || !aiSuggestion}
                    className="bg-yellow-400 text-slate-950 font-bold text-[11px] px-4 py-1.5 rounded transition-all shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3 text-slate-900" />
                    <span>Quick Deploy AI Response</span>
                  </button>
                </div>
              </div>
            )}

            {/* Input Actions Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col gap-3">
              <div className="relative">
                <textarea 
                  id="inbox-msg-composer"
                  rows={2}
                  maxLength={1900}
                  placeholder={`Write secure message for ${selectedLead.name}...`}
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black pr-12 resize-none"
                />
              </div>

              {/* Action Rows */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-sans">
                  Ctrl+Enter triggers Agent Dispatch. Use simulation triggers to test response rules.
                </p>

                <div className="flex items-center gap-2">
                  {/* Simulate customer responding trigger */}
                  <button 
                    id="btn-simulate-user-reply"
                    onClick={handleSimulateFromUser}
                    disabled={!typedMessage.trim()}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold font-mono text-[11px] px-4 py-2 rounded-lg transition-all cursor-pointer"
                    title="Force client message simulation to test AI automated replies"
                  >
                    Simulate Client Msg
                  </button>
                  
                  {/* Real standard agent send */}
                  <button 
                    id="btn-agent-send-reply"
                    onClick={handleSendFromAgent}
                    disabled={!typedMessage.trim()}
                    className="bg-black hover:bg-slate-800 text-white font-semibold text-[11px] px-5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Agent Dispatch</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
            <Bot className="w-12 h-12 text-slate-350 shrink-0 mb-3" />
            <h4 className="font-bold text-slate-800 text-sm tracking-tight">Active Automation Hub</h4>
            <p className="text-slate-400 text-xs text-center max-w-sm mt-1 leading-relaxed font-sans">
              Select or search a lead from the CRM chat ledger on the left to review automated messaging, edit sales records, or run manual takeovers.
            </p>
          </div>
        )}
      </div>

      {/* Pane 3: CRM Context Panel (Span 3) */}
      <div className="lg:col-span-3 bg-white border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
        {selectedLead ? (
          <div className="p-4 space-y-6">
            
            {/* Visual CRM Contact Gauges */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-widest font-mono">Lead Context details</h4>
              
              {/* Core gauge Score */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex flex-col items-center text-center shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-2">Priority Engagement Score</span>
                <div className={`w-18 h-18 rounded-full border-4 flex items-center justify-center font-mono font-black text-lg ${
                  selectedLead.score >= 80 
                    ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" 
                    : selectedLead.score >= 50 
                    ? "border-amber-400 text-amber-700 bg-amber-50/20" 
                    : "border-slate-300 text-slate-600 bg-slate-50"
                }`}>
                  {selectedLead.score}%
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-sans">Calculated from dynamic Meta interaction speeds and email verification status.</p>
              </div>
            </div>

            {/* Pipeline Select Dropped */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Sales Funnel Board</label>
              <select 
                id="crm-sidebar-pipeline"
                value={selectedLead.stage}
                onChange={async (e) => {
                  const val = e.target.value as Lead["stage"];
                  await onUpdateLead(selectedLead.id, { stage: val });
                  onSelectLead({ ...selectedLead, stage: val });
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2.5 text-xs font-semibold outline-none focus:border-black cursor-pointer"
              >
                <option value="Lead">Lead</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>

            {/* Dynamic toggles for Gemini response automation rules */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-250/65 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 leading-none">Automated AI Routing</h5>
                  <p className="text-[10px] text-slate-400 mt-1 font-sans">Gemini answers queries instantly</p>
                </div>
                <button 
                  id="toggle-automated-btn"
                  onClick={handleToggleAutomated}
                  className="text-slate-700 hover:text-black transition-all cursor-pointer shrink-0"
                >
                  {selectedLead.aiStatus === "AI Active" ? (
                    <ToggleRight className="w-10 h-10 text-emerald-600 shrink-0" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-400 shrink-0" />
                  )}
                </button>
              </div>

              <div className="text-[10px] leading-relaxed text-slate-500 font-sans">
                {selectedLead.aiStatus === "AI Active" ? (
                  <span><b>Status: Active</b>. Client message arrivals will trigger Gemini to analyze and post replies automatically via server proxy, reserving client privacy credentials.</span>
                ) : (
                  <span><b>Status: Locked</b>. No auto messages will dispatch. Complete manual agent exclusive conversation is active.</span>
                )}
              </div>
            </div>

            {/* Dynamic Tag append workspace */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Assigned Leads Tags</label>
              
              <div className="flex flex-wrap gap-1">
                {selectedLead.tags.map((t, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] font-bold font-mono tracking-tight bg-slate-100 text-slate-600 border px-2 py-0.5 rounded-full flex items-center gap-1 select-none"
                  >
                    <span>{t}</span>
                    <button 
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-rose-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAppendCustomTag} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="New tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs outline-none focus:border-black flex-1"
                />
                <button 
                  type="submit"
                  className="bg-slate-100 hover:bg-slate-200 border px-3.5 py-1.5 rounded-md text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400 select-none py-10 leading-relaxed font-sans">
            No active context loaded. Select a HubSpot contact in workspace list to inspect variables.
          </div>
        )}
      </div>

    </div>
  );
}
