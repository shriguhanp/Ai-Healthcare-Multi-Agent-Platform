import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const ChatAgent = () => {
  const { agentType } = diagnostic(); // "diagnostic" or "masc"
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");

  const sendMessage = async () => {
    if (!userInput) return;

    try {
      const res = await fetch(`http://localhost:8000/agent/${agentType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userInput })
      });
      const data = await res.json();
      setMessages([...messages, { from: "user", text: userInput }, { from: "bot", text: data.answer }]);
      setUserInput("");
    } catch (error) {
      console.error(error);
      alert("Error connecting to backend. Make sure FastAPI is running.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-start p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {agentType === "diagnostic" ? "Diagnostic AI Agent" : "MASC Agent"}
      </h1>

      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 mb-6 h-[60vh] overflow-y-auto flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-3 rounded-lg ${msg.from === "user" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-800"}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-3xl flex gap-2">
        <input
          className="flex-1 p-3 rounded-lg border border-gray-300"
          type="text"
          value={userInput}
          placeholder="Ask your question..."
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-500 text-white px-6 rounded-lg font-medium hover:bg-indigo-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatAgent;
