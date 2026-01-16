import { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const DiagnosticChat = () => {
  const { backendUrl } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const res = await fetch(`${backendUrl}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, agent: "diagnostic" }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (res.ok && data.success) {
        setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
      } else {
        const errorMsg = data.error || `Server error: ${res.statusText}`;
        toast.error(errorMsg);
        setMessages(prev => [...prev, { role: "assistant", text: `Error: ${errorMsg}` }]);
      }
    } catch (err) {
      console.error("Error fetching AI response:", err);

      let errorMsg = "Network error. Please check backend server.";
      if (err.name === "AbortError") errorMsg = "AI agent timed out. Try again later.";
      else if (err.message) errorMsg = err.message;

      toast.error(errorMsg);
      setMessages(prev => [...prev, { role: "assistant", text: `Error: ${errorMsg}` }]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex justify-center px-6 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-semibold">Diagnostic AI Agent</h2>
          <p className="text-sm opacity-90">Answers only diagnostic and report-related questions</p>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${
                msg.role === "user" ? "bg-indigo-500 text-white ml-auto" : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm w-fit">Thinking...</div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-3">
          <input
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none"
            placeholder="Ask a diagnostic question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-indigo-500 text-white px-6 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
};

export default DiagnosticChat;
