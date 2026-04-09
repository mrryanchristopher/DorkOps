import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  app.get("/api/check-env", (req, res) => {
    res.json({
      hasKey: !!process.env.GEMINI_API_KEY,
      keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
      keyStart: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 4) : "N/A"
    });
  });

  // API Route: Verify Google Play Purchase (Mock)
  app.post("/api/verify-purchase", async (req, res) => {
    try {
      const { purchaseToken, productId } = req.body;
      if (!purchaseToken || !productId) {
        return res.status(400).json({ error: "purchaseToken and productId are required" });
      }

      // Mock verification logic for Google Play Developer API
      // In a real app, you would call the Google Play Developer API here
      // using googleapis package and a service account.
      console.log(`Verifying purchase for product: ${productId} with token: ${purchaseToken}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json({
        success: true,
        message: "Purchase verified successfully",
        subscriptionState: "ACTIVE",
        expiryTimeMillis: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days from now
      });
    } catch (error) {
      console.error("Error verifying purchase:", error);
      res.status(500).json({ error: "Failed to verify purchase" });
    }
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
