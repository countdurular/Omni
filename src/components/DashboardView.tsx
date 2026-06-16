import React from "react";
import { 
  TrendingUp, 
  ArrowUpRight, 
  Users, 
  Inbox, 
  Percent, 
  Zap, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { Lead, AnalyticsSummary } from "../types";

interface DashboardViewProps {
  leads: Lead[];
  stats: AnalyticsSummary;
  onViewChange: (view: string) => void;
  onSelectLead: (lead: Lead) => void;
}

export default function DashboardView({ leads, stats, onViewChange, onSelectLead }: DashboardViewProps) {
  // Chart data matching weekly campaign conversion trends
  const trendData = [
    { day: "Mon", conversions: 45, organic: 20 },
    { day: "Tue", conversions: 52, organic: 28 },
    { day: "Wed", conversions: 78, organic: 34 },
    { day: "Thu", conversions: 61, organic: 30 },
    { day: "Fri", conversions: 110, organic: 45 },
    { day: "Sat", conversions: 95, organic: 52 },
    { day: "Sun", conversions: 125, organic: 60 },
  ];

  // Pipeline summary segments
  const stageCounts = {
    new: leads.filter(l => l.stage === "Lead").length,
    contacted: leads.filter(l => l.stage === "Contacted" || l.stage === "Qualified").length,
    proposal: leads.filter(l => l.stage === "Proposal").length,
    won: leads.filter(l => l.stage === "Closed Won").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Editorial Stat Headers */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="border-l-2 border-black pl-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Total Contacts</p>
          <p className="text-4xl font-light tracking-tighter mt-1 text-slate-900">{stats.totalLeads}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            +12.4% vs last week
          </p>
        </div>
        
        <div className="border-l-2 border-slate-200 pl-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Active Inbox</p>
          <p className="text-4xl font-light tracking-tighter mt-1 text-slate-900">{stats.activeConversations}</p>
          <p className="text-xs text-slate-500 mt-1">
            {leads.filter(l => l.aiStatus === "Human Takeover").length} manual routing
          </p>
        </div>
        
        <div className="border-l-2 border-slate-200 pl-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Conversion Rate</p>
          <p className="text-4xl font-light tracking-tighter mt-1 text-slate-900">{stats.conversionRate}%</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            +2.1% performance conversion
          </p>
        </div>
        
        <div className="border-l-2 border-slate-200 pl-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">AI Resolution</p>
          <p className="text-4xl font-light tracking-tighter mt-1 text-slate-900">{stats.aiResponseAccuracy}%</p>
          <p className="text-xs text-slate-500 mt-1">
            Across 4.2k auto queries
          </p>
        </div>
      </section>

      {/* Main Visual Data section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign conversions chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Campaign Conversion Trend</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Real-time daily interaction conversions on Meta broadcasts</p>
            </div>
            <div className="flex gap-4 text-xs font-bold">
              <span className="text-black underline underline-offset-4 cursor-pointer">Weekly</span>
              <span className="text-slate-400 hover:text-black cursor-pointer">Monthly</span>
            </div>
          </div>

          <div className="mt-2" style={{ position: "relative", width: "100%", height: "256px", minWidth: "0px" }}>
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#020617" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#020617" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderRadius: "8px", border: "none" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Area type="monotone" dataKey="conversions" stroke="#020617" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConversions)" name="Meta Broadcast Campaign" />
                <Area type="monotone" dataKey="organic" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrganic)" name="Organic WhatsApp Chat" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Ticker Teaser */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Active Live Feed</h3>
              <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase animate-pulse">Live</span>
            </div>
            
            <div className="space-y-3.5">
              {leads.slice(0, 3).map((lead) => (
                <div 
                  key={lead.id} 
                  onClick={() => {
                    onSelectLead(lead);
                    onViewChange("inbox");
                  }}
                  className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-700 border border-slate-200 font-mono">
                    {lead.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-semibold text-slate-900 group-hover:underline">{lead.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                        lead.aiStatus === "AI Active" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : lead.aiStatus === "Human Takeover" 
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {lead.aiStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate font-mono">Score: {lead.score}% | Stage: {lead.stage}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{lead.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onViewChange("inbox")}
            className="mt-6 text-xs font-bold text-slate-500 hover:text-black transition-colors flex items-center gap-2 cursor-pointer group"
          >
            <span>View workspace chat inbox</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* Editorial Funnel block */}
      <section className="bg-black text-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between shadow-lg">
        <div className="mb-4 md:mb-0">
          <h4 className="text-2xl font-light italic serif tracking-tight mb-2 text-slate-100 flex items-center gap-2">
            CRM Campaign Funnel Health
            <Sparkles className="w-4 h-4 text-emerald-400 rotate-12" />
          </h4>
          <p className="text-slate-400 text-xs max-w-xl font-sans leading-relaxed">
            Meta API triggers and automated flows are generating high-intent leads at an average score of 72%. Complete pipeline automation saves up to 48 hours of manual follow-up per client.
          </p>
        </div>
        <div className="flex gap-10 md:pr-6 shrink-0">
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1">New Leads</p>
            <p className="text-2xl font-light tracking-tight font-mono">{stageCounts.new}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1">Active Contact</p>
            <p className="text-2xl font-light tracking-tight font-mono">{stageCounts.contacted}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1">Presenting</p>
            <p className="text-2xl font-light tracking-tight font-mono">{stageCounts.proposal}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-mono mb-1">Closed Won</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{stageCounts.won}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
