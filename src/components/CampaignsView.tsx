import React, { useState } from "react";
import { 
  Megaphone, 
  Send, 
  Layers, 
  Layers2, 
  Eye, 
  TrendingUp, 
  DollarSign, 
  UserCheck, 
  Plus, 
  Clock,
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Campaign, CampaignTemplate, Lead } from "../types";

interface CampaignsViewProps {
  campaigns: Campaign[];
  templates: CampaignTemplate[];
  leads: Lead[];
  onCreateCampaign: (campaign: Partial<Campaign>) => Promise<any>;
  onTriggerSend: (id: string) => Promise<any>;
}

export default function CampaignsView({ campaigns, templates, leads, onCreateCampaign, onTriggerSend }: CampaignsViewProps) {
  const [activeTemplateId, setActiveTemplateId] = useState(templates[0]?.id || "");
  const [newCampName, setNewCampName] = useState("");
  const [audienceSegment, setAudienceSegment] = useState("Enterprise Intent Leads");
  
  // Custom interactive preview selectors
  const [previewLeadId, setPreviewLeadId] = useState(leads[0]?.id || "");
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const selectedTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];
  const selectedLead = leads.find(l => l.id === previewLeadId) || leads[0];

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName) return;

    await onCreateCampaign({
      name: newCampName,
      templateName: selectedTemplate?.name || "Interactive Feature Walkthrough",
      audienceSegment: audienceSegment,
      status: "Draft",
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      repliesCount: 0,
      roi: 0,
      spent: 0,
      revenue: 0
    });

    setNewCampName("");
  };

  const handleTriggerDispatch = async (campaignId: string) => {
    setDispatchingId(campaignId);
    await onTriggerSend(campaignId);
    
    // Simulate active progress animation for 3 seconds to represent Meta network latency!
    setTimeout(() => {
      setDispatchingId(null);
    }, 2500);
  };

  // Variable substitution logic for interactive messaging preview
  const renderPreviewText = () => {
    if (!selectedTemplate) return "Select a template preview.";
    let raw = selectedTemplate.text;
    if (selectedLead) {
      // substitution
      raw = raw.replace("{{1}}", selectedLead.name);
      raw = raw.replace("{{2}}", selectedLead.tags[0] || "HubSpot");
    }
    return raw;
  };

  // Dynamic cost estimates
  const estimatedCount = audienceSegment.includes("Cold") ? 1200 : audienceSegment.includes("High") ? 450 : leads.length;
  const estimatedCost = (estimatedCount * 0.055).toFixed(2); // Meta Cloud API is roughly 5.5 cents per utility conversation template

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic Creation Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign form builder */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-slate-900 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Create WhatsApp Broadcast</h3>
            </div>
            
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Campaign Title</label>
                <input 
                  type="text" 
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="e.g. Q2 Enterprise Feature Announcement"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono font-sans">Template Message Block</label>
                <select 
                  value={activeTemplateId}
                  onChange={(e) => setActiveTemplateId(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-2.5 py-2.5 text-xs font-semibold outline-none rounded-lg focus:border-black cursor-pointer"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (Vars: {t.variables.join(", ")})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono font-sans">Audience Segment Select</label>
                <select 
                  value={audienceSegment}
                  onChange={(e) => setAudienceSegment(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-2.5 py-2.5 text-xs font-semibold outline-none rounded-lg focus:border-black cursor-pointer"
                >
                  <option value="Enterprise Intent Leads">High-Intent Leads ({leads.filter(l=>l.score>=80).length} contacts)</option>
                  <option value="Cold Inactive (30d+)">Cold Inactive Outreach ({leads.filter(l=>l.score<50).length} contacts)</option>
                  <option value="All Leads">Full CRM Direct List ({leads.length} contacts)</option>
                </select>
              </div>

              {/* Dynamic estimation summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-xs leading-5">
                <div className="flex justify-between font-mono text-slate-500">
                  <span>Target Count:</span>
                  <span className="font-bold text-slate-800">{estimatedCount} contacts</span>
                </div>
                <div className="flex justify-between font-mono text-slate-500 mt-1">
                  <span>Est Meta pricing:</span>
                  <span className="font-bold text-slate-800">${estimatedCost} USD</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-black hover:bg-slate-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Create Broadcast Draft
              </button>
            </form>
          </div>
        </div>

        {/* Live dynamic preview card */}
        <div className="lg:col-span-2 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">Live Interactive Webhook Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs text-sans font-semibold">Test on Lead:</span>
                <select 
                  value={previewLeadId}
                  onChange={(e) => setPreviewLeadId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs font-semibold text-white px-2 py-1 rounded outline-none cursor-pointer"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Immersive Mobile phone frame */}
            <div className="max-w-md mx-auto bg-slate-950/60 p-4 rounded-2xl border border-slate-800 relative shadow-inner">
              {/* WhatsApp UI Look */}
              <div className="bg-[#075e54] px-4 py-2 rounded-t-xl flex items-center justify-between shadow select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs text-white uppercase font-bold font-mono">
                    {selectedLead?.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white tracking-wide leading-none mb-0.5">{selectedLead?.name}</h5>
                    <p className="text-[9px] text-emerald-200 tracking-wider">Business Automation Account</p>
                  </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              </div>

              {/* Chat Canvas Area */}
              <div className="bg-[#ece5dd] p-4 h-48 overflow-y-auto flex flex-col justify-end gap-2.5 rounded-b-xl border border-slate-300/45 text-black">
                <div className="bg-white px-3.5 py-2.5 rounded-lg text-xs leading-relaxed max-w-[85%] self-start shadow-sm relative">
                  {/* Whatsapp bubble arrow */}
                  <span className="absolute left-[-4px] top-2 border-slate-50 border-8 border-y-transparent border-l-transparent" />
                  <p className="font-sans whitespace-pre-wrap">{renderPreviewText()}</p>
                  <p className="text-[9px] text-slate-400 mt-1.5 font-mono text-right">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40 leading-relaxed font-sans">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Interactive variables <kbd className="bg-slate-800 text-white font-mono rounded px-1">{"{{1}}"}</kbd> replaces contact name, and <kbd className="bg-slate-800 text-white font-mono rounded px-1">{"{{2}}"}</kbd> maps automatically to first custom tags metadata.</span>
          </div>
        </div>
      </section>

      {/* Campaign List */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-950 tracking-tight">Campaign Dispatch Ledger</h3>
        
        <div className="grid grid-cols-1 gap-5">
          {campaigns.map((camp) => {
            const isCompleted = camp.status === "Completed";
            const isSending = camp.status === "Sending";
            const isCurrentlyDispatching = dispatchingId === camp.id;

            return (
              <div 
                key={camp.id} 
                id={`campaign-card-${camp.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Meta details */}
                <div className="space-y-2 max-w-sm">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase font-bold tracking-wider rounded font-mono px-2 py-0.5 ${
                      camp.status === "Completed" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : camp.status === "Sending" 
                        ? "bg-amber-100 text-amber-800 animate-pulse" 
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {camp.status}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{camp.name}</h4>
                  </div>
                  
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    Template: <b className="text-slate-700 font-medium">{camp.templateName}</b> | Segment: <b className="text-slate-700 font-medium">{camp.audienceSegment}</b>
                  </p>
                  
                  {isCompleted && camp.scheduleTime && (
                    <p className="text-[10px] text-slate-400 font-mono">Dispatched: {new Date(camp.scheduleTime).toLocaleString()}</p>
                  )}
                </div>

                {/* Performance stats grids */}
                {isCompleted && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 py-2 bg-slate-50/60 rounded-xl border border-slate-100 text-center select-none">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Sent / Deliver</p>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{camp.sentCount} / {camp.deliveredCount}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Read (Rate %)</p>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{camp.readCount} ({Math.round((camp.readCount/camp.deliveredCount)*100)}%)</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Replies</p>
                      <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">{camp.repliesCount}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">ROI Metric</p>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">+{camp.roi}%</p>
                    </div>
                  </div>
                )}

                {/* Dispatch Triggers */}
                <div>
                  {camp.status === "Draft" ? (
                    <button 
                      onClick={() => handleTriggerDispatch(camp.id)}
                      disabled={isCurrentlyDispatching}
                      className="bg-black hover:bg-slate-800 text-white flex items-center justify-center gap-2.5 px-4.5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer shrink-0"
                    >
                      {isCurrentlyDispatching ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Deploy Broadcast</span>
                        </>
                      )}
                    </button>
                  ) : isSending ? (
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-700 bg-amber-50 rounded-lg px-4 py-2.5 border border-amber-100 select-none">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                      <span>Transmitting Packet...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 rounded-lg px-4 py-2.5 border border-emerald-100 select-none">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Success Dispatched</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
