import "./ChatBot.css";
import React, { useState } from "react";
import { generateResponseBot1 } from "services/ollama/ollama-api-bot-one";
import { generateResponseBot2 } from "services/ollama/ollama-api-bot-two";
import { Message } from "types/message";

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextBot1, setContextBot1] = useState("act as a customer that wants to buy something, you have $100");
  const [contextBot2, setContextBot2] = useState("act as a seller that has two product, a smartwatch for $80 and a pen for $10");
  const [isConversationActive, setIsConversationActive] = useState(false);

  // Initialize conversation histories for each bot
  const bot1Messages: Message[] = [{ role: "system", content: contextBot1 }];
  const bot2Messages: Message[] = [{ role: "system", content: contextBot2 }];


  // Function to add messages to the UI but exclude "system" messages
  const addMessageToUI = (content: string, role: "user" | "assistant") => {
    setMessages((prevMessages) => [...prevMessages, { role, content }]);
  };

  // Reset conversation
  const resetConversation = () => {
    setMessages([]);
    setIsConversationActive(false);
  };

  // Download conversation as a text file
  const downloadConversation = () => {
    const conversationText = messages
      .map((msg) => `${msg.role === "user" ? "Bot 1" : "Bot 2"}: ${msg.content}`)
      .join("\n");
    const blob = new Blob([conversationText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "conversation.txt";
    link.click();
  };

  // Handle Bot 1's response
  const handleBot1Response = async () => {
    try {
      if (!isConversationActive) return;

      // Add initial greeting message if it's the first interaction
      bot1Messages.push({ role: "user", content: "Hi" });

      // Generate response for Bot 1
      const response = await generateResponseBot1(bot1Messages);
      addMessageToUI(response, "user"); // Display Bot 1's response in UI

      // Save response in histories: as "assistant" in bot1Messages, as "user" in bot2Messages
      bot1Messages.push({ role: "assistant", content: response });
      bot2Messages.push({ role: "user", content: response });

      // Wait 3 seconds, then handle Bot 2's response
      setTimeout(() => handleBot2Response(), 3000);
    } catch (error) {
      console.error("Error with Bot 1:", error);
    }
  };

  // Handle Bot 2's response
  const handleBot2Response = async () => {
    try {
      if (!isConversationActive) return;

      // Generate response for Bot 2 based on Bot 1's latest response
      const response = await generateResponseBot2(bot2Messages);
      addMessageToUI(response, "assistant"); // Display Bot 2's response in UI

      // Save response in histories: as "assistant" in bot2Messages, as "user" in bot1Messages
      bot2Messages.push({ role: "assistant", content: response });
      bot1Messages.push({ role: "user", content: response });

      // Wait 3 seconds, then handle Bot 1's response again
      setTimeout(() => handleBot1Response(), 3000);
    } catch (error) {
      console.error("Error with Bot 2:", error);
    }
  };

  const startConversation = () => {
    setIsConversationActive(true);
    handleBot1Response();
  };

  return (
    <div>
      <h1>Multibot Chat</h1>
      <div className="header-container">
        <div className="header-item">
          <label>Bot 1 context</label>
          <textarea
            value={contextBot1}
            onChange={(e) => setContextBot1(e.target.value)}
            placeholder="Bot 1 context (e.g., Act as a customer)"
            rows={4}
          />
        </div>
        <div className="header-item">
          <label>Bot 2 context</label>
          <textarea
            value={contextBot2}
            onChange={(e) => setContextBot2(e.target.value)}
            placeholder="Bot 2 context (e.g., Act as a seller)"
            rows={4}
          />
        </div>
      </div>
      <div className="button-container">
        <button onClick={startConversation}>Start Conversation</button>
        <button onClick={resetConversation}>Reset Conversation</button>
        <button onClick={downloadConversation}>Download Conversation</button>
      </div>
      <div className="chat-window">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === "user" ? "Bot 1" : "Bot 2"}:</strong> {message.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatBot;