import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import styles from "./AIPanel.module.scss";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  openToBuildInfo?: boolean;
}

const suggestions = [
  "Describe a UI Bart built — problem, tech, tradeoffs.",
  "How does Bart make UIs fast, accessible, and cross-device?",
  "Share a time Bart and a designer or PM disagreed — what happened and outcome?",
  "Would this person be good for a Series B startup with messy data infrastructure?",
  "Tell me about their biggest failure.",
  "What kind of leadership experience do they have?",
  "How do they approach UI/UX design and development?",
];

const AIPanel: React.FC<AIPanelProps> = ({
  isOpen,
  onClose,
  openToBuildInfo = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showBuildInfo, setShowBuildInfo] = useState(false);
  const [shuffledSuggestions, setShuffledSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInputValue("");
      setIsTyping(false);
      setShowBuildInfo(openToBuildInfo);
      setShuffledSuggestions([...suggestions].sort(() => Math.random() - 0.5));
    }
  }, [isOpen, openToBuildInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate API Response
    // setTimeout(() => {
    //   const assistantMessage: Message = {
    //     id: (Date.now() + 1).toString(),
    //     text: `Based on Bart's profile, "${text}" is a great question. Bart specializes in building complex, data-intensive UI features and has extensive experience with React, TypeScript, and modern front-end ecosystems. He's known for being both technically rigorous and design-conscious.`,
    //     sender: 'assistant',
    //     timestamp: new Date()
    //   };
    //   setMessages(prev => [...prev, assistantMessage]);
    //   setIsTyping(false);
    // }, 1500);

    try {
      const history = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await response.json();
      console.log("BD: DATA: ", data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          typeof data === "string"
            ? data
            : (data.text ?? data.response ?? JSON.stringify(data)),
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    } catch {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "There was an error",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <div className={styles["user-info"]}>
                <div className={styles.avatar}>B</div>
                <div className={styles.status}>
                  <h3>Ask AI About Bart</h3>
                  <div className={styles.indicator}>
                    <span className={styles.dot}></span>
                    Ready to answer your questions
                  </div>
                </div>
              </div>
              <button
                className={styles["close-btn"]}
                onClick={onClose}
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.content}>
              <AnimatePresence mode="wait">
                {showBuildInfo ? (
                  <motion.div
                    key="build-info"
                    className={styles["build-info"]}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2>How I built this AI agentic chat-bot:</h2>
                    <div className={styles["build-section"]}>
                      <h3>Overview</h3>
                      <p>
                        This chatbot is a custom Retrieval-Augmented Generation
                        (RAG) system that I built. It includes a custom built,
                        local agentic pipeline, and pre-processing system. It
                        can answer nuanced questions about my experience,
                        skills, and background by retrieving relevant context
                        from a curated knowledge base before generating a
                        response.
                      </p>
                    </div>
                    <div className={styles["build-section"]}>
                      <h3>Vector Database — LanceDB</h3>
                      <p>
                        As a pre-process, my resume, project write-ups, and
                        other source documents are tokenized, chunked, embedded,
                        and stored in a LanceDB vector database using an
                        embedding specific model. Then, at query time, the most
                        semantically relevant chunks are retrieved using cosine
                        similarity search.
                      </p>
                    </div>
                    <div className={styles["build-section"]}>
                      <h3>Agentic Pipeline</h3>
                      <p>
                        A Python based LangGraph agent orchestrates the
                        retrieval and generation steps. It decides which
                        documents to include, formats the context window, and
                        then calls a cloud based LLM model with a detailed
                        system prompt which directs the LLM to only answer
                        questions based on the factual documents that were
                        provided. This way it can provide tailored answers which
                        represent me accurately and honestly, while still using
                        the natural language skills of the LLM. This greatly
                        reduces the chances of hallucinations.
                      </p>
                    </div>
                    <div className={styles["build-section"]}>
                      <h3>Stack</h3>
                      <p>
                        FastAPI · LanceDB · Python · LangGraph · Claude Code ·
                        React + TypeScript frontend. Documents are ingested via
                        a custom preprocessing python pipeline that handles
                        chunking and embedding generation.
                      </p>
                    </div>
                  </motion.div>
                ) : messages.length === 0 ? (
                  <motion.div
                    key="welcome"
                    className={styles.welcome}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Sparkles size={48} className={styles["sparkle-icon"]} />
                    <h2>What would you like to know?</h2>
                    <p>
                      Ask specific questions about Bart's experience, skills, or
                      fit for your role. Get honest, detailed answers.
                    </p>

                    <div className={styles.suggestions}>
                      {shuffledSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className={styles["suggestion-item"]}
                          onClick={() => handleSend(suggestion)}
                        >
                          "{suggestion}"
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    className={styles["chat-history"]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`${styles["message-wrapper"]} ${styles[msg.sender]}`}
                      >
                        <div className={styles.bubble}>{msg.text}</div>
                      </div>
                    ))}
                    {isTyping && (
                      <div
                        className={`${styles["message-wrapper"]} ${styles.assistant}`}
                      >
                        <div className={`${styles.bubble} ${styles.typing}`}>
                          <Loader2 size={16} className={styles.spinner} />
                          Thinking...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={styles.footer}>
              {!showBuildInfo && (
                <form
                  className={styles["input-wrapper"]}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(inputValue);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ask a follow-up question..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <button
                    type="submit"
                    className={styles["send-btn"]}
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <Send size={18} />
                  </button>
                </form>
              )}
              <button
                className={styles["build-info-btn"]}
                onClick={() => {
                  setShowBuildInfo((prev) => !prev);
                  setMessages([]);
                }}
              >
                {showBuildInfo
                  ? "← Back to chat"
                  : "How was this AI agent built?"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIPanel;
