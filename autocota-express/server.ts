import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const LEADS_FILE = path.join(process.cwd(), "leads.json");
  const CONFIG_FILE = path.join(process.cwd(), "notification_settings.json");

  interface NotificationConfig {
    telegramEnabled: boolean;
    telegramBotToken: string;
    telegramChatId: string;
    discordEnabled: boolean;
    discordWebhookUrl: string;
  }

  // Helper to read notification config
  const readConfig = (): NotificationConfig => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const fileContent = fs.readFileSync(CONFIG_FILE, "utf-8");
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error("Erro ao ler notification_settings.json:", e);
    }
    return {
      telegramEnabled: false,
      telegramBotToken: "",
      telegramChatId: "",
      discordEnabled: false,
      discordWebhookUrl: "",
    };
  };

  // Helper to write notification config
  const writeConfig = (config: NotificationConfig) => {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    } catch (e) {
      console.error("Erro ao gravar notification_settings.json:", e);
    }
  };

  // Webhook integration helpers using native fetch
  const sendTelegramNotification = async (config: NotificationConfig, lead: any) => {
    const token = config.telegramBotToken.trim();
    const chatId = config.telegramChatId.trim();
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const text = `<b>🚗 NOVO LEAD RECEBIDO - AUTOCOTA EXPRESS</b>\n\n` +
      `👤 <b>Nome:</b> ${lead.nomeCompleto}\n` +
      `💬 <b>WhatsApp:</b> ${lead.whatsapp}\n` +
      `📍 <b>Cidade/UF:</b> ${lead.cidadeUf}\n\n` +
      `🚘 <b>Veículo:</b> ${lead.modeloVeiculo} (${lead.anoVeiculo})\n` +
      `🛡️ <b>Possui Seguro:</b> ${lead.possuiSeguro}\n` +
      `💼 <b>Usa para Trabalho:</b> ${lead.usaParaTrabalho}\n` +
      `⏰ <b>Melhor Horário:</b> ${lead.melhorHorario}\n\n` +
      `📝 <b>Obs:</b> ${lead.observacoes || "Nenhuma"}\n\n` +
      `<i>Recebido em: ${new Date(lead.createdAt).toLocaleString("pt-BR")}</i>`;

    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram error: ${errorText}`);
    }
  };

  const sendDiscordNotification = async (config: NotificationConfig, lead: any) => {
    const url = config.discordWebhookUrl.trim();

    const payload = {
      username: "AutoCota Express",
      avatar_url: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/car.png",
      embeds: [
        {
          title: "🚗 Novo Lead Recebido!",
          description: "Mais uma cotação simulada pelo site AutoCota Express.",
          color: 45749, // teal
          fields: [
            { name: "Nome Completo", value: lead.nomeCompleto, inline: true },
            { name: "WhatsApp", value: lead.whatsapp, inline: true },
            { name: "Cidade/UF", value: lead.cidadeUf, inline: true },
            { name: "Veículo", value: `${lead.modeloVeiculo} (${lead.anoVeiculo})`, inline: true },
            { name: "Possui Seguro?", value: lead.possuiSeguro, inline: true },
            { name: "Trabalho?", value: lead.usaParaTrabalho, inline: true },
            { name: "Horário para Contato", value: lead.melhorHorario, inline: true },
            { name: "Observações", value: lead.observacoes || "Nenhuma", inline: false }
          ],
          footer: {
            text: `AutoCota Express • ${new Date(lead.createdAt).toLocaleString("pt-BR")}`
          }
        }
      ]
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord error: ${errorText}`);
    }
  };

  // Middlewares
  app.use(express.json());

  // Helper to read leads
  const readLeads = () => {
    try {
      if (fs.existsSync(LEADS_FILE)) {
        const fileContent = fs.readFileSync(LEADS_FILE, "utf-8");
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error("Erro ao ler leads.json:", e);
    }
    return [];
  };

  // Helper to write leads
  const writeLeads = (leads: any[]) => {
    try {
      fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
    } catch (e) {
      console.error("Erro ao gravar leads.json:", e);
    }
  };

  // API Routes
  app.get("/api/leads", (req, res) => {
    const password = req.headers.authorization;
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password !== expectedPassword) {
      return res.status(401).json({ error: "Senha inválida ou ausente no cabeçalho Authorization" });
    }

    const leads = readLeads();
    res.json(leads);
  });

  app.post("/api/leads", (req, res) => {
    const newLead = req.body;
    if (!newLead || !newLead.nomeCompleto || !newLead.whatsapp) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const leads = readLeads();
    const leadWithId = {
      ...newLead,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      status: "Novo" // Status possíveis: Novo, Em Contato, Concluído
    };
    leads.push(leadWithId);
    writeLeads(leads);

    // Dispatch webhook notifications asynchronously if configured
    try {
      const config = readConfig();
      if (config.telegramEnabled && config.telegramBotToken && config.telegramChatId) {
        sendTelegramNotification(config, leadWithId).catch(err => {
          console.error("[Telegram Trigger Error] Falha ao despachar:", err);
        });
      }
      if (config.discordEnabled && config.discordWebhookUrl) {
        sendDiscordNotification(config, leadWithId).catch(err => {
          console.error("[Discord Trigger Error] Falha ao despachar:", err);
        });
      }
    } catch (err) {
      console.error("[Notification Trigger Error] Falha geral ao despachar:", err);
    }

    res.status(201).json(leadWithId);
  });

  app.patch("/api/leads/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const password = req.headers.authorization;
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password !== expectedPassword) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const leads = readLeads();
    const leadIndex = leads.findIndex((l: any) => l.id === id);

    if (leadIndex === -1) {
      return res.status(404).json({ error: "Lead não encontrado" });
    }

    leads[leadIndex].status = status;
    writeLeads(leads);

    res.json(leads[leadIndex]);
  });

  app.delete("/api/leads/:id", (req, res) => {
    const { id } = req.params;
    const password = req.headers.authorization;
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password !== expectedPassword) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    let leads = readLeads();
    const originalLength = leads.length;
    leads = leads.filter((l: any) => l.id !== id);

    if (leads.length === originalLength) {
      return res.status(404).json({ error: "Lead não encontrado" });
    }

    writeLeads(leads);
    res.json({ success: true });
  });

  // Notifications Config GET API
  app.get("/api/notifications", (req, res) => {
    const password = req.headers.authorization;
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password !== expectedPassword) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const config = readConfig();
    res.json(config);
  });

  // Notifications Config POST API
  app.post("/api/notifications", (req, res) => {
    const password = req.headers.authorization;
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password !== expectedPassword) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const newConfig = req.body;
    if (!newConfig) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    writeConfig(newConfig);
    res.json({ success: true, config: newConfig });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const publicPath = path.join(process.cwd(), "public");
    app.use(express.static(distPath));
    app.use(express.static(publicPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Generate PWA icons on server startup if SVG is present
  try {
    const svgPath = path.join(process.cwd(), "public", "app_icon.svg");
    if (fs.existsSync(svgPath)) {
      console.log("[PWA] Gerando ícones PNG de alta fidelidade...");
      const sharpModule = await import("sharp");
      const sharp = sharpModule.default;
      
      const directories = [
        path.join(process.cwd(), "public"),
        path.join(process.cwd(), "dist")
      ];
      
      for (const dir of directories) {
        if (fs.existsSync(dir)) {
          await sharp(svgPath).resize(192, 192).png().toFile(path.join(dir, "app_icon_192.png"));
          await sharp(svgPath).resize(512, 512).png().toFile(path.join(dir, "app_icon_512.png"));
          await sharp(svgPath).resize(180, 180).png().toFile(path.join(dir, "apple-touch-icon.png"));
          await sharp(svgPath).resize(512, 512).png().toFile(path.join(dir, "app_icon.png"));
          console.log(`[PWA] Ícones PNG gerados com sucesso para: ${dir}`);
        }
      }
    }
  } catch (err) {
    console.error("[PWA Error] Falha ao gerar ícones PNG:", err);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in env ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
