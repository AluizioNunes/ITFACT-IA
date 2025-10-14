const express = require("express");
const app = express();
app.use(express.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});
app.post("/api/discovery/cross-platform", async (req, res) => {
  const { targets = [] } = req.body;
  const results = { discoveredDevices: [] };
  for (const target of targets) {
    results.discoveredDevices.push({
      ip: target,
      status: "Online",
      services: [{ port: 80, service: "HTTP" }]
    });
  }
  res.json(results);
});
app.listen(3001, () => console.log("Server running on port 3001")); 
