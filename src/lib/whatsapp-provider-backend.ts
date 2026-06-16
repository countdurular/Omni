import { WhatsAppConnection } from "../types";

export interface WhatsAppProvider {
  connect(credentials: {
    user_id: string;
    workspace_id: string;
    phone_number_id: string;
    waba_id: string;
    access_token_encrypted: string;
    verify_token_encrypted: string;
    business_phone: string;
    meta_app_id?: string;
  }): Promise<WhatsAppConnection>;
  
  disconnect(connection: WhatsAppConnection): Promise<boolean>;
  
  validate(connection: Partial<WhatsAppConnection>): Promise<{
    valid: boolean;
    health: "Healthy" | "Degraded" | "Failed";
    message: string;
    discoveredNumbers?: { id: string; verified_name: string; display_phone_number: string }[];
  }>;
  
  sendMessage(
    connection: WhatsAppConnection,
    to: string,
    text: string
  ): Promise<{ messageId: string; status: "sent" | "delivered" | "failed" }>;
  
  getPhoneNumbers(
    waba_id: string,
    accessToken: string
  ): Promise<{ id: string; verified_name: string; display_phone_number: string }[]>;
  
  registerWebhook(
    phone_number_id: string,
    accessToken: string,
    webhookUrl: string,
    verifyToken: string
  ): Promise<boolean>;
}

export class ManualMetaProvider implements WhatsAppProvider {
  async connect(credentials: any): Promise<WhatsAppConnection> {
    const id = "conn_" + Math.random().toString(36).substr(2, 9);
    const conn: WhatsAppConnection = {
      id,
      user_id: credentials.user_id,
      workspace_id: credentials.workspace_id || "default",
      phone_number_id: credentials.phone_number_id,
      waba_id: credentials.waba_id,
      access_token_encrypted: credentials.access_token_encrypted,
      verify_token_encrypted: credentials.verify_token_encrypted,
      business_phone: credentials.business_phone,
      status: "Active",
      meta_app_id: credentials.meta_app_id,
      last_validation_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return conn;
  }

  async disconnect(connection: WhatsAppConnection): Promise<boolean> {
    return true;
  }

  async validate(connection: Partial<WhatsAppConnection>): Promise<{
    valid: boolean;
    health: "Healthy" | "Degraded" | "Failed";
    message: string;
    discoveredNumbers?: { id: string; verified_name: string; display_phone_number: string }[];
  }> {
    const isMock = !connection.access_token_encrypted?.startsWith("EAAG") && !connection.access_token_encrypted?.startsWith("EAAB");
    
    if (isMock) {
      if (!connection.phone_number_id || connection.phone_number_id.length < 5) {
        return { valid: false, health: "Failed", message: "Error: Invalid Phone Number ID format" };
      }
      if (!connection.waba_id || connection.waba_id.length < 5) {
        return { valid: false, health: "Failed", message: "Error: Invalid WABA ID format" };
      }
      return { 
        valid: true, 
        health: "Healthy", 
        message: "Sandbox Authorization validated with mock Meta App credentials.",
        discoveredNumbers: [
          { id: connection.phone_number_id, verified_name: "Mock Corporate WA Biz", display_phone_number: connection.business_phone || "+1 (555) 019-9944" }
        ]
      };
    }
    
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${connection.phone_number_id}?access_token=${connection.access_token_encrypted}`);
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          valid: false,
          health: "Failed",
          message: `Meta API connection rejected: ${errJson?.error?.message || response.statusText}`
        };
      }
      const data = await response.json();
      return {
        valid: true,
        health: "Healthy",
        message: `Validated successfully with Meta Cloud API. Registered name: ${data.verified_name || "Business Name"}`
      };
    } catch (e: any) {
      return {
        valid: false,
        health: "Failed",
        message: `Network error reaching Facebook Graph Service: ${e.message}`
      };
    }
  }

  async sendMessage(connection: WhatsAppConnection, to: string, text: string): Promise<{ messageId: string; status: "sent" | "delivered" | "failed" }> {
    const isMock = !connection.access_token_encrypted?.startsWith("EAAG") && !connection.access_token_encrypted?.startsWith("EAAB");
    if (isMock) {
      return {
        messageId: "wa_msg_" + Math.random().toString(36).substr(2, 9),
        status: "delivered"
      };
    }
    
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${connection.phone_number_id}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${connection.access_token_encrypted}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: text }
        })
      });
      if (!response.ok) {
        throw new Error(`Meta API error: ${response.statusText}`);
      }
      const resData = await response.json();
      return {
        messageId: resData.messages?.[0]?.id || "wa_sent_" + Date.now(),
        status: "sent"
      };
    } catch (err: any) {
      console.error("Meta sendMessage failed:", err);
      return {
        messageId: "wa_fail_" + Date.now(),
        status: "failed"
      };
    }
  }

  async getPhoneNumbers(waba_id: string, accessToken: string): Promise<{ id: string; verified_name: string; display_phone_number: string }[]> {
    const isMock = !accessToken?.startsWith("EAAG") && !accessToken?.startsWith("EAAB");
    if (isMock) {
      return [
        { id: "10985552312", verified_name: "Demo Support Desk", display_phone_number: "+1 555-019-2834" },
        { id: "20875551234", verified_name: "Mock Sales Bot", display_phone_number: "+44 7700 900077" }
      ];
    }
    
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${waba_id}/phone_numbers?access_token=${accessToken}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    } catch {
      return [];
    }
  }

  async registerWebhook(phone_number_id: string, accessToken: string, webhookUrl: string, verifyToken: string): Promise<boolean> {
    const isMock = !accessToken?.startsWith("EAAG") && !accessToken?.startsWith("EAAB");
    if (isMock) return true;
    
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phone_number_id}/subscribed_apps`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class EmbeddedSignupProvider implements WhatsAppProvider {
  async connect(credentials: any): Promise<WhatsAppConnection> {
    const id = "conn_embed_" + Math.random().toString(36).substr(2, 9);
    const code = credentials.access_token_encrypted;
    const isMock = !code?.startsWith("EAAG") && !code?.startsWith("EAAB");
    
    let discoveredWaba = credentials.waba_id || (isMock ? "waba_embed_99214" : "");
    let discoveredNumberId = credentials.phone_number_id || (isMock ? "phone_embed_34211" : "");
    let businessPhone = credentials.business_phone || (isMock ? "+1 (800) 555-0199" : "");
    
    if (!isMock) {
      try {
        const meRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${code}`);
        if (meRes.ok) {
          const wabaData = await meRes.json();
          const wabaItem = wabaData.data?.[0];
          if (wabaItem) {
            discoveredWaba = wabaItem.id;
          }
        }
        
        if (discoveredWaba) {
          const numRes = await fetch(`https://graph.facebook.com/v21.0/${discoveredWaba}/phone_numbers?access_token=${code}`);
          if (numRes.ok) {
            const numData = await numRes.json();
            const phoneItem = numData.data?.[0];
            if (phoneItem) {
              discoveredNumberId = phoneItem.id;
              businessPhone = phoneItem.display_phone_number || "";
            }
          }
        }
      } catch (err) {
        console.error("Meta OAuth phone numbers discovery failed:", err);
      }
    }
    
    const conn: WhatsAppConnection = {
      id,
      user_id: credentials.user_id,
      workspace_id: credentials.workspace_id || "default",
      phone_number_id: discoveredNumberId || "phone_embed_discovering",
      waba_id: discoveredWaba || "waba_embed_discovering",
      access_token_encrypted: code,
      verify_token_encrypted: credentials.verify_token_encrypted || "embed_verify_token_gen_" + Math.random().toString(36).substring(2, 8),
      business_phone: businessPhone || "Discovered Active Number",
      status: "Active",
      meta_app_id: credentials.meta_app_id || "8841092823",
      last_validation_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return conn;
  }

  async disconnect(connection: WhatsAppConnection): Promise<boolean> {
    return true;
  }

  async validate(connection: Partial<WhatsAppConnection>): Promise<{
    valid: boolean;
    health: "Healthy" | "Degraded" | "Failed";
    message: string;
    discoveredNumbers?: { id: string; verified_name: string; display_phone_number: string }[];
  }> {
    return new ManualMetaProvider().validate(connection);
  }

  async sendMessage(connection: WhatsAppConnection, to: string, text: string): Promise<{ messageId: string; status: "sent" | "delivered" | "failed" }> {
    return new ManualMetaProvider().sendMessage(connection, to, text);
  }

  async getPhoneNumbers(waba_id: string, accessToken: string): Promise<{ id: string; verified_name: string; display_phone_number: string }[]> {
    return new ManualMetaProvider().getPhoneNumbers(waba_id, accessToken);
  }

  async registerWebhook(phone_number_id: string, accessToken: string, webhookUrl: string, verifyToken: string): Promise<boolean> {
    return new ManualMetaProvider().registerWebhook(phone_number_id, accessToken, webhookUrl, verifyToken);
  }
}
