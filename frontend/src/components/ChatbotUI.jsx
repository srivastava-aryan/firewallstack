import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

export default function ChatbotUI() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi there 👋 How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Send message to LangFlow backend
      const res = await fetch("http://localhost:7860/api/v1/run/96a67384-95d2-4f7e-8d95-d53abb0976ce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_value: input,
        }),
      });

      // If the response is not OK, read body for diagnostics and show error
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Could not parse JSON
        console.error("LangFlow response not JSON", { status: res.status, statusText: res.statusText });
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `⚠️ LangFlow returned invalid JSON (status ${res.status})` },
        ]);
        return;
      }

      // Log the full response to browser console for debugging
      console.debug("LangFlow response:", data);

      // Try multiple common paths used by LangFlow / HF UI to find output text
      const botReply =
        // common simple field
        data?.output_text ||
        data?.output ||
        data?.result ||
        // some flows wrap outputs
        data?.outputs?.[0]?.text ||
        data?.outputs?.[0]?.data?.text ||
        // original shape you used (kept for backward compat)
        data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
        // try message/result paths
        data?.message ||
        // lastly, if response contains nested strings, try to find first string value
        (function findFirstString(obj) {
          if (!obj || typeof obj !== "object") return undefined;
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (typeof v === "string" && v.trim()) return v;
            if (typeof v === "object") {
              const found = findFirstString(v);
              if (found) return found;
            }
          }
        })(data) || null;

      if (!botReply) {
        // Nothing matched — show helpful debug text in the chat (and keep console.debug)
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "I'm not sure about that. (no parsable text in LangFlow response — check console)",
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: botReply }] );
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-[400px] border border-gray-300 rounded-2xl shadow-md bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 text-center font-semibold">
        FireBot🔥- Your Firewall Assistant
      </div>

      {/* Messages Area */}
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

      {/* Input Area */}
      <div className="flex items-center p-2 border-t bg-gray-50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="ml-2 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
