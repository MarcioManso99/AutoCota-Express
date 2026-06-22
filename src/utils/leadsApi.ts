/// <reference types="vite/client" />
import { LeadForm } from "../types";

export interface DBLead extends LeadForm {
  id: string;
  createdAt: string;
  status: string;
}

// Check configuration for optional external datastores
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

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

// Helper to get admin password dynamically on the static client (via Firestore or fallback)
async function getStoredAdminPassword(): Promise<string> {
  const defaultPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
  
  // Check localStorage first (client level override/persistence)
  const localSaved = localStorage.getItem("static_admin_password");
  if (localSaved) {
    return localSaved;
  }

  if (!firebaseProjectId) {
    return defaultPassword;
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/admin_config/password${firebaseApiKey ? `?key=${firebaseApiKey}` : ""}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const pwd = data.fields?.password?.stringValue;
      if (pwd) {
        return pwd;
      }
    }
  } catch (e) {
    console.error("Erro ao obter senha administrativa do Firestore:", e);
  }
  return defaultPassword;
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

  let finalResult: DBLead | null = null;

  // 1. Primary Sync to Firebase Firestore if configured! (100% static client-side)
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
          observacoes: { stringValue: lead.observacoes || "" },
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
        finalResult = mapFirestoreDoc(fbDoc);
      }
    } catch (e) {
      console.error("Erro de conexão com o Firebase:", e);
    }
  }

  // 2. Submit to local Express database as fallback/dev helper (non-blocking if Firestore worked)
  if (!finalResult) {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonBody),
      });

      if (response.ok) {
        finalResult = await response.json();
      } else {
        console.error("Falha ao salvar no backend local do Express");
      }
    } catch (error) {
      console.error("Erro de conexão com o backend local do Express:", error);
    }
  } else {
    // If Firestore worked, send a silent post to local api in background during development
    fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonBody),
    }).catch(() => {});
  }

  // 3. Clear integration with user proposed Supabase if configured!
  if (supabaseUrl && supabaseAnonKey) {
    try {
      console.log("Supabase detectado! Enviando dados para o Supabase...");
      fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads`, {
        method: "POST",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(jsonBody),
      }).catch(err => console.error("Erro em background no Supabase:", err));
    } catch (e) {
      console.error("Erro de conexão com o Supabase:", e);
    }
  }

  // Return the lead object with id and timestamp
  if (finalResult) {
    // Update local storage backup
    try {
      const currentLeadsStr = localStorage.getItem("static_leads") || "[]";
      const currentLeads: DBLead[] = JSON.parse(currentLeadsStr);
      currentLeads.unshift(finalResult);
      localStorage.setItem("static_leads", JSON.stringify(currentLeads.slice(0, 500)));
    } catch (err) {
      console.error("Erro ao salvar backup local:", err);
    }
    return finalResult;
  }

  // Private pure Client fallback if both server and Firebase are offline/not set
  const fallbackResult: DBLead = {
    ...lead,
    id: `lead_temp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "Novo"
  };

  try {
    const currentLeadsStr = localStorage.getItem("static_leads") || "[]";
    const currentLeads: DBLead[] = JSON.parse(currentLeadsStr);
    currentLeads.unshift(fallbackResult);
    localStorage.setItem("static_leads", JSON.stringify(currentLeads.slice(0, 500)));
  } catch (err) {
    console.error("Erro ao salvar backup local:", err);
  }

  return fallbackResult;
}

export async function fetchLeads(password: string): Promise<DBLead[]> {
  const storedPassword = await getStoredAdminPassword();
  if (password !== storedPassword) {
    throw new Error("Senha administrativa incorreta.");
  }

  if (firebaseProjectId) {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/leads?pageSize=100${firebaseApiKey ? `&key=${firebaseApiKey}` : ""}`;
      const response = await fetch(dbUrl);
      if (response.ok) {
        const data = await response.json();
        const docs = data.documents || [];
        // Sort leads by createdAt descending on client side
        const mapped = docs.map(mapFirestoreDoc);
        return mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (response.status === 404) {
        // If the leads collection is empty or doesn't exist yet, Firestore REST API returns 404.
        // We should return an empty array gracefully instead of failing authentication.
        return [];
      } else {
        console.error("Erro ao buscar dados do Firebase Firestore. Tentando fallback local...");
        throw new Error("Não foi possível carregar os leads do Firestore.");
      }
    } catch (e: any) {
      console.error("Falha ao comunicar com Firebase Firestore:", e);
      throw e;
    }
  }

  // Fallback to Express backend leads list
  try {
    const response = await fetch("/api/leads", {
      method: "GET",
      headers: {
        "Authorization": password,
      },
    });

    if (response.ok) {
      return response.json();
    }
  } catch (err) {
    console.error("Erro no fallback do Express para leads:", err);
  }

  // LocalStorage fallback for pure offline static client
  const localItems = localStorage.getItem("static_leads");
  if (localItems) {
    return JSON.parse(localItems);
  }
  return [];
}

export async function updateLeadStatus(id: string, status: string, password: string): Promise<DBLead> {
  const storedPassword = await getStoredAdminPassword();
  if (password !== storedPassword) {
    throw new Error("Senha administrativa incorreta.");
  }

  if (firebaseProjectId) {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/leads/${id}?updateMask.fieldPaths=status${firebaseApiKey ? `&key=${firebaseApiKey}` : ""}`;
      const firestoreBody = {
        fields: {
          status: { stringValue: status }
        }
      };
      const response = await fetch(dbUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(firestoreBody)
      });
      if (!response.ok) {
        throw new Error("Falha ao atualizar no Firebase Firestore.");
      }
      const data = await response.json();
      return mapFirestoreDoc(data);
    } catch (e) {
      console.error("Erro ao atualizar status no Firebase Firestore:", e);
      throw e;
    }
  }

  // Fallback to local server
  try {
    const response = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": password,
      },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      return response.json();
    }
  } catch (err) {
    console.error("Erro no update backend local:", err);
  }

  // Fallback to localStorage if pure client fallback
  const localItems = localStorage.getItem("static_leads");
  if (localItems) {
    const list: DBLead[] = JSON.parse(localItems);
    const index = list.findIndex(l => l.id === id);
    if (index !== -1) {
      list[index].status = status;
      localStorage.setItem("static_leads", JSON.stringify(list));
      return list[index];
    }
  }

  throw new Error("Não foi possível atualizar o status do lead.");
}

export async function deleteLead(id: string, password: string): Promise<boolean> {
  const storedPassword = await getStoredAdminPassword();
  if (password !== storedPassword) {
    throw new Error("Senha administrativa incorreta.");
  }

  if (firebaseProjectId) {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/leads/${id}${firebaseApiKey ? `?key=${firebaseApiKey}` : ""}`;
      const response = await fetch(dbUrl, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Falha ao excluir lead no Firebase Firestore.");
      }
      return true;
    } catch (e) {
      console.error("Erro ao excluir lead do Firebase Firestore:", e);
      throw e;
    }
  }

  // Fallback to Local backend
  try {
    const response = await fetch(`/api/leads/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": password,
      },
    });

    if (response.ok) {
      return true;
    }
  } catch (e) {
    console.error("Erro ao deletar no backend local:", e);
  }

  // Fallback to localStorage
  const localItems = localStorage.getItem("static_leads");
  if (localItems) {
    const list: DBLead[] = JSON.parse(localItems);
    const filtered = list.filter(l => l.id !== id);
    localStorage.setItem("static_leads", JSON.stringify(filtered));
    return true;
  }

  throw new Error("Não foi possível excluir o lead.");
}

export interface NotificationConfig {
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  discordEnabled: boolean;
  discordWebhookUrl: string;
}

export async function fetchNotificationConfig(password: string): Promise<NotificationConfig> {
  const storedPassword = await getStoredAdminPassword();
  if (password !== storedPassword) {
    throw new Error("Senha administrativa incorreta.");
  }

  const defaultConfig: NotificationConfig = {
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
    discordEnabled: false,
    discordWebhookUrl: "",
  };

  if (firebaseProjectId) {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/app_config/notifications${firebaseApiKey ? `?key=${firebaseApiKey}` : ""}`;
      const response = await fetch(dbUrl);
      if (response.ok) {
        const data = await response.json();
        const fields = data.fields || {};
        return {
          telegramEnabled: fields.telegramEnabled?.booleanValue || false,
          telegramBotToken: fields.telegramBotToken?.stringValue || "",
          telegramChatId: fields.telegramChatId?.stringValue || "",
          discordEnabled: fields.discordEnabled?.booleanValue || false,
          discordWebhookUrl: fields.discordWebhookUrl?.stringValue || "",
        };
      } else if (response.status === 404) {
        // Document doesn't exist yet, return default
        return defaultConfig;
      }
    } catch (e) {
      console.error("Erro ao buscar configurações de notificação do Firebase:", e);
    }
  }

  // Fallback to Express backend notifications
  try {
    const response = await fetch("/api/notifications", {
      method: "GET",
      headers: {
        "Authorization": password,
      },
    });

    if (response.ok) {
      return response.json();
    }
  } catch (err) {
    console.error("Erro no fetch notifications da API local:", err);
  }

  // Fallback to localStorage
  const localConfig = localStorage.getItem("static_notifications_config");
  if (localConfig) {
    return JSON.parse(localConfig);
  }

  return defaultConfig;
}

export async function saveNotificationConfig(config: NotificationConfig, password: string): Promise<boolean> {
  const storedPassword = await getStoredAdminPassword();
  if (password !== storedPassword) {
    throw new Error("Senha administrativa incorreta.");
  }

  if (firebaseProjectId) {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/app_config/notifications${firebaseApiKey ? `?key=${firebaseApiKey}` : ""}`;
      const firestoreBody = {
        fields: {
          telegramEnabled: { booleanValue: config.telegramEnabled },
          telegramBotToken: { stringValue: config.telegramBotToken || "" },
          telegramChatId: { stringValue: config.telegramChatId || "" },
          discordEnabled: { booleanValue: config.discordEnabled },
          discordWebhookUrl: { stringValue: config.discordWebhookUrl || "" },
        }
      };

      const response = await fetch(dbUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(firestoreBody)
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar configurações de notificação no Firestore.");
      }
    } catch (e) {
      console.error("Erro ao salvar configurações de notificação do Firebase:", e);
      throw e;
    }
  }

  // Save to local Express storage
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": password,
      },
      body: JSON.stringify(config),
    });

    if (response.ok) {
      return true;
    }
  } catch (err) {
    console.error("Erro ao salvar no backend local:", err);
  }

  // Fallback to localStorage
  localStorage.setItem("static_notifications_config", JSON.stringify(config));
  return true;
}

export async function changeAdminPassword(newPassword: string, password: string): Promise<boolean> {
  const storedPassword = await getStoredAdminPassword();
  if (password !== storedPassword) {
    throw new Error("Senha administrativa incorreta.");
  }

  if (firebaseProjectId) {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/admin_config/password${firebaseApiKey ? `?key=${firebaseApiKey}` : ""}`;
      const firestoreBody = {
        fields: {
          password: { stringValue: newPassword }
        }
      };

      const response = await fetch(dbUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(firestoreBody)
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar a senha administrativa no Firestore.");
      }
      
      // Keep local overriding backup set
      localStorage.setItem("static_admin_password", newPassword);
      return true;
    } catch (e) {
      console.error("Erro ao atualizar a senha administrativa no Firestore:", e);
      throw e;
    }
  }

  // Local backend update fallback
  try {
    const response = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": password,
      },
      body: JSON.stringify({ newPassword }),
    });

    if (response.ok) {
      localStorage.setItem("static_admin_password", newPassword);
      return true;
    }
  } catch (err) {
    console.error("Erro alterando password local:", err);
  }

  // Fallback to localStorage
  localStorage.setItem("static_admin_password", newPassword);
  return true;
}
