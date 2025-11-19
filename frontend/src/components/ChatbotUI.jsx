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

        const res = await fetch(
          "https://firebott-app-eubrcqh0b5dta3ax.centralindia-01.azurewebsites.net/api/push-firewall",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(policyToPush), // ✅ send clean payload
          }
        );

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
        const payload = {
          input_type: "chat",
          output_type: "chat",
          tweaks: {
            "ChatInput-5zeqz": {
              input_value: input,
            },
          },
          session_id: crypto.randomUUID(),
        };

        const res = await fetch(
          "http://localhost:7860/api/v1/run/d3aaa35b-7529-40ee-87f1-f38ff18bc66f",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await res.json();

        const botReply =
          data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
          data?.outputs?.[0]?.text ||
          data?.output_text ||
          data?.result ||
          data?.message ||
          "🤖 I'm not sure about that.";

        setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
        return;
      }

      // 🧠 FEATURE 3: Normal LangFlow conversation
      const payload = {
        input_type: "chat",
        output_type: "chat",
        tweaks: {
          "ChatInput-coCFf": {
            input_value: input,
          },
        },
        session_id: crypto.randomUUID(),
      };

      const res = await fetch(
        "http://localhost:7860/api/v1/run/96a67384-95d2-4f7e-8d95-d53abb0976ce",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      const botReply =
        data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
        data?.outputs?.[0]?.text ||
        data?.output_text ||
        data?.result ||
        data?.message ||
        "🤖 I'm not sure about that.";

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
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
    <div className="fixed bottom-8 left-8 z-50">
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
