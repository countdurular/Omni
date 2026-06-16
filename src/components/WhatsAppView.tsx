import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Server, 
  Link, 
  ShieldCheck, 
  AlertCircle, 
  Play, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  Activity, 
  Globe,
  UploadCloud,
  Layers,
  Sparkles,
  ExternalLink,
  Lock,
  ArrowRight
} from "lucide-react";
import { 
  fetchWhatsAppConnection, 
  connectWhatsAppManual, 
  connectWhatsAppEmbedded, 
  disconnectWhatsApp, 
  validateWhatsAppConnection, 
  sendWhatsAppTestMessage, 
  fetchWebhookLogs, 
  fetchConnectionHealth 
} from "../api";
import { WhatsAppConnection, WebhookLog, ConnectionHealth } from "../types";

export default function WhatsAppView() {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [health, setHealth] = useState<ConnectionHealth>({
    apiStatus: "Failed",
    latencyMs: 0,
    webhookStatus: "Inactive",
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0
  });

  // Wizard Setup state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Manual Credentials form state
  const [formData, setFormData] = useState({
    phone_number_id: "",
    waba_id: "",
    access_token_encrypted: "",
    verify_token_encrypted: "",
    business_phone: "",
    meta_app_id: ""
  });

  // Testing dispatch state
  const [testNum, setTestNum] = useState("");
  const [testText, setTestText] = useState("Hello! This is a secure automated diagnostic message from your WA-AI.PLATFORM marketing engine.");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load state on mount
  const loadData = async () => {
    setIsLoading(true);
    try {
      const conn = await fetchWhatsAppConnection();
      setConnection(conn);
      const logEntries = await fetchWebhookLogs();
      setLogs(logEntries);
      const hStats = await fetchConnectionHealth();
      setHealth(hStats);
    } catch (err) {
      console.error("Failed to load WhatsApp metadata:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualConnect = async () => {
    setErrorText("");
    setIsLoading(true);
    try {
      if (!formData.phone_number_id || !formData.waba_id || !formData.access_token_encrypted || !formData.verify_token_encrypted || !formData.business_phone) {
        throw new Error("Please complete all required fields (*)");
      }
      const saved = await connectWhatsAppManual(formData);
      setConnection(saved);
      // Run auto-validate
      const check = await validateWhatsAppConnection();
      if (check.success) {
        setWizardStep(3);
        setSuccessMsg(`Connection validated and live! Latency status: ${check.health}.`);
      } else {
        throw new Error(`Connection saved but check failed: ${check.message}`);
      }
      loadData();
    } catch (err: any) {
      setErrorText(err.message || "An exception occurred while verifying credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmbeddedConnectMock = async () => {
    setIsLoading(true);
    setErrorText("");
    try {
      // Simulate OAuth exchange
      const mockOAuth = {
        access_token_encrypted: "EAAG_simulated_oauth_token_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        business_phone: "+1 (833) 922-8321",
        waba_id: "waba_em_" + Math.floor(Math.random() * 90000000 + 10000000),
        phone_number_id: "phone_id_" + Math.floor(Math.random() * 90000000 + 10000000)
      };

      const saved = await connectWhatsAppEmbedded(mockOAuth);
      setConnection(saved);
      setWizardStep(3);
      setSuccessMsg("Phase 2 Embedded Signup mock successful! Facebook Login token exchanged, WABA and Phone auto-discovered.");
      loadData();
    } catch (err: any) {
      setErrorText(err.message || "Embedded login simulated token error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    setIsLoading(true);
    try {
      const check = await validateWhatsAppConnection();
      if (check.success) {
        alert(`Validation successful!\nAPI Status: ${check.health}\nMessage: ${check.message}`);
      } else {
        alert(`Validation failed: ${check.message}`);
      }
      loadData();
    } catch (err: any) {
      alert("Error checking connection health: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp connection? Incoming/outgoing webhooks will stop.")) {
      return;
    }
    const success = await disconnectWhatsApp();
    if (success) {
      setConnection(null);
      setWizardStep(1);
      setErrorText("");
      setSuccessMsg("");
      loadData();
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testNum) {
      setTestResult({ success: false, message: "Please input a recipient phone number" });
      return;
    }
    setTestSending(true);
    setTestResult(null);
    try {
      const outcome = await sendWhatsAppTestMessage(testNum, testText);
      if (outcome.success) {
        setTestResult({ success: true, message: `Message dispatched! ID: ${outcome.messageId}. Status: ${outcome.status}` });
        setTestNum("");
      } else {
        setTestResult({ success: false, message: `Dispatched but delivery reports failed. Status: ${outcome.status}` });
      }
      // Refresh web logs
      const logEntries = await fetchWebhookLogs();
      setLogs(logEntries);
    } catch (err: any) {
      setTestResult({ success: false, message: `Dispatch exception: ${err.message}` });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12" id="whatsapp-settings-viewport">
      {/* Title Header Editorial style */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded font-mono uppercase tracking-widest leading-none">
          Integration Manager
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-3 uppercase" id="whatsapp-title">
          WhatsApp Business API
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure secure Meta partner API credentials, review real-time subscription logs, and monitor webhook delivery pipelines.
        </p>
      </div>

      {/* Main Connection Status Visual Hero Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6.5 shadow-sm" id="whatsapp-status-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full inline-block ${connection ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Connection Status</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {connection ? "Manual Meta BYO Live link connected" : "No WhatsApp account connected"}
            </h2>
            <p className="text-xs text-slate-500 max-w-lg">
              {connection 
                ? `Active Phone ID: ${connection.phone_number_id} | Connected Business phone: ${connection.business_phone}`
                : "Securely link your Meta Business Suite properties using our structured manual wizard, or launch our Phase 2 Embedded Sign-up simulation."
              }
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {connection ? (
              <>
                <button
                  id="btn-revalidate-conn"
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold font-mono uppercase tracking-wider border rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                  onClick={handleValidate}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  Re-Validate Health
                </button>
                <button
                  id="btn-disconnect-conn"
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold font-mono uppercase tracking-wider border border-rose-100 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                  onClick={handleDisconnect}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </>
            ) : (
              <button
                id="btn-open-connector-wizard"
                className="px-5 py-3 bg-black hover:bg-slate-800 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all shadow flex items-center gap-2.5 cursor-pointer"
                onClick={() => {
                  setIsWizardOpen(true);
                  setWizardStep(1);
                  setErrorText("");
                  setSuccessMsg("");
                }}
              >
                <Link className="w-4 h-4" />
                Connect WhatsApp Suite
              </button>
            )}
          </div>
        </div>

        {/* Real-time statistics widgets when connected */}
        {connection && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100" id="whatsapp-conn-diag-panel">
            <div className="bg-slate-50/70 p-4 border rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">API latency</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{health.latencyMs}ms</p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-mono font-bold mt-1.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>HEALTHY</span>
              </div>
            </div>

            <div className="bg-slate-50/70 p-4 border rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">Webhooks Pipeline</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{health.webhookStatus}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-1.5">
                <Globe className="w-3 h-3" />
                <span>Webhook active</span>
              </div>
            </div>

            <div className="bg-slate-50/70 p-4 border rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">Total Deliveries</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{health.totalDelivered}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-1.5">
                <span>Sent: {health.totalSent}</span>
              </div>
            </div>

            <div className="bg-slate-50/70 p-4 border rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">Read Rate</span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {health.totalDelivered ? Math.floor((health.totalRead / health.totalDelivered) * 100) : 0}%
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-1.5">
                <span>Read: {health.totalRead} msgs</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SETUP WIZARD DIALOG PANEL (Step by Step Meta app setup guide) */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none" id="connector-wizard-modal">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase block">Connection Wizard</span>
                <h3 className="text-lg font-bold text-slate-950 uppercase tracking-tight mt-1">Meta Business Set-Up</h3>
              </div>
              <button 
                id="btn-close-wizard"
                className="text-slate-400 hover:text-black font-semibold text-xs py-1.5 px-3 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                onClick={() => setIsWizardOpen(false)}
              >
                Cancel
              </button>
            </div>

            {/* Step Indicators */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-150 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded ${wizardStep === 1 ? 'bg-black text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>1. Meta App Configuration</span>
                <span className="text-slate-300">/</span>
                <span className={`px-2 py-0.5 rounded ${wizardStep === 2 ? 'bg-black text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>2. Paste BYO Credentials</span>
                <span className="text-slate-300">/</span>
                <span className={`px-2 py-0.5 rounded ${wizardStep === 3 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>3. Verify & active</span>
              </div>
              <span className="text-slate-400">Step {wizardStep} of 3</span>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {wizardStep === 1 && (
                <div className="space-y-4" id="wizard-step-1-content">
                  <div className="bg-slate-50 p-4 border rounded-xl flex items-start gap-3.5">
                    <ShieldCheck className="w-5 h-5 text-black shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-900 leading-none mb-1.5">Create your Meta Developer App</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        To link your own Meta Business Account, you must configure a Meta Developer application with WhatsApp product enablement.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">Setup steps on developers.facebook.com:</h4>
                    <ol className="list-decimal list-inside text-xs text-slate-600 space-y-3 pl-1 leading-relaxed">
                      <li>
                        Go to the <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-black hover:underline inline-flex items-center gap-1">Meta for Developers Portal <ExternalLink className="w-3 h-3 inline" /></a> and sign in.
                      </li>
                      <li>
                        Click <strong>"My Apps"</strong> &rarr; <strong>"Create App"</strong>. Select the <strong>"Other"</strong> layout, and toggle the type to <strong>"Business"</strong>.
                      </li>
                      <li>
                        Provide a display name and select your registered Business Manager property.
                      </li>
                      <li>
                        Scroll down on the App Dashboard and pick <strong>"WhatsApp"</strong> &rarr; Click <strong>"Set Up"</strong>.
                      </li>
                      <li>
                        Copy your <strong>Phone Number ID</strong>, <strong>WhatsApp Business Account ID</strong>, and generate a <strong>Permanent Access Token</strong> within your Business Settings Panel.
                      </li>
                    </ol>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 space-y-1">
                    <span className="font-bold uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" /> Webhook settings verification:
                    </span>
                    <p>
                      Make sure to configure your integration webhooks to point back to our live reverse-proxy domain under Settings to capture lead replies in real-time.
                    </p>
                  </div>

                  {/* Phase 2 preview inline */}
                  <div className="pt-4 border-t">
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider">Phase 2 Preview</span>
                        <h5 className="text-xs font-bold text-slate-800 mt-1">Want absolute simplified, 1-Click login?</h5>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Preview our Meta Embedded Sign-Up partner model which discovers your accounts instantly.
                        </p>
                      </div>
                      <button
                        id="btn-simulate-embedded"
                        type="button"
                        onClick={handleEmbeddedConnectMock}
                        className="py-2 px-3 bg-white hover:bg-slate-100 text-black text-[11px] font-bold font-mono uppercase tracking-wider border rounded-lg shrink-0 transition-colors cursor-pointer"
                      >
                        Launch OAuth
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4" id="wizard-step-2-content">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Paste the specific security credentials taken from your Meta Developer Account and Business Settings.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">WhatsApp Business Account ID (WABA) *</label>
                      <input 
                        id="input-waba-id"
                        type="text" 
                        placeholder="e.g. 109284149204910"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white focus:border-black transition-colors"
                        value={formData.waba_id}
                        onChange={(e) => setFormData({...formData, waba_id: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">Phone Number ID *</label>
                      <input 
                        id="input-phone-id"
                        type="text" 
                        placeholder="e.g. 104523912959132"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white focus:border-black transition-colors"
                        value={formData.phone_number_id}
                        onChange={(e) => setFormData({...formData, phone_number_id: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">Business Phone Number *</label>
                      <input 
                        id="input-business-phone"
                        type="text" 
                        placeholder="e.g. +1 555-019-2834"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white focus:border-black transition-colors"
                        value={formData.business_phone}
                        onChange={(e) => setFormData({...formData, business_phone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">Meta Developer App ID (Optional)</label>
                      <input 
                        id="input-app-id"
                        type="text" 
                        placeholder="e.g. 88410928231204"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white focus:border-black transition-colors"
                        value={formData.meta_app_id}
                        onChange={(e) => setFormData({...formData, meta_app_id: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">Verify Hook Token *</label>
                    <input 
                      id="input-verify-token"
                      type="text" 
                      placeholder="Input custom string to authenticate incoming Meta Webhooks challenge"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white focus:border-black transition-colors"
                      value={formData.verify_token_encrypted}
                      onChange={(e) => setFormData({...formData, verify_token_encrypted: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">Permanent Access Token *</label>
                    <textarea 
                      id="input-access-token"
                      rows={3}
                      placeholder="Paste your system user access token or temporary EAAG..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white focus:border-black transition-colors font-mono"
                      value={formData.access_token_encrypted}
                      onChange={(e) => setFormData({...formData, access_token_encrypted: e.target.value})}
                    />
                  </div>

                  {errorText && (
                    <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold" id="wizard-error">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{errorText}</span>
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 text-center py-6" id="wizard-step-3-content">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 text-emerald-600">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Handshake Verified & Connection Confirmed!</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Our `WhatsAppProvider` layer has validated your credentials against Facebook endpoints. Incoming and outgoing automated marketing message queues are now fully active.
                  </p>
                  
                  {successMsg && (
                    <div className="bg-slate-50 p-4 border rounded-xl max-w-md mx-auto text-xs text-slate-600 font-mono whitespace-pre-wrap">
                      {successMsg}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                {wizardStep > 1 && wizardStep < 3 && (
                  <button
                    id="wizard-btn-prev"
                    type="button"
                    className="py-2.5 px-4 bg-white border text-xs font-bold font-mono uppercase tracking-wider text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => setWizardStep(prev => prev - 1)}
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="wizard-btn-cancel-extra"
                  type="button"
                  className="py-2.5 px-4 bg-white border text-xs font-bold font-mono uppercase tracking-wider text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setIsWizardOpen(false)}
                >
                  Close
                </button>

                {wizardStep === 1 && (
                  <button
                    id="wizard-btn-next-step"
                    type="button"
                    className="py-2.5 px-4.5 bg-black hover:bg-slate-800 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    onClick={() => setWizardStep(2)}
                  >
                    Enter Credentials
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {wizardStep === 2 && (
                  <button
                    id="wizard-btn-submit"
                    type="button"
                    className="py-2.5 px-4.5 bg-black hover:bg-slate-800 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    disabled={isLoading}
                    onClick={handleManualConnect}
                  >
                    {isLoading ? "Validating Access..." : "Verify Connection"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CORE OPERATIONS TABS / SUBSECTIONS WHEN ACCOUNT IS ATTACHED */}
      {connection && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8" id="whatsapp-operations-container">
          {/* Diagnostic sending tools (Left Panel) */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight font-mono">Test Send Outbound Message</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4.5 leading-relaxed">
                Dispatch a manual test transaction via your connected Phone ID to diagnose formatting, webhook logs feedback, and latency.
              </p>

              <form onSubmit={handleSendTestMessage} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">Recipient phone *</label>
                  <input 
                    id="test-phone-input"
                    type="text" 
                    placeholder="e.g. +1 (555) 019-9944"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white focus:border-black transition-colors"
                    value={testNum}
                    onChange={(e) => setTestNum(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">Text Payload content</label>
                  <textarea 
                    id="test-message-content"
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white focus:border-black transition-colors font-mono resize-none"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                  />
                </div>

                <button
                  id="btn-submit-test-message"
                  type="submit"
                  disabled={testSending}
                  className="w-full py-2.5 bg-black hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  {testSending ? "Dispatching..." : "Dispatch Test WhatsApp"}
                </button>
              </form>
            </div>

            {testResult && (
              <div className={`mt-5 p-3.5 rounded-xl border text-xs ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`} id="test-dispatch-result">
                <span className="font-bold uppercase tracking-wide block mb-1">
                  {testResult.success ? "Success" : "Send Failure"}
                </span>
                <p className="font-mono leading-normal text-[11px]">{testResult.message}</p>
              </div>
            )}
          </div>

          {/* Webhook events monitoring logs terminal (Right Panel) */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-900 animate-pulse" />
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight font-mono">Structured Webhook Log stream</h3>
                </div>
                <button
                  id="btn-refresh-webhook-logs"
                  className="p-1 px-2.5 bg-slate-50 border text-[10px] font-bold font-mono uppercase rounded hover:bg-slate-100 cursor-pointer"
                  onClick={async () => {
                    const logEntries = await fetchWebhookLogs();
                    setLogs(logEntries);
                  }}
                >
                  Sync Logs
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4.5 leading-relaxed">
                Review asynchronous messaging updates, incoming customer text hooks, and verification pings received from Facebook.
              </p>

              {/* Console stream */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[10px] text-slate-350 space-y-3.5 h-64 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950" id="webhook-logs-terminal">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-center py-12">Listening for incoming Meta API transactions...</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border-b border-slate-900/60 pb-2.5 last:border-b-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${log.status === 'Success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-rose-950 text-rose-400 border border-rose-900'}`}>
                          {log.status}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-white font-semibold">
                        {log.direction === 'Incoming' ? '📥 INCOMING_HOOK' : '📤 OUTBOUND_SEND'}: {log.event}
                      </p>
                      
                      <p className="text-slate-400 leading-normal text-[10px] whitespace-normal">
                        {log.details}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Auto-refresh interval: Active</span>
              <span className="font-mono text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                Socket bound to https://api.wa-marketing.local
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
