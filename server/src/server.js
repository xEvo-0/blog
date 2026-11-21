import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;

try {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`Inkwell API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error("Could not start the API:", error);
  process.exitCode = 1;
}
