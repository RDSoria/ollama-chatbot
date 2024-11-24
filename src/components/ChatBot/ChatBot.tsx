import "./ChatBot.css";
import React, { useEffect, useRef, useState } from "react";
import { generateResponseBot1 } from "services/ollama/ollama-api-bot-one";
import { generateResponseBot2 } from "services/ollama/ollama-api-bot-two";
import { Message } from "types/message";

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextBot1, setContextBot1] = useState("");
  const [contextBot2, setContextBot2] = useState("");
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const bot1TimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bot2TimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);
  
  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Initialize conversation histories for each bot
  const bot1Messages: Message[] = [{ role: "system", content: contextBot1 }];
  const bot2Messages: Message[] = [{ role: "system", content: contextBot2 }];

  const addMessageToUI = (content: string, role: "user" | "assistant") => {
    const newMessage = { role, content };

    // Add the new message with a temporary "zoom-in" class
    setMessages((prevMessages) => [
      ...prevMessages,
      { ...newMessage, animation: true }, // Add a temporary flag for animation
    ]);

    // Remove the animation class after 1 second
    setTimeout(() => {
      setMessages((prevMessages) =>
        prevMessages.map((msg, index) =>
          index === prevMessages.length - 1
            ? { ...msg, animation: false }
            : msg
        )
      );
    }, 1000);
  };

  // Reset conversation
  const resetConversation = () => {
    setMessages([]);

    // Clear any pending timeouts
    if (bot1TimeoutRef.current) {
      clearTimeout(bot1TimeoutRef.current);
      bot1TimeoutRef.current = null;
    }
    if (bot2TimeoutRef.current) {
      clearTimeout(bot2TimeoutRef.current);
      bot2TimeoutRef.current = null;
    }
    isCancelledRef.current = true;
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
      // Add initial greeting message if it's the first interaction
      if(bot1Messages.length === 1)
        bot1Messages.push({ role: "user", content: "start" });
      if (isCancelledRef.current) return;
      // Generate response for Bot 1
      const response = await generateResponseBot1(bot1Messages);
      
      addMessageToUI(response, "user"); // Display Bot 1's response in UI

      // Save response in histories: as "assistant" in bot1Messages, as "user" in bot2Messages
      bot1Messages.push({ role: "assistant", content: response });
      bot2Messages.push({ role: "user", content: response });

      // Wait 3 seconds, then handle Bot 2's response
      bot2TimeoutRef.current = setTimeout(() => handleBot2Response(), 3000);
    } catch (error) {
      console.error("Error with Bot 1:", error);
    }
  };

  // Handle Bot 2's response
  const handleBot2Response = async () => {
    try {
      if (isCancelledRef.current) return;
      // Generate response for Bot 2 based on Bot 1's latest response
      const response = await generateResponseBot2(bot2Messages);
      
      addMessageToUI(response, "assistant"); // Display Bot 2's response in UI

      // Save response in histories: as "assistant" in bot2Messages, as "user" in bot1Messages
      bot2Messages.push({ role: "assistant", content: response });
      bot1Messages.push({ role: "user", content: response });

      // Wait 3 seconds, then handle Bot 1's response again
      bot1TimeoutRef.current = setTimeout(() => handleBot1Response(), 3000);
    } catch (error) {
      console.error("Error with Bot 2:", error);
    }
  };

  const startConversation = () => {
    isCancelledRef.current = false;
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
      <div className="chat-window"  ref={chatWindowRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role} ${
              message.animation ? "zoom-in" : ""
            }`}
          >
            <strong>
              {message.role === "user" ? "Bot 1" : "Bot 2"}:
            </strong>{" "}
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatBot;