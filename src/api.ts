import { Lead, Message, Campaign, CampaignTemplate, AnalyticsSummary, WhatsAppConnection, WebhookLog, ConnectionHealth } from './types';

// Dummy seeder function to prevent breaking App.tsx imports of seedFirestoreIfEmpty
export async function seedFirestoreIfEmpty(): Promise<void> {
  // Database seeding is now safely executed and handled on the server side
}

// --- REST Endpoint Client Operations ---

export async function fetchLeads(): Promise<Lead[]> {
  const res = await fetch("/api/leads");
  if (!res.ok) {
    throw new Error(`Failed to fetch leads: ${res.statusText}`);
  }
  return await res.json();
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to create lead: ${res.statusText}`);
  }
  return await res.json();
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to update lead: ${res.statusText}`);
  }
  return await res.json();
}

export async function deleteLead(id: string): Promise<boolean> {
  const res = await fetch(`/api/leads/${id}`, {
    method: "DELETE"
  });
  return res.ok;
}

export async function fetchConversation(leadId: string): Promise<Message[]> {
  const res = await fetch(`/api/leads/${leadId}/conversation`);
  if (!res.ok) {
    throw new Error(`Failed to fetch conversation: ${res.statusText}`);
  }
  return await res.json();
}

export async function sendMessage(leadId: string, sender: 'agent' | 'lead' | 'ai', text: string): Promise<Message> {
  const res = await fetch(`/api/leads/${leadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender, text })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to send message: ${res.statusText}`);
  }
  return await res.json();
}

export async function getAiSuggestion(leadId: string, lastMessage: string): Promise<string> {
  const res = await fetch("/api/ai/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId, lastMessage })
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch AI suggestions: ${res.statusText}`);
  }
  const data = await res.json();
  return data.suggestion;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await fetch("/api/campaigns");
  if (!res.ok) {
    throw new Error(`Failed to fetch campaigns: ${res.statusText}`);
  }
  return await res.json();
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const res = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to create campaign: ${res.statusText}`);
  }
  return await res.json();
}

export async function triggerCampaignSend(id: string): Promise<boolean> {
  const res = await fetch(`/api/campaigns/${id}/send`, {
    method: "POST"
  });
  return res.ok;
}

export async function fetchTemplates(): Promise<CampaignTemplate[]> {
  const res = await fetch("/api/templates");
  if (!res.ok) {
    throw new Error(`Failed to fetch templates: ${res.statusText}`);
  }
  return await res.json();
}

export async function simulateWebhook(data: { name?: string; phone: string; message: string }): Promise<string> {
  const res = await fetch("/api/webhooks/whatsapp/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Webhook simulation failed: ${res.statusText}`);
  }
  const result = await res.json();
  return result.leadId;
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch("/api/analytics");
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  }
  return await res.json();
}

// --- WHATSAPP CONNECTION CLIENT SYSTEM ---

export async function fetchWhatsAppConnection(): Promise<WhatsAppConnection | null> {
  try {
    const res = await fetch("/api/whatsapp/connection");
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("fetchWhatsAppConnection failed:", e);
  }
  return null;
}

export async function connectWhatsAppManual(
  credentials: Omit<WhatsAppConnection, 'id' | 'user_id' | 'workspace_id' | 'status' | 'created_at' | 'updated_at'>
): Promise<WhatsAppConnection> {
  const res = await fetch("/api/whatsapp/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to connect manual WhatsApp");
  }
  return await res.json();
}

export async function connectWhatsAppEmbedded(
  credentials: { access_token_encrypted: string; business_phone: string; waba_id?: string; phone_number_id?: string }
): Promise<WhatsAppConnection> {
  const res = await fetch("/api/whatsapp/embedded-signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to execute Meta OAuth Signup");
  }
  return await res.json();
}

export async function disconnectWhatsApp(): Promise<boolean> {
  const res = await fetch("/api/whatsapp/disconnect", {
    method: "POST"
  });
  return res.ok;
}

export async function validateWhatsAppConnection(): Promise<{ success: boolean; health: string; message: string }> {
  try {
    const res = await fetch("/api/whatsapp/validate", {
      method: "POST"
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return data;
    }
    return { success: false, health: "Failed", message: data.error || "Validation API returned an error" };
  } catch (e: any) {
    return { success: false, health: "Failed", message: e.message || "Connection refused by verification server" };
  }
}

export async function sendWhatsAppTestMessage(to: string, text: string): Promise<{ success: boolean; messageId: string; status: string }> {
  try {
    const res = await fetch("/api/whatsapp/test-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, text })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("sendWhatsAppTestMessage client-side failed:", e);
  }
  return { success: false, messageId: "", status: "failed" };
}

export async function fetchWebhookLogs(): Promise<WebhookLog[]> {
  try {
    const res = await fetch("/api/whatsapp/webhook-logs");
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("fetchWebhookLogs failed:", e);
  }
  return [];
}

export async function fetchConnectionHealth(): Promise<ConnectionHealth> {
  try {
    const res = await fetch("/api/whatsapp/usage-stats");
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("fetchConnectionHealth failed:", e);
  }
  return {
    apiStatus: "Failed",
    latencyMs: 0,
    webhookStatus: "Inactive",
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0
  };
}
