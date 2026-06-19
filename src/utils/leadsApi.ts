import { LeadForm } from "../types";

export interface DBLead extends LeadForm {
  id: string;
  createdAt: string;
  status: string;
}

// Check configuration for optional external datastores
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

const firebaseProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;
const firebaseApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;

// Map Firestore REST API response format back to clean DBLead interface
function mapFirestoreDoc(doc: any): DBLead {
  const fields = doc.fields || {};
  const pathParts = doc.name ? doc.name.split("/") : [];
  const id = pathParts[pathParts.length - 1] || `lead_${Date.now()}`;
  return {
    id,
    nomeCompleto: fields.nomeCompleto?.stringValue || "",
    whatsapp: fields.whatsapp?.stringValue || "",
    cidadeUf: fields.cidadeUf?.stringValue || "",
    modeloVeiculo: fields.modeloVeiculo?.stringValue || "",
    anoVeiculo: fields.anoVeiculo?.stringValue || "",
    possuiSeguro: fields.possuiSeguro?.stringValue || "Não",
    usaParaTrabalho: fields.usaParaTrabalho?.stringValue || "Não",
    melhorHorario: fields.melhorHorario?.stringValue || "Manhã",
    observacoes: fields.observacoes?.stringValue || "",
    aceitaTermos: true,
    createdAt: fields.createdAt?.stringValue || doc.createTime || new Date().toISOString(),
    status: fields.status?.stringValue || "Novo"
  };
}

export async function submitLead(lead: LeadForm): Promise<DBLead> {
  const jsonBody = {
    nomeCompleto: lead.nomeCompleto,
    whatsapp: lead.whatsapp,
    cidadeUf: lead.cidadeUf,
    modeloVeiculo: lead.modeloVeiculo,
    anoVeiculo: lead.anoVeiculo,
    possuiSeguro: lead.possuiSeguro,
    usaParaTrabalho: lead.usaParaTrabalho,
    melhorHorario: lead.melhorHorario,
    observacoes: lead.observacoes,
  };

  let localResult: DBLead | null = null;

  // 1. Submit to our robust in-app local Express database
  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonBody),
    });

    if (response.ok) {
      localResult = await response.json();
    } else {
      console.error("Falha ao salvar no backend local do Express");
    }
  } catch (error) {
    console.error("Erro de conexão com o backend local do Express:", error);
  }

  // 2. Clear integration with user proposed Supabase if configured!
  if (supabaseUrl && supabaseAnonKey) {
    try {
      console.log("Supabase detectado! Enviando dados para o Supabase...");
      const supabaseResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads`, {
        method: "POST",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(jsonBody),
      });

      if (!supabaseResponse.ok) {
        const errorText = await supabaseResponse.text();
        console.error("Erro ao inserir dados no Supabase:", errorText);
      } else {
        console.log("Lead sincronizado com sucesso no Supabase!");
      }
    } catch (e) {
      console.error("Erro de conexão com o Supabase:", e);
    }
  }

  // 3. Optional sync to Firebase Firestore if configured!
  if (firebaseProjectId) {
    try {
      console.log("Firebase Firestore detectado! Enviando dados...");
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/leads${firebaseApiKey ? `?key=${firebaseApiKey}` : ""}`;
      
      const firestoreBody = {
        fields: {
          nomeCompleto: { stringValue: lead.nomeCompleto },
          whatsapp: { stringValue: lead.whatsapp },
          cidadeUf: { stringValue: lead.cidadeUf },
          modeloVeiculo: { stringValue: lead.modeloVeiculo },
          anoVeiculo: { stringValue: lead.anoVeiculo },
          possuiSeguro: { stringValue: lead.possuiSeguro },
          usaParaTrabalho: { stringValue: lead.usaParaTrabalho },
          melhorHorario: { stringValue: lead.melhorHorario },
          observacoes: { stringValue: lead.observacoes },
          createdAt: { stringValue: new Date().toISOString() },
          status: { stringValue: "Novo" }
        }
      };

      const fbResponse = await fetch(dbUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(firestoreBody)
      });

      if (!fbResponse.ok) {
        const errorText = await fbResponse.text();
        console.error("Erro ao inserir dados no Firebase Firestore:", errorText);
      } else {
        console.log("Lead sincronizado com sucesso no Firebase Firestore!");
        const fbDoc = await fbResponse.json();
        if (!localResult) {
          localResult = mapFirestoreDoc(fbDoc);
        }
      }
    } catch (e) {
      console.error("Erro de conexão com o Firebase:", e);
    }
  }

  // Return the lead object with id and timestamp
  if (localResult) {
    return localResult;
  }

  // Pure Client fallback if server is offline
  return {
    ...lead,
    id: `lead_temp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "Novo"
  };
}

export async function fetchLeads(password: string): Promise<DBLead[]> {
  // If Firebase credentials are provided, we can fetch all directly from Firebase Firestore,
  // otherwise fetch from Express' leads.json.
  if (firebaseProjectId) {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/leads${firebaseApiKey ? `?key=${firebaseApiKey}` : ""}`;
      const response = await fetch(dbUrl);
      if (response.ok) {
        const data = await response.json();
        const docs = data.documents || [];
        return docs.map(mapFirestoreDoc);
      } else {
        console.error("Erro ao buscar dados do Firebase Firestore. Tentando fallback local...");
      }
    } catch (e) {
      console.error("Falha ao comunicar com Firebase Firestore:", e);
    }
  }

  // Fallback to Express backend leads list
  const response = await fetch("/api/leads", {
    method: "GET",
    headers: {
      "Authorization": password,
    },
  });

  if (!response.ok) {
    throw new Error("Senha administrativa incorreta ou erro de rede.");
  }

  return response.json();
}

export async function updateLeadStatus(id: string, status: string, password: string): Promise<DBLead> {
  // Sync to Firebase if configured
  if (firebaseProjectId) {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/leads/${id}?updateMask.fieldPaths=status${firebaseApiKey ? `&key=${firebaseApiKey}` : ""}`;
      const firestoreBody = {
        fields: {
          status: { stringValue: status }
        }
      };
      await fetch(dbUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(firestoreBody)
      });
      console.log("Status atualizado no Firebase Firestore!");
    } catch (e) {
      console.error("Erro ao atualizar status no Firebase Firestore:", e);
    }
  }

  // Always keep in sync with local Express storage
  const response = await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": password,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível atualizar o status do lead.");
  }

  return response.json();
}

export async function deleteLead(id: string, password: string): Promise<boolean> {
  // Sync deletion to Firebase if configured
  if (firebaseProjectId) {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/leads/${id}${firebaseApiKey ? `&key=${firebaseApiKey}` : ""}`;
      await fetch(dbUrl, {
         method: "DELETE"
      });
      console.log("Lead excluído do Firebase Firestore!");
    } catch (e) {
      console.error("Erro ao excluir lead do Firebase Firestore:", e);
    }
  }

  // Delete from local Express storage
  const response = await fetch(`/api/leads/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": password,
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível excluir o lead.");
  }

  return true;
}

export interface NotificationConfig {
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  discordEnabled: boolean;
  discordWebhookUrl: string;
}

export async function fetchNotificationConfig(password: string): Promise<NotificationConfig> {
  const response = await fetch("/api/notifications", {
    method: "GET",
    headers: {
      "Authorization": password,
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar as configurações de notificação.");
  }

  return response.json();
}

export async function saveNotificationConfig(config: NotificationConfig, password: string): Promise<boolean> {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": password,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error("Não foi possível salvar as configurações de notificação.");
  }

  return true;
}
