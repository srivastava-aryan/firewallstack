import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DataAPIClient } from "@datastax/astra-db-ts";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors({
  origin: "https://delightful-hill-0f440ed00.3.azurestaticapps.net",
  methods: ["GET", "POST"],
}));
app.use(express.json());

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(
  `https://${process.env.ASTRA_DB_ID}-${process.env.ASTRA_DB_REGION}.apps.astra.datastax.com`
);

app.get("/api/data", async (req, res) => {
  try {
    // Get the cursor
    const cursor = db.collection("service_requests").find();

    // Convert cursor to array
    const docs = await cursor.toArray();

    // Send JSON array to frontend
    res.json(docs);
  } catch (err) {
    console.error("Error fetching data from Astra DB:", err);
    res.status(500).json({ error: "Failed to fetch data from Astra DB" });
  }
});

app.post("/api/push-firewall", async (req, res) => {
  try {
    const { metadata } = req.body; // Row data sent from frontend
    console.log("Incoming body from frontend:", req.body);

    const refinedMetadata = metadata;
    console.log("Pushing to firewall via LangFlow:", refinedMetadata);

    // LangFlow endpoint
    const LANGFLOW_URL = process.env.LANGFLOW_URL;
    const API_KEY = process.env.LANGFLOW_API_KEY;

    if (!LANGFLOW_URL || !API_KEY) {
      return res
        .status(400)
        .json({ error: "LangFlow URL or API Key not configured" });
    }

    // Prepare payload as per LangFlow API format
    const payload = {
      input_type: "chat",
      output_type: "text",
      tweaks: {
        // ✅ Send data to ChatInput node (this node passes it to the Firewall API Generator)
        "ChatInput-Gksmq": {
          input_value: JSON.stringify({
            metadata_json: refinedMetadata,
            push_to_firewall: true,
          }),
        },
      },
      session_id: crypto.randomUUID(),
    };
    console.log("Payload to LangFlow:", payload);

    // Send POST request to LangFlow
    const response = await axios.post(LANGFLOW_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });

    console.log("LangFlow Response:", response.data);

    res.json({
      success: true,
      message: "Policy pushed successfully to firewall",
      response: response.data,
    });
  } catch (error) {
    console.error("Error pushing to firewall:", error);
    res.status(500).json({
      success: false,
      error: "Failed to push data to firewall",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
