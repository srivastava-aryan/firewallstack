import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DataAPIClient } from "@datastax/astra-db-ts";
import axios from "axios";
import crypto from "crypto";
import fs from"fs";
import https from "https";


dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "https://delightful-hill-0f440ed00.3.azurestaticapps.net",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());
const agent = new https.Agent({
  ca: fs.readFileSync("./certs/selfsigned_nginx.crt")
});


const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(
  `https://${process.env.ASTRA_DB_ID}-${process.env.ASTRA_DB_REGION}.apps.astra.datastax.com`
);

app.get("/api/data", async (req, res) => {
  try {
    // Get the cursor
    const cursor = db.collection("servicenow").find();

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
    const data = req.body; // Row data sent from frontend
    console.log("Incoming body from frontend:", req.body);

    const refinedData = {
      u_change_id: data.u_change_id,
      u_service_port: data.u_service_port,
      u_source_address: data.u_source_address,
      u_application: data.u_application,
      u_destination_address: data.u_destination_address,
      u_action: data.u_action,
      u_requestor: data.u_requestor,
    };
    console.log("Pushing to firewall via LangFlow:", refinedData);

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
        "ChatInput-CyBhP": {
          input_value: JSON.stringify({
            metadata_json: refinedData,
            push_to_firewall: true,
          }),
        },
      },
      session_id: crypto.randomUUID(),
    };
    console.log("Payload to LangFlow:", payload);

    // Send POST request to LangFlow
    const response = await axios.post(LANGFLOW_URL, payload, {
      httpsAgent: agent,
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



app.get("/api/policy/:policyId", async (req, res) => {
  try {
    const { policyId } = req.params;

    // Fetch all rows
    const cursor = db.collection("servicenow").find();
    const docs = await cursor.toArray();

    // 🔹 Filter unique entries by u_change_id (keep latest)
    const uniqueData = [];
    const seen = new Map();

    docs.forEach((item) => {
      const changeId = item.u_change_id;
      
      if (!seen.has(changeId)) {
        seen.set(changeId, item);
        uniqueData.push(item);
      } else {
        const existingIndex = uniqueData.findIndex(
          (i) => i.u_change_id === changeId
        );
        uniqueData[existingIndex] = item;
        seen.set(changeId, item);
      }
    });

    // 🔹 Add policyId
    const dataWithPolicyId = uniqueData.map((item, index) => ({
      policyId: `${index + 1}`,
      ...item,  // Spread the data at root level
    }));

    // Find by the assigned policyId
    const policy = dataWithPolicyId.find(
      (p) => String(p.policyId) === String(policyId)
    );

    if (!policy) {
      return res.status(404).json({
        error: "Policy not found",
        policyId,
      });
    }
    
    res.json(policy);
  } catch (err) {
    console.error("Error fetching policy from Astra DB:", err);
    res.status(500).json({ error: "Failed to fetch policy from Astra DB" });
  }
});

app.post("/api/health-summary", async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    const payload = {
      input_type: "chat",
      output_type: "chat",
      tweaks: {
        "ChatInput-oRAUV": {
          input_value: input,
        },
      },
      session_id: crypto.randomUUID(),
    };

    const HEALTH_LANGFLOW_URL = "https://57.159.30.42:8443/api/v1/run/61f62131-47b9-41f8-bbfc-bea788b30374";
    const API_KEY = process.env.LANGFLOW_API_KEY;

    if (!API_KEY) {
      return res.status(400).json({ error: "LangFlow API Key not configured" });
    }

    const response = await axios.post(HEALTH_LANGFLOW_URL, payload, {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });

    console.log("Health summary response:", response.data);

    const botReply =
      response.data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
      response.data?.outputs?.[0]?.text ||
      response.data?.output_text ||
      response.data?.result ||
      response.data?.message ||
      "🤖 I'm not sure about that.";

    res.json({
      success: true,
      message: botReply,
    });
  } catch (error) {
    console.error("Error fetching health summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch health summary",
      details: error.message,
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    const payload = {
      input_type: "chat",
      output_type: "chat",
      tweaks: {
        "ChatInput-fKpIo": {
          input_value: input,
        },
      },
      session_id: crypto.randomUUID(),
    };

    const CHAT_LANGFLOW_URL = "https://57.159.30.42:8443/api/v1/run/36d3864c-5d59-40be-be01-a42dd39e1ec1";
    const API_KEY = process.env.LANGFLOW_API_KEY;

    if (!API_KEY) {
      return res.status(400).json({ error: "LangFlow API Key not configured" });
    }
    const response = await axios.post(CHAT_LANGFLOW_URL, payload, {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });

    console.log("Chat response:", response.data);

    const botReply =
      response.data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
      response.data?.outputs?.[0]?.text ||
      response.data?.output_text ||
      response.data?.result ||
      response.data?.message ||
      "🤖 I'm not sure about that.";

    res.json({
      success: true,
      message: botReply,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chat",
      details: error.message,
    });
  }
});

app.post("/api/sync-servicenow", async (req, res) => {
  try {
    console.log("Starting ServiceNow sync...");

    // ServiceNow Configuration
    const SERVICENOW_URL = process.env.SERVICENOW_URL;
    const SERVICENOW_TOKEN = process.env.SERVICENOW_TOKEN;

    if (!SERVICENOW_URL || !SERVICENOW_TOKEN) {
      return res.status(400).json({ 
        error: "ServiceNow credentials not configured" 
      });
    }

    // Fetch data from ServiceNow with Basic Auth token
    const serviceNowResponse = await axios.get(SERVICENOW_URL, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${SERVICENOW_TOKEN}`,
      },
    });

    console.log("ServiceNow data fetched:", serviceNowResponse.data);

    // Extract the records from ServiceNow response
    const records = serviceNowResponse.data.result || [];

    if (records.length === 0) {
      return res.json({
        success: true,
        message: "No records to sync",
        count: 0,
      });
    }

    // 🔹 Filter required fields only
    const filteredRecords = records.map((record) => ({
      u_change_id: record.u_change_id || "",
      u_service_port: record.u_service_port || "",
      u_source_address: record.u_source_address || "",
      u_application: record.u_application || "",
      u_destination_address: record.u_destination_address || "",
      u_action: record.u_action || "",
      u_requestor: record.u_requestor || "",
    }));

    // 🔹 Remove duplicates - keep only unique u_change_id (latest entry)
    const uniqueRecordsMap = new Map();
    filteredRecords.forEach((record) => {
      if (record.u_change_id) {
        uniqueRecordsMap.set(record.u_change_id, record);
      }
    });

    const uniqueRecords = Array.from(uniqueRecordsMap.values());

    console.log(`Filtered ${uniqueRecords.length} unique records from ${records.length} total`);

    // 🔹 Get existing u_change_ids from Astra DB to avoid duplicates
    const collection = db.collection(process.env.ASTRA_DB_SECOND_COLLECTION);
    const existingDocs = await collection.find({}).toArray();
    const existingChangeIds = new Set(existingDocs.map(doc => doc.u_change_id));

    // 🔹 Filter out records that already exist in DB
    const newRecords = uniqueRecords.filter(
      record => !existingChangeIds.has(record.u_change_id)
    );

    if (newRecords.length === 0) {
      return res.json({
        success: true,
        message: "All records already exist in database",
        count: 0,
        totalFetched: records.length,
        uniqueRecords: uniqueRecords.length,
      });
    }

    // 🔹 Add synced_at timestamp
    const recordsToInsert = newRecords.map(record => ({
      ...record,
      synced_at: new Date().toISOString(),
    }));

    // 🔹 Insert only new unique documents
    const insertResult = await collection.insertMany(recordsToInsert);

    console.log("Data synced to Astra DB:", insertResult);

    res.json({
      success: true,
      message: "ServiceNow data synced successfully",
      totalFetched: records.length,
      uniqueRecords: uniqueRecords.length,
      newRecordsInserted: newRecords.length,
      insertedIds: insertResult.insertedIds,
    });

  } catch (error) {
    console.error("Error syncing ServiceNow data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync ServiceNow data",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
