import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const LEADS_FILE = path.join(process.cwd(), "leads.json");

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

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT} in env ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
