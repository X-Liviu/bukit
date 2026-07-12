import { config } from "./utils/config.js";
import { app } from "./app.js";

// Punto de entrada: arranca el servidor HTTP.
app.listen(config.port, () => {
  console.log(`[bukit-api] escuchando en http://localhost:${config.port}`);
});
