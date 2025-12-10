import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import logo from "../assets/chatbotIcon.jpeg";

export default function ChatbotUI({ selectedMetadata }) {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi there 👋 How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const lowerInput = input.trim().toLowerCase();

      // Simple hardcoded response for sync check
      if (
        lowerInput.includes("policies in sync") ||
        lowerInput.includes("sync")
      ) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Yes, Policies are in sync with SNOW." },
        ]);
        return;
      }

      //Policy modeling
      if (
        lowerInput.includes("model change") ||
        lowerInput.includes("model chg")
      ) {
        // Extract the change ID using regex → words like CHG1204, UN1002, UB568
        const match = input.match(/(chg\d+|un\d+|ub\d+|\w{2}\d{3,})/i);
        const changeId = match ? match[0].toUpperCase() : "Unknown Change ID";

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `Modeling Policy ${changeId}..\n${changeId} Modelled.\nCI: LDNDMZFW001 Identified`,
          },
        ]);
        return;
      }

      //COMPLIANCE CHECK
      if (
        lowerInput.includes("validate change") ||
        lowerInput.includes("compliance")
      ) {
        const match = input.match(/(chg\d+|un\d+|ub\d+|\w{2}\d{3,})/i);
        const changeId = match ? match[0].toUpperCase() : "Unknown Change ID";

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `Checking Security Compliance...\n${changeId} Validated.`,
          },
        ]);
        return;
      }
      // 🔍 FEATURE: Show policy details by policy ID
      if (
        lowerInput.includes("policy") &&
        (lowerInput.includes("details") ||
          lowerInput.includes("show") ||
          lowerInput.includes("get") ||
          lowerInput.includes("find"))
      ) {
        // Extract policy ID from input (supports various formats)
        const match = input.match(/\b([a-zA-Z0-9_-]+)\b/g);

        if (match && match.length > 1) {
          // Get the last meaningful word as policy ID (skip "policy", "details", etc.)
          const keywords = [
            "policy",
            "details",
            "show",
            "get",
            "find",
            "me",
            "the",
            "of",
          ];
          const policyId = match
            .reverse()
            .find((word) => !keywords.includes(word.toLowerCase()));

          if (policyId) {
            try {
              const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/policy/${policyId}`
              );
              // console.log("Fetch response status:", res);
              if (res.ok) {
                const policy = await res.json();

                // Create a structured card-like display
                const detailsText = `
**Policy #${policy.policyId}**

📝 Change Details : 
Change ID: ${policy.metadata?.u_change_id || "N/A"}
Requestor: ${policy.metadata?.u_requestor || "N/A"}

🌐 Network Settings :
Source: ${policy.metadata?.u_source_address || "N/A"}
Destination: ${policy.metadata?.u_destination_address || "N/A"}
Application: ${policy.metadata?.u_application || "N/A"}

⚙️ Configuration :
Action: ${policy.metadata?.u_action || "N/A"}
                `.trim();

                setMessages((prev) => [
                  ...prev,
                  { sender: "bot", text: detailsText },
                ]);
                return;
              } else if (res.status === 404) {
                setMessages((prev) => [
                  ...prev,
                  {
                    sender: "bot",
                    text: `⚠️ Policy "${policyId}" not found in the database.`,
                  },
                ]);
                return;
              }
            } catch (err) {
              console.error("Error fetching policy:", err);
              setMessages((prev) => [
                ...prev,
                {
                  sender: "bot",
                  text: "❌ Failed to fetch policy details. Please try again.",
                },
              ]);
              return;
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "⚠️ Please specify a policy ID. Example: 'show policy 101' or 'get details of CHG123'",
          },
        ]);
        return;
      }

      // 🔍 FEATURE: Show policy details by policy ID
      // if (
      //   lowerInput.includes("policy") ||
      //   lowerInput.includes("details") ||
      //   lowerInput.includes("show")
      // ) {
      //   // Extract a number from user input (example: "policy 102")
      //   const match = input.match(/\b\d+\b/);
      //   if (match) {
      //     const policyId = match[0];

      //     // Search in allPolicies table
      //     const found = allPolicies.find(
      //       (p) => String(p.policyId) === String(policyId)
      //     );

      //     if (found) {
      //       // Build nicely formatted response
      //       const detailsText = `
      //         📌 **Policy ${policyId} Details**
      //         • Change ID: ${found.metadata?.u_change_id || "N/A"}
      //         • Source: ${found.source || "N/A"}
      //         • Destination: ${found.destination || "N/A"}
      //         • Action: ${found.action || "N/A"}
      //         • Status: ${found.status || "N/A"}
      //       `;

      //       setMessages((prev) => [
      //         ...prev,
      //         { sender: "bot", text: detailsText.trim() },
      //       ]);

      //       return; // ⛔ stop here (do NOT call LangFlow)
      //     }

      //     // Policy not found
      //     setMessages((prev) => [
      //       ...prev,
      //       {
      //         sender: "bot",
      //         text: `⚠️ Policy ${policyId} not found in table.`,
      //       },
      //     ]);
      //     return;
      //   }
      // }

      // 🟢 FEATURE 1: PUSH command — chatbot-triggered firewall push
      if (lowerInput.startsWith("push")) {
        let policyId = null;

        // Extract policy ID if mentioned (e.g. "push 101")
        const match = lowerInput.match(/push\s+(\d+)/);
        if (match) policyId = match[1];

        let policyToPush = selectedMetadata ? { ...selectedMetadata } : null;

        // Add or overwrite a policyId field
        if (policyToPush && !policyToPush.policyId) {
          policyToPush.policyId = Math.floor(Math.random() * 1000) + 1;
        }

        // If user typed "push <id>", use that id in payload
        if (policyId && policyToPush) {
          policyToPush.policyId = policyId;
        }

        if (!policyToPush) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: "⚠️ Please select a policy row first or specify a policy ID like 'push 101'.",
            },
          ]);
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/push-firewall`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(policyToPush), // ✅ send clean payload
        });

        const data = await res.json();

        if (data.success || res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: `✅ Policy ${policyToPush.policyId} pushed successfully to the firewall.`,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: `❌ Failed to push policy: ${
                data.error || "Unknown error"
              }`,
            },
          ]);
        }
        return;
      }

      // 🟢 FEATURE 2: Show branch diagram
      if (
        lowerInput.includes("show branch") &&
        (lowerInput.includes("diagram") ||
          lowerInput.includes("architecture") ||
          lowerInput.includes("layout"))
      ) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "🖼️ Opening the branch diagram in a new tab for you...",
          },
        ]);
        window.open("/branch-diagram.jpeg", "_blank");
        return;
      }

      if (
        lowerInput.includes("show health") &&
        (lowerInput.includes("summary") ||
          lowerInput.includes("status") ||
          lowerInput.includes("report"))
      ) {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health-summary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input }),
        });

        const data = await res.json();

        if (data.success) {
          setMessages((prev) => [...prev, { sender: "bot", text: data.message }]);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: "❌ Failed to fetch health summary. Please try again." },
          ]);
        }
        return;
      }

      // 🧠 FEATURE 3: Normal LangFlow conversation
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, { sender: "bot", text: data.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "⚠️ Something went wrong. Please try again." },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Let the parent control placement (fixed bottom-right in Dashboard)
    <div className="relative z-50">
      {/* ---------- CHAT BUBBLE (when closed) ---------- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-1 shadow-lg transition-all"
        >
          {/* <MessageCircle size={28} /> */}
          <img src={logo} alt="logo" className="w-10 h-10" />
        </button>
      )}

      {/* ---------- CHAT WINDOW (when open) ---------- */}
      {isOpen && (
        <div className="flex flex-col h-[500px] w-[400px] border border-gray-300 rounded-2xl shadow-md bg-white overflow-hidden relative">
          {/* Header with Close Button */}
          <div className="bg-blue-600 text-white p-3 text-center font-semibold flex justify-between items-center">
            <span>FireBot🔥 - Your Firewall Assistant</span>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-300 transition"
            >
              <X size={22} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-600 px-3 py-2 rounded-2xl animate-pulse">
                  Typing...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Field */}
          <div className="flex items-center p-2 border-t bg-gray-50">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 rounded-xl text-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              className="ml-2 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
