export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  score: number;
  stage: "Lead" | "Contacted" | "Qualified" | "Proposal" | "Closed Won" | "Closed Lost";
  tags: string[];
  lastMessageAt: string;
  createdAt: string;
  aiStatus: "AI Active" | "Human Takeover" | "Closed";
}

export interface Message {
  id: string;
  sender: "lead" | "agent" | "ai";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
}

export interface Campaign {
  id: string;
  name: string;
  templateName: string;
  status: "Draft" | "Scheduled" | "Sending" | "Completed" | "Failed";
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliesCount: number;
  audienceSegment: string;
  scheduleTime?: string;
  roi: number;
  spent: number;
  revenue: number;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  text: string;
  variables: string[];
}

export interface AnalyticsSummary {
  totalLeads: number;
  activeConversations: number;
  conversionRate: number;
  campaignROI: number;
  aiResponseAccuracy: number;
}

export interface WhatsAppConnection {
  id: string;
  user_id: string;
  workspace_id: string;
  phone_number_id: string;
  waba_id: string;
  access_token_encrypted: string;
  verify_token_encrypted: string;
  business_phone: string;
  status: "Active" | "Disconnected" | "Pending";
  last_validation_at?: string;
  created_at: string;
  updated_at: string;
  meta_app_id?: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  status: "Success" | "Warning" | "Error";
  direction: "Incoming" | "Outgoing";
  details: string;
}

export interface ConnectionHealth {
  apiStatus: "Healthy" | "Degraded" | "Failed";
  latencyMs: number;
  webhookStatus: "Active" | "Inactive";
  tokenExpiry?: string;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
}
