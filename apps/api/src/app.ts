import express from "express";
import cors from "cors";

// La app Express, sin arrancar el servidor. Se exporta aparte del listen para
// poder testearla con Supertest sin abrir un puerto (igual que en TrackBites).
export const app = express();

app.use(cors());
app.use(express.json());

// Comprobación de vida del servicio.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
