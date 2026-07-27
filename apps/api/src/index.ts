import { config } from "./utils/config.js";
import { createApp } from "./app.js";
import { logger } from "./logger.js";

// Punto de entrada: arranca el servidor HTTP.
createApp().listen(config.port, () => {
  logger.info(`[bukit-api] escuchando en http://localhost:${config.port}`);
});
