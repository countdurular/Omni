import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { ManualMetaProvider, EmbeddedSignupProvider } from "./src/lib/whatsapp-provider-backend";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY is not set or using default value. App will run in local simulation mode.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini API:", error);
}

// Simulated CRM Database Store
interface DBModel {
  leads: any[];
  conversations: Record<string, any[]>;
  campaigns: any[];
  templates: any[];
  authUsers: any[];
  session: any | null;
  whatsappConnections?: any[];
  webhookLogs?: any[];
}

const SEED_DATA: DBModel = {
  leads: [
    {
      id: "lead-1",
      name: "Sarah Jenkins",
      phone: "+1 (555) 234-5678",
      email: "sarah.j@techvision.io",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120",
      score: 88,
      stage: "Qualified",
      tags: ["High-Intent", "SaaS Buyer", "Enterprise"],
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      aiStatus: "AI Active"
    },
    {
      id: "lead-2",
      name: "Marcus Aurelius",
      phone: "+39 (329) 123-4567",
      email: "marcus.a@empirecorp.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120",
      score: 95,
      stage: "Proposal",
      tags: ["Decision Maker", "WhatsApp Lead Ad", "Automotive"],
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      aiStatus: "Human Takeover"
    },
    {
      id: "lead-3",
      name: "Amara Okonkwo",
      phone: "+234 (803) 987-6543",
      email: "amara@impactfinance.ng",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120",
      score: 64,
      stage: "Contacted",
      tags: ["Webinar Sign-up", "Fintech"],
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      aiStatus: "AI Active"
    },
    {
      id: "lead-4",
      name: "David Chen",
      phone: "+65 9123 4567",
      email: "david.chen@asiaprime.sg",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120",
      score: 42,
      stage: "Lead",
      tags: ["Cold Outreach", "Developer"],
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      aiStatus: "Closed"
    }
  ],
  conversations: {
    "lead-1": [
      { id: "m1", sender: "lead", text: "Hi there! I saw your WhatsApp advert for AI-driven workflows. Does it support custom CRM integrations?", timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { id: "m2", sender: "ai", text: "Hello Sarah! Thanks for reaching out. Yes, our WhatsApp automation platform easily integrates with major CRMs such as Salesforce, HubSpot, and active custom solutions via webhooks. Would you like a quick 5-minute preview of how the sync works?", timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
      { id: "m3", sender: "lead", text: "That sounds amazing! Yes, we currently use HubSpot. Can you explain how it handles lead scoring updates in real-time when a lead replies?", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() }
    ],
    "lead-2": [
      { id: "m4", sender: "lead", text: "Can you send me the price quote regarding the Enterprise Plan we discussed on the call?", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { id: "m5", sender: "agent", text: "Hi Marcus, I am generating the custom contract with our engineering support package included. It will be ready in 10 minutes maximum.", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() }
    ],
    "lead-3": [
      { id: "m6", sender: "lead", text: "Interested in automating our customer onboarding messages.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
      { id: "m7", sender: "ai", text: "Fantastic, Amara! Our onboarding automation allows you to trigger personalized templates as soon as a lead completes checkout or registers. Do you use Stripe or another payment processor?", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() }
    ],
    "lead-4": [
      { id: "m8", sender: "agent", text: "Hello David, just checking if you have any questions regarding our developer API documentation?", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString() },
      { id: "m9", sender: "lead", text: "Not at this time, thank you.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
    ]
  },
  campaigns: [
    {
      id: "camp-1",
      name: "Enterprise Q2 Flash CRM Broadcast",
      templateName: "Lead Engagement Promo",
      status: "Completed",
      sentCount: 1420,
      deliveredCount: 1398,
      readCount: 1254,
      repliesCount: 412,
      audienceSegment: "Enterprise Intent Leads",
      roi: 385,
      spent: 120.00,
      revenue: 5820.00,
      scheduleTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    },
    {
      id: "camp-2",
      name: "SaaS Automated Lead Nurturing Webpack",
      templateName: "Interactive Feature Walkthrough",
      status: "Completed",
      sentCount: 840,
      deliveredCount: 825,
      readCount: 710,
      repliesCount: 224,
      audienceSegment: "High Score SaaS",
      roi: 247,
      spent: 75.00,
      revenue: 2600.00,
      scheduleTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    },
    {
      id: "camp-3",
      name: "June Re-engagement Outreach",
      templateName: "Quick Support Reconnect",
      status: "Draft",
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      repliesCount: 0,
      audienceSegment: "Cold Inactive (30d+)",
      roi: 0,
      spent: 0.0,
      revenue: 0.0
    }
  ],
  templates: [
    {
      id: "tpl-1",
      name: "Lead Engagement Promo",
      text: "Hey {{1}}! We noticed your team at {{2}} is expanding. Did you know our WhatsApp Automation can boost your lead response rates by 400%? Let me know if you want a quick custom video demo!",
      variables: ["Contact Name", "Company Name"]
    },
    {
      id: "tpl-2",
      name: "Interactive Feature Walkthrough",
      text: "Hi {{1}}, thanks for your interest in our WhatsApp AI Inbox. Click one of our interactive buttons below to test-drive features live: [Learn Live Inbox] or [Chat with AI Demo Bot].",
      variables: ["Contact Name"]
    },
    {
      id: "tpl-3",
      name: "Quick Support Reconnect",
      text: "Hello {{1}}! It's been a while since we chatted about automating {{2}}. We've just released massive upgrades to our CRM sync speed. Still looking to supercharge your chat operations?",
      variables: ["Contact Name", "Primary CRM"]
    }
  ],
  authUsers: [
    { email: "countdurular@gmail.com", password: "password123", name: "SaaS Admin" }
  ],
  session: { email: "countdurular@gmail.com", name: "SaaS Admin" },
  whatsappConnections: [],
  webhookLogs: [
    { id: "log-1", timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), event: "Webhook validation challenge successful.", status: "Success", direction: "Incoming", details: "Meta verification token verified on subscription challenge." },
    { id: "log-2", timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(), event: "API status check ping.", status: "Success", direction: "Outgoing", details: "latency: 184ms, Meta Graph API ping healthy." },
    { id: "log-3", timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), event: "Template category update.", status: "Success", direction: "Incoming", details: "Template category 'Lead Engagement Promo' synchronized from WABA Manager." },
    { id: "log-4", timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), event: "Message status update: Delivered.", status: "Success", direction: "Incoming", details: "Message ID wamid.HBgLMTY1 updated to DELIVERED for lead +1 (555) 234-5678." }
  ]
};

// Global Store State loaded from disk / memory
let state: DBModel = { ...SEED_DATA };

// --- DB Persistence Helpers ---
const DB_FILE = path.join("/tmp", "whatsapp_s_db.json");
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to DB file:", err);
  }
}
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      state = JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading DB file, keeping seed data:", err);
  } finally {
    // Enforce array existences
    if (!state.whatsappConnections) state.whatsappConnections = [];
    if (!state.webhookLogs) state.webhookLogs = SEED_DATA.webhookLogs || [];
  }
}
loadDB();

// ---------------- API ENDPOINTS ----------------

// 1. Session / Auth Simulation
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const user = state.authUsers.find(u => u.email === email && u.password === password);
  if (user) {
    state.session = { email: user.email, name: user.name };
    saveDB();
    return res.json({ user: state.session });
  }
  // Allow dynamic registration for safety
  const defaultUser = { email, name: email.split("@")[0].toUpperCase() };
  state.authUsers.push({ email, password, name: defaultUser.name });
  state.session = defaultUser;
  saveDB();
  return res.json({ user: state.session });
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  state.session = null;
  saveDB();
  res.json({ success: true });
});

app.get("/api/auth/session", (req: Request, res: Response) => {
  res.json({ user: state.session });
});

// 2. CRM Leads API
app.get("/api/leads", (req: Request, res: Response) => {
  res.json(state.leads);
});

app.post("/api/leads", (req: Request, res: Response) => {
  const { name, phone, email, score, stage, tags, aiStatus } = req.body;
  const newLead = {
    id: `lead-${Date.now()}`,
    name: name || "Anonymous Lead",
    phone: phone || "+1 (555) 000-0000",
    email: email || "anonymous@lead.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120",
    score: score || 50,
    stage: stage || "Lead",
    tags: tags || [],
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    aiStatus: aiStatus || "AI Active"
  };
  state.leads.unshift(newLead);
  state.conversations[newLead.id] = [
    { id: `m-${Date.now()}`, sender: "ai", text: `Welcome ${newLead.name}! Our WhatsApp marketing automation systems are now ready.`, timestamp: new Date().toISOString() }
  ];
  saveDB();
  res.status(201).json(newLead);
});

app.put("/api/leads/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const index = state.leads.findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }
  state.leads[index] = { ...state.leads[index], ...req.body };
  saveDB();
  res.json(state.leads[index]);
});

app.delete("/api/leads/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  state.leads = state.leads.filter(l => l.id !== id);
  delete state.conversations[id];
  saveDB();
  res.json({ success: true });
});

// 3. Conversation API & Direct Send Simulation
app.get("/api/leads/:id/conversation", (req: Request, res: Response) => {
  const { id } = req.params;
  const chat = state.conversations[id] || [];
  res.json(chat);
});

app.post("/api/leads/:id/messages", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sender, text } = req.body;
  
  const leadIndex = state.leads.findIndex(l => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const newMessage = {
    id: `m-${Date.now()}`,
    sender: sender || "agent",
    text: text || "",
    timestamp: new Date().toISOString(),
    status: "read"
  };

  if (!state.conversations[id]) {
    state.conversations[id] = [];
  }
  state.conversations[id].push(newMessage);
  state.leads[leadIndex].lastMessageAt = newMessage.timestamp;

  saveDB();

  // If the user sends a message as "lead", and AI is active, simulate AI automated answering in 1.5 seconds!
  if (sender === "lead" && state.leads[leadIndex].aiStatus === "AI Active") {
    setTimeout(async () => {
      try {
        const replyText = await generateAiReplyText(id, text);
        const aiMessage = {
          id: `m-${Date.now() + 1}`,
          sender: "ai" as const,
          text: replyText,
          timestamp: new Date().toISOString(),
          status: "read"
        };
        state.conversations[id].push(aiMessage);
        
        // Find lead check index again in case of timing changes
        const leadIndexUpdate = state.leads.findIndex(l => l.id === id);
        if (leadIndexUpdate !== -1) {
          state.leads[leadIndexUpdate].lastMessageAt = aiMessage.timestamp;
        }
        saveDB();
      } catch (e) {
        console.error("Delayed AI Answer Error:", e);
      }
    }, 1500);
  }

  res.json(newMessage);
});

// Helper for real Gemini prompt answering with robust retries and fallback models
async function generateAiReplyText(leadId: string, lastUserMessage: string): Promise<string> {
  const lead = state.leads.find(l => l.id === leadId);
  const thread = state.conversations[leadId] || [];
  
  if (!ai) {
    return `Hi ${lead?.name || "there"}! (Simulation Mode) Thanks for your message: "${lastUserMessage}". Our team is checking this, we are ready to guide you on WhatsApp Automation!`;
  }

  try {
    const threadString = thread
      .slice(-6)
      .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n");

    const prompt = `You are an expert AI Marketing Assistant answering of behalf of 'WhatsApp AI Marketing Automation' SaaS platform.
The current customer/lead you are responding to is:
- Name: ${lead?.name}
- Email: ${lead?.email}
- Pipeline Stage: ${lead?.stage}
- Lead Score: ${lead?.score}/100
- Tags: ${lead?.tags.join(", ")}

Recent conversation history:
${threadString}

Generate a friendly, professional, high-converting simulated WhatsApp reply to their latest message: "${lastUserMessage}". Keep it short and under 3 normal sentences, optimized for WhatsApp readability. Do not put quote marks around response.`;

    // We will try gemini-3.5-flash first, and fallback to gemini-3.1-flash-lite if we experience 503/errors
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let finalResponseText = "";
    let lastError: any = null;

    for (const model of modelsToTry) {
      // Retry up to 3 times per model with minor delay
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
          });

          if (response && response.text) {
            finalResponseText = response.text.trim();
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini Retry Warning] Model ${model} attempt ${attempt} failed: ${err.message || err}`);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, attempt * 300));
          }
        }
      }
      if (finalResponseText) {
        break;
      }
    }

    if (finalResponseText) {
      return finalResponseText;
    }

    console.warn("All Gemini attempts failed. Falling back to simulation text.", lastError?.message || lastError);
    return `Hi ${lead?.name || "there"}! We received your message: "${lastUserMessage}". An representative is reviewing your details to provide tailored automations.`;
  } catch (error) {
    console.warn("Gemini suggestion fallback error handler activated:", error);
    return `Hello! We appreciate your query. I've logged your request regarding our automations and our CRM integrations, and we will follow up shortly.`;
  }
}

// 4. Gemini Suggested Reply Endpoint
app.post("/api/ai/suggest", async (req: Request, res: Response) => {
  const { leadId, lastMessage } = req.body;
  if (!leadId) {
    return res.status(400).json({ error: "leadId is required" });
  }

  try {
    const suggestion = await generateAiReplyText(leadId, lastMessage || "Hello!");
    res.json({ suggestion });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate suggestion" });
  }
});

// 5. Campaign APIs & Simulation
app.get("/api/campaigns", (req: Request, res: Response) => {
  res.json(state.campaigns);
});

app.post("/api/campaigns", (req: Request, res: Response) => {
  const { name, templateName, audienceSegment } = req.body;
  const newCamp = {
    id: `camp-${Date.now()}`,
    name: name || "New Broadcast Campaign",
    templateName: templateName || "Lead Engagement Promo",
    status: "Draft",
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    repliesCount: 0,
    audienceSegment: audienceSegment || "All Leads",
    roi: 0,
    spent: 0,
    revenue: 0
  };
  state.campaigns.unshift(newCamp);
  saveDB();
  res.status(201).json(newCamp);
});

// Simulate Campaign Dispatch
app.post("/api/campaigns/:id/send", (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = state.campaigns.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  // Set to Sending
  state.campaigns[idx].status = "Sending";
  saveDB();

  // Simulate progress
  setTimeout(() => {
    const cIdx = state.campaigns.findIndex(c => c.id === id);
    if (cIdx !== -1) {
      const isLarge = state.campaigns[cIdx].audienceSegment.includes("Cold") ? 1200 : 450;
      const sent = isLarge;
      const delivered = Math.floor(sent * 0.98);
      const read = Math.floor(delivered * 0.88);
      const replies = Math.floor(read * 0.35);
      const spent = parseFloat((sent * 0.05).toFixed(2)); // $0.05 per message
      const revenue = Math.floor(replies * 0.15) * 499; // 15% conversion at $499 LTV
      const roi = spent > 0 ? Math.floor(((revenue - spent) / spent) * 100) : 0;

      state.campaigns[cIdx] = {
        ...state.campaigns[cIdx],
        status: "Completed",
        sentCount: sent,
        deliveredCount: delivered,
        readCount: read,
        repliesCount: replies,
        spent,
        revenue,
        roi,
        scheduleTime: new Date().toISOString()
      };
      
      // Also simulate actual incoming messages from a couple of leads responding to that campaign!
      try {
        const receivingLeads = state.leads.slice(0, 2);
        receivingLeads.forEach(lead => {
          const templ = state.templates.find(t => t.name === state.campaigns[cIdx].templateName);
          let messageText = templ ? templ.text : "Hi there, checking out our product upgrades!";
          // replace vars
          messageText = messageText.replace("{{1}}", lead.name).replace("{{2}}", "HubSpot");
          
          if (!state.conversations[lead.id]) state.conversations[lead.id] = [];
          state.conversations[lead.id].push({
            id: `m-camp-${Date.now()}`,
            sender: "agent",
            text: messageText,
            timestamp: new Date().toISOString()
          });
          state.conversations[lead.id].push({
            id: `m-camp-rep-${Date.now()}`,
            sender: "lead",
            text: "This is super interesting! Tell me more about the instant pricing package.",
            timestamp: new Date(Date.now() + 1000).toISOString()
          });
          
          lead.lastMessageAt = new Date(Date.now() + 1000).toISOString();
          lead.score = Math.min(100, lead.score + 10); // boost lead score
        });
      } catch (err) {
        console.error("Error creating sub interaction:", err);
      }
      
      saveDB();
    }
  }, 2500);

  res.json({ success: true, message: "Campaign simulation started" });
});

// GET Templates
app.get("/api/templates", (req: Request, res: Response) => {
  res.json(state.templates);
});

// 6. Hook simulation to trigger Meta Lead Ads update / Whatsapp incoming directly
app.post("/api/webhooks/whatsapp/simulate", (req: Request, res: Response) => {
  const { name, phone, message } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required to simulate incoming chat" });
  }

  // Check if lead already exists
  let existingIndex = state.leads.findIndex(l => l.phone === phone);
  let targetLeadId = "";

  if (existingIndex !== -1) {
    targetLeadId = state.leads[existingIndex].id;
    state.leads[existingIndex].lastMessageAt = new Date().toISOString();
  } else {
    // Create new lead!
    const newLead = {
      id: `lead-${Date.now()}`,
      name: name || "New WhatsApp Lead",
      phone: phone,
      email: `${(name || "lead").toLowerCase().replace(/\s+/g, '')}@example-meta.com`,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120",
      score: 75,
      stage: "Lead" as const,
      tags: ["Meta Ad Lead"],
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      aiStatus: "AI Active" as const
    };
    state.leads.unshift(newLead);
    targetLeadId = newLead.id;
  }

  const incomingMessage = {
    id: `m-${Date.now()}`,
    sender: "lead" as const,
    text: message || "Hello! I saw your Meta Lead Ad.",
    timestamp: new Date().toISOString(),
    status: "read" as const
  };

  if (!state.conversations[targetLeadId]) {
    state.conversations[targetLeadId] = [];
  }
  state.conversations[targetLeadId].push(incomingMessage);
  saveDB();

  // If AI Status is Active, trigger immediate automatic reply in 1 sec
  const leadMatch = state.leads.find(l => l.id === targetLeadId);
  if (leadMatch && leadMatch.aiStatus === "AI Active") {
    setTimeout(async () => {
      try {
        const replyText = await generateAiReplyText(targetLeadId, incomingMessage.text);
        const aiMessage = {
          id: `m-${Date.now() + 1}`,
          sender: "ai" as const,
          text: replyText,
          timestamp: new Date().toISOString(),
          status: "read" as const
        };
        state.conversations[targetLeadId].push(aiMessage);
        
        // Refresh index
        const matchUpdate = state.leads.findIndex(l => l.id === targetLeadId);
        if (matchUpdate !== -1) {
          state.leads[matchUpdate].lastMessageAt = aiMessage.timestamp;
        }
        saveDB();
      } catch (err) {
        console.error("Delayed AI answer on hook failed:", err);
      }
    }, 1200);
  }

  res.json({ success: true, leadId: targetLeadId });
});

// 7. General Analytics aggregated Endpoint
app.get("/api/analytics", (req: Request, res: Response) => {
  const totalLeads = state.leads.length;
  const activeConversations = state.leads.filter(l => l.aiStatus === "AI Active" || l.aiStatus === "Human Takeover").length;
  
  // calculate total conversion rate from stage "Closed Won"
  const closedWon = state.leads.filter(l => l.stage === "Closed Won").length;
  const conversionRate = totalLeads ? parseFloat(((closedWon / totalLeads) * 100).toFixed(1)) : 18.5;

  // calculate average ROI
  const completedCampaigns = state.campaigns.filter(c => c.status === "Completed");
  const totalRoi = completedCampaigns.reduce((sum, c) => sum + c.roi, 0);
  const averageRoi = completedCampaigns.length ? Math.floor(totalRoi / completedCampaigns.length) : 315;

  res.json({
    totalLeads,
    activeConversations,
    conversionRate: conversionRate || 19.5,
    campaignROI: averageRoi,
    aiResponseAccuracy: 95.8
  });
});

// ---------------- WABA / WHATSAPP INTEGRATION ENDPOINTS ----------------
const manualProvider = new ManualMetaProvider();
const embeddedProvider = new EmbeddedSignupProvider();

function getActiveConnection() {
  if (!state.whatsappConnections) {
    state.whatsappConnections = [];
  }
  return state.whatsappConnections.find(c => c.status === "Active");
}

app.get("/api/whatsapp/connection", (req: Request, res: Response) => {
  const conn = getActiveConnection();
  res.json(conn || null);
});

app.post("/api/whatsapp/connect", async (req: Request, res: Response) => {
  try {
    const { phone_number_id, waba_id, access_token_encrypted, verify_token_encrypted, business_phone, meta_app_id } = req.body;
    if (!phone_number_id || !waba_id || !access_token_encrypted || !verify_token_encrypted || !business_phone) {
      return res.status(400).json({ error: "Missing required WhatsApp credentials fields" });
    }
    
    // Disconnect existing
    if (state.whatsappConnections) {
      state.whatsappConnections = state.whatsappConnections.map(c => ({ ...c, status: "Disconnected" as const }));
    } else {
      state.whatsappConnections = [];
    }

    const conn = await manualProvider.connect({
      user_id: state.session?.email || "countdurular@gmail.com",
      workspace_id: "default",
      phone_number_id,
      waba_id,
      access_token_encrypted,
      verify_token_encrypted,
      business_phone,
      meta_app_id
    });

    state.whatsappConnections.push(conn);
    
    if (!state.webhookLogs) state.webhookLogs = [];
    state.webhookLogs.unshift({
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      event: "Manual BYO connection activated",
      status: "Success",
      direction: "Incoming",
      details: `Phone ID: ${phone_number_id}, Business Number: ${business_phone}. Saved securely to workspace.`
    });
    
    saveDB();
    res.json(conn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/whatsapp/embedded-signup", async (req: Request, res: Response) => {
  try {
    const { access_token_encrypted, business_phone, waba_id, phone_number_id } = req.body;
    if (!access_token_encrypted) {
      return res.status(400).json({ error: "Missing required Meta Access Token from OAuth Exchange" });
    }

    // Disconnect existing
    if (state.whatsappConnections) {
      state.whatsappConnections = state.whatsappConnections.map(c => ({ ...c, status: "Disconnected" as const }));
    } else {
      state.whatsappConnections = [];
    }

    const conn = await embeddedProvider.connect({
      user_id: state.session?.email || "countdurular@gmail.com",
      workspace_id: "default",
      phone_number_id,
      waba_id,
      access_token_encrypted,
      verify_token_encrypted: "embed_verify_token_gen_" + Math.random().toString(36).substring(2, 8),
      business_phone,
      meta_app_id: "8841092823"
    });

    state.whatsappConnections.push(conn);

    if (!state.webhookLogs) state.webhookLogs = [];
    state.webhookLogs.unshift({
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      event: "Embedded signup connection active",
      status: "Success",
      direction: "Incoming",
      details: `Meta OAuth login completed. Identified WABA: ${conn.waba_id}, Discovered Number: ${conn.business_phone}. Webhook subscribed.`
    });

    saveDB();
    res.json(conn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/whatsapp/disconnect", (req: Request, res: Response) => {
  if (state.whatsappConnections) {
    state.whatsappConnections = state.whatsappConnections.map(c => ({ ...c, status: "Disconnected" as const }));
  }
  if (!state.webhookLogs) state.webhookLogs = [];
  state.webhookLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    event: "WhatsApp link disconnected",
    status: "Warning",
    direction: "Outgoing",
    details: "User initiated disconnect. Credentials removed from active status."
  });
  saveDB();
  res.json({ success: true });
});

app.post("/api/whatsapp/validate", async (req: Request, res: Response) => {
  const conn = getActiveConnection();
  if (!conn) {
    return res.status(404).json({ error: "No active WhatsApp connection found" });
  }
  
  const result = await manualProvider.validate(conn);
  if (result.valid) {
    conn.last_validation_at = new Date().toISOString();
  }
  
  if (!state.webhookLogs) state.webhookLogs = [];
  state.webhookLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    event: "API credentials validation request",
    status: result.valid ? "Success" : "Error",
    direction: "Outgoing",
    details: `Validation status: ${result.health}. Return message: ${result.message}`
  });
  saveDB();

  res.json({ success: result.valid, health: result.health, message: result.message });
});

app.post("/api/whatsapp/test-message", async (req: Request, res: Response) => {
  const conn = getActiveConnection();
  if (!conn) {
    return res.status(404).json({ error: "No active connection" });
  }

  const { to, text } = req.body;
  if (!to || !text) {
    return res.status(400).json({ error: "Missing recipient (to) or content (text)" });
  }

  const result = await manualProvider.sendMessage(conn, to, text);
  if (!state.webhookLogs) state.webhookLogs = [];
  
  state.webhookLogs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    event: "Test Message Outbound",
    status: result.status === "sent" || result.status === "delivered" ? "Success" : "Error",
    direction: "Outgoing",
    details: `Content: "${text}". Sent to recipient: ${to}. Status feedback: ${result.status}`
  });
  saveDB();

  res.json({ success: result.status !== "failed", messageId: result.messageId, status: result.status });
});

app.get("/api/whatsapp/webhook-logs", (req: Request, res: Response) => {
  if (!state.webhookLogs) {
    state.webhookLogs = [];
  }
  res.json(state.webhookLogs);
});

app.get("/api/whatsapp/usage-stats", (req: Request, res: Response) => {
  const activeConn = getActiveConnection();
  res.json({
    connected: !!activeConn,
    apiStatus: activeConn ? "Healthy" : "Failed",
    latencyMs: activeConn ? 142 : 0,
    webhookStatus: activeConn ? "Active" : "Inactive",
    totalSent: activeConn ? 420 : 0,
    totalDelivered: activeConn ? 418 : 0,
    totalRead: activeConn ? 385 : 0
  });
});

// ---------------- SERVER AND VITE SERVING ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
