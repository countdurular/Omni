import React, { useState } from "react";
import { 
  CreditCard, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  ArrowUpRight, 
  CheckCircle,
  HelpCircle,
  Info
} from "lucide-react";

interface BillingViewProps {
  currentPlan: string;
  onPlanChange: (plan: string) => void;
  leadsCount: number;
}

export default function BillingView({ currentPlan, onPlanChange, leadsCount }: BillingViewProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [successMsg, setSuccessMsg] = useState("");

  const plans = [
    {
      name: "Starter Play",
      price: billingInterval === "monthly" ? 19 : 14,
      limit: 500,
      features: [
        "Up to 500 Active Leads",
        "Meta API WhatsApp Simulation",
        "Standard Automation Response Rules",
        "Limited Campaign Broadcasts",
        "Email Support"
      ],
      badge: "Self Employed"
    },
    {
      name: "PRO Plan",
      id: "pro",
      price: billingInterval === "monthly" ? 79 : 59,
      limit: 5000,
      features: [
        "Up to 5,000 Active Leads",
        "Gemini AI Automated Answers Integrations",
        "Recharts Conversions Deep Analytics",
        "Unbounded Broad Campaign Dispatches",
        "HubSpot and Salesforce CRM Sync webhooks",
        "Priority 24/7 Slack Support"
      ],
      badge: "Most Popular",
      featured: true
    },
    {
      name: "Enterprise Core",
      price: billingInterval === "monthly" ? 249 : 199,
      limit: 100000,
      features: [
        "Unlimited Leads & Contact Lists",
        "SLA Response Times agreements",
        "Fully Custom Trained Gemini Models",
        "Dedicated Server Proxies",
        "Direct Meta Business Verification assistance",
        "Enterprise Account Manager"
      ],
      badge: "Large Teams"
    }
  ];

  const handleSwitchPlan = (planName: string) => {
    onPlanChange(planName);
    setSuccessMsg(`Perfect decision! Successfully subscribed to ${planName}.`);
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };

  // Quota usage calculate
  const currentPlanObj = plans.find(p => p.name === currentPlan) || plans[1];
  const quotaPercent = Math.min(100, Math.round((leadsCount / currentPlanObj.limit) * 100));

  return (
    <div className="space-y-8 animate-fade-in text-slate-900">
      {/* Visual active subscription detail */}
      <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs select-none">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <h3 className="font-bold text-slate-900 text-sm">Active Plan Subscription</h3>
          </div>
          <p className="text-2xl font-black font-mono tracking-tight text-slate-950 uppercase">{currentPlan}</p>
          <p className="text-xs text-slate-500">Your account metrics renew automatically in 15 days.</p>
        </div>

        {/* Resource Gauge */}
        <div className="w-full md:w-72 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Lead Storage Quota</span>
            <span className="text-slate-800 font-mono font-bold">{leadsCount} / {currentPlanObj.limit}</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${quotaPercent > 80 ? "bg-amber-500" : "bg-black"}`} 
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono text-right">{quotaPercent}% Capacity utilized</p>
        </div>
      </section>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold p-4 rounded-xl border border-emerald-100 animate-slide-in flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Interval switch */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
          <button 
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${billingInterval === "monthly" ? "bg-white text-black shadow-xs" : "text-slate-400 hover:text-slate-800"}`}
          >
            Bill Monthly
          </button>
          <button 
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${billingInterval === "yearly" ? "bg-white text-black shadow-xs" : "text-slate-400 hover:text-slate-800"}`}
          >
            Bill Yearly <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded px-1 ml-0.5 font-mono">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans Tier Pricing Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p) => {
          const isActive = p.name === currentPlan;
          
          return (
            <div 
              key={p.name} 
              id={`plan-card-${p.name.replace(/\s+/g, '-').toLowerCase()}`}
              className={`bg-white rounded-2xl p-6.5 flex flex-col justify-between border transition-all ${
                isActive 
                  ? "border-black shadow-md ring-1 ring-black relative" 
                  : p.featured 
                  ? "border-slate-300 shadow hover:border-slate-800" 
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <div>
                {/* Visual top identifiers */}
                <div className="flex items-center justify-between mb-4.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {p.badge}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black px-2 py-0.5 rounded font-mono">
                      Current Plan
                    </span>
                  )}
                </div>

                <h4 className="text-lg font-bold text-slate-900 tracking-tight">{p.name}</h4>
                
                {/* Money */}
                <div className="my-5 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tighter">${p.price}</span>
                  <span className="text-slate-400 text-xs font-medium ml-1">/ USD.{billingInterval === "monthly" ? "mo" : "yr"}</span>
                </div>

                <p className="text-xs text-slate-400 border-b border-slate-100 pb-4 mb-4.5 font-sans leading-relaxed">
                  Excellent choice for marketing teams scaling WhatsApp interaction speeds. Includes limits up to <b className="text-slate-700">{p.limit.toLocaleString()} contacts</b>.
                </p>

                {/* Bullets lists */}
                <ul className="space-y-2 text-xs text-slate-600 mb-6.5">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-tight">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Switches */}
              <button 
                type="button"
                onClick={() => handleSwitchPlan(p.name)}
                disabled={isActive}
                className={`w-full py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  isActive 
                    ? "bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed" 
                    : "bg-black hover:bg-slate-800 text-white text-sans shadow-sm"
                }`}
              >
                {isActive ? "Active Plan" : "Upgrade via Sandbox"}
              </button>
            </div>
          );
        })}
      </section>

      {/* Stripe portal security assurances */}
      <section className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3 text-xs leading-relaxed max-w-2xl mx-auto font-sans text-slate-500">
        <Info className="w-5 h-5 text-slate-400 shrink-0" />
        <span><b>Sandbox Payment Security Note:</b> Changing your plan mock triggers immediate quota updates in your preview dashboard session. Real Meta Cloud API and Stripe pipelines can be integrated simply by updating `.env` keys.</span>
      </section>
    </div>
  );
}
