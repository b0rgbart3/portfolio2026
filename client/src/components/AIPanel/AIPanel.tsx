import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import styles from "./AIPanel.module.scss";
import profilePic from "../../assets/bart_dority_profile4.png";
import profilePicLight from "../../assets/bart_dority_profile_light5.jpg";
import { useTheme } from "../../utils/useTheme";
import { playButtonClick, playComputerThink } from "../../utils/sounds";

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
/*
const newSuggestions = [
  Top 10 recruiter questions for your portfolio chatbot
What kind of roles is Bart looking for?
This immediately frames you around AI-native UI, Design Engineer, Product Engineer, and product-focused front-end roles.
Why is Bart a strong fit for a Design Engineer role?
This sells your design + engineering overlap: React, TypeScript, visual craft, interaction design, Figma-to-code, component thinking, and production UI.
What makes Bart different from a typical front-end engineer?
This highlights your graphic design, animation, typography, branding, product taste, and AI-native workflow advantage.
What are Bart’s strongest technical skills?
This gives recruiters the fast keyword match: React, TypeScript, JavaScript, Node.js, REST APIs, Material UI, Sass, MobX, AI tools, RAG/agents, and responsive UI.
How has Bart used AI in software development?
This supports your AI-native positioning with practical credibility: prototyping, debugging, implementation, research, code refinement, agentic workflows, and product exploration.
What kind of products or teams would Bart thrive on?
This helps recruiters pattern-match you to AI tools, creative SaaS, design technology, developer tools, data-rich interfaces, and product-led teams with strong design culture.
What portfolio projects best show Bart’s current direction?
This guides them toward the most relevant proof instead of making them browse randomly.
What experience does Bart have with complex or data-rich interfaces?
This connects your Grid Dynamics experience, enterprise fintech UI work, dashboards, structured data, API-driven interfaces, and usability with real professional experience.
Is Bart more front-end, full-stack, or design-focused?
This resolves a likely recruiter question cleanly: primarily UI/front-end/product experience, with full-stack capability in service of user-facing software.
Why should we interview Bart?
This should be the chatbot’s strongest answer: concise, confident, and recruiter-friendly.
]
*/

// const suggestions2 = [
//   "What kind of roles is Bart looking for?",
//   "Why is Bart a strong fit for a Design Engineer role?",
//   "What makes Bart different from a typical front-end engineer?",
//   "What are Bart's strongest technical skills?",
//   "How has Bart used AI in software development?",
//   "What kind of products or teams would Bart thrive on?",
//   "What portfolio projects best show Bart's current direction?",
//   "What experience does Bart have with complex or data-rich interfaces?",
//   "Is Bart more front-end, full-stack, or design-focused?",
//   "Why should we interview Bart?",
// ];

const suggestions = [
  "Describe a project that Bart is particularly proud of — what were the challenges, solutions, and tradeoffs?",
  "How does Bart handle mobile app development?",
  "Share a time Bart and a designer or PM disagreed — what happened and what was the outcome?",
  "Would Bart be a good for a Series B startup with messy data infrastructure?",
  "Tell me about a time Bart experienced a failure.",
  "What kind of leadership experience does Bart have?",
  "How does Bart approach UI/UX design and development?",
];

const renderWithLineBreaks = (text: string) => {
  // Normalize numbered list items (e.g. "1. Foo") into bullets so they render consistently
  const normalized = text.replace(/^\d+\.\s+/gm, "- ");
  const lines = normalized.split("\n").filter((l) => l.trim());
  const firstBulletIdx = lines.findIndex((l) => /^[-•*]\s/.test(l));

  if (firstBulletIdx !== -1) {
    const introLines = lines.slice(0, firstBulletIdx);
    const bulletLines = lines
      .slice(firstBulletIdx)
      .filter((l) => /^[-•*]\s/.test(l))
      .slice(0, 4);
    return (
      <>
        {introLines.map((line, i) => (
          <React.Fragment key={`intro-${i}`}>
            {line}
            <br />
          </React.Fragment>
        ))}
        <ul
          style={{
            margin: introLines.length > 0 ? "6px 0 0" : 0,
            paddingLeft: "1.2em",
            lineHeight: 1.6,
          }}
        >
          {bulletLines.map((line, i) => (
            <li
              key={i}
              style={{ marginBottom: i < bulletLines.length - 1 ? "6px" : 0 }}
            >
              {line.replace(/^[-•*]\s*/, "")}
            </li>
          ))}
        </ul>
      </>
    );
  }

  const sentences = text.split(/(?<=\.)\s+(?=[A-Z])/).slice(0, 3);
  return sentences.map((sentence, i) => (
    <React.Fragment key={i}>
      {sentence}
      {i < sentences.length - 1 && (
        <>
          <br />
          <br />
        </>
      )}
    </React.Fragment>
  ));
};

const AIPanel: React.FC<AIPanelProps> = ({
  isOpen,
  onClose,
  openToBuildInfo = false,
}) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [statusText, setStatusText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showBuildInfo, setShowBuildInfo] = useState(false);
  const [shuffledSuggestions, setShuffledSuggestions] = useState<string[]>([]);
  const [followupSuggestion, setFollowupSuggestion] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInputValue("");
      setIsTyping(false);
      setStatusText("");
      setIsStreaming(false);
      setShowBuildInfo(openToBuildInfo);
      setFollowupSuggestion(null);
      setShuffledSuggestions([...suggestions].sort(() => Math.random() - 0.5));
    } else {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    }
  }, [isOpen, openToBuildInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const assistantCount = messages.filter(
    (m) => m.sender === "assistant",
  ).length;
  const showAskAnother = assistantCount >= 3 && !isTyping;

  const handleReset = () => {
    setMessages([]);
    setInputValue("");
    setFollowupSuggestion(null);
    setShuffledSuggestions([...suggestions].sort(() => Math.random() - 0.5));
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setFollowupSuggestion(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setStatusText("Connecting...");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const assistantId = (Date.now() + 1).toString();
    streamingIdRef.current = assistantId;
    let firstTokenReceived = false;

    try {
      const history = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await fetch("/api/ask/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const finalize = () => {
        reader.cancel();
      };
      const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on double-newline (SSE event delimiter); keep incomplete tail in buffer
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const dataLine = part
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const jsonStr = dataLine.slice("data: ".length).trim();
          if (!jsonStr) continue;

          let event: { type: string; text?: string };
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (event.type === "status") {
            setStatusText(event.text ?? "");
          } else if (event.type === "followup") {
            setFollowupSuggestion(event.text ?? null);
          } else if (event.type === "token") {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              setIsStreaming(true);
              setMessages((prev) => [
                ...prev,
                {
                  id: assistantId,
                  text: event.text ?? "",
                  sender: "assistant",
                  timestamp: new Date(),
                },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, text: m.text + (event.text ?? "") }
                    : m,
                ),
              );
            }
            await wait(25);
          } else if (event.type === "done") {
            finalize();
            streamingIdRef.current = null;
            setIsTyping(false);
            setIsStreaming(false);
            setStatusText("");
            return;
          } else if (event.type === "error") {
            throw new Error(event.text ?? "Stream error");
          }
        }
      }

      // Stream ended without a done event
      streamingIdRef.current = null;
      setIsTyping(false);
      setIsStreaming(false);
      setStatusText("");
    } catch (err) {
      streamingIdRef.current = null;
      if (err instanceof Error && err.name === "AbortError") {
        setIsTyping(false);
        setIsStreaming(false);
        setStatusText("");
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "There was an error",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
      setIsStreaming(false);
      setStatusText("");
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
                <img
                  src={theme === "light" ? profilePicLight : profilePic}
                  alt="Bart Dority"
                  className={styles.avatar}
                />
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
                    <h2>How I built these AI systems:</h2>
                    <div className={styles["build-section"]}>
                      <h3>Overview</h3>
                      <p>
                        This chatbot is a custom Retrieval-Augmented Generation
                        (RAG) system that I built. It includes a custom built,
                        local agentic pipeline, and pre-processing system. It
                        can answer nuanced questions about my experience,
                        skills, and background by retrieving relevant context
                        from a curated knowledge base before generating a
                        response. In other words, I trained the agent.
                      </p>
                    </div>
                    <div className={styles["build-section"]}>
                      <h3>Vector Database — LanceDB</h3>
                      <p>
                        As a pre-process, my resume, project write-ups, and
                        other source documents are tokenized, chunked, embedded,
                        and stored in a LanceDB vector database using an
                        embedding specific model. Then, at query time, the most
                        semantically relevant chunks are retrieved using a
                        cosine similarity search.
                      </p>
                    </div>
                    <div className={styles["build-section"]}>
                      <h3>Agentic Pipeline</h3>
                      <p>
                        A Python based LangGraph agent orchestrates the
                        retrieval and generation steps. It decides which
                        documents to include based on relevance, formats the
                        context window, and then calls a cloud based LLM model
                        with a detailed system prompt which directs the LLM to
                        only answer questions based on the factual documents
                        that were provided. This way it can provide tailored
                        answers which represent me accurately and honestly,
                        while still using the natural language skills of the
                        LLM. This greatly reduces the chances of hallucinations.
                        Note however that because LLMs are probabilistic by
                        nature, answers may vary even if you ask the same
                        question over again.
                      </p>
                    </div>
                    <div className={styles["build-section"]}>
                      <h3>FitCheck Assessment Pipeline</h3>
                      <p>
                        The FitCheck tool uses a second LangGraph agent
                        pipeline. It works in three steps: first, it extracts
                        key technical signals from the job description using an
                        LLM — things like required languages, frameworks,
                        experience level, and domain. Second, those signals are
                        embedded and used to search the same LanceDB knowledge
                        base, retrieving the most relevant passages from my CV
                        and project write-ups. Third, a second LLM call compares
                        the retrieved context against the job requirements and
                        returns a structured assessment — a fit percentage,
                        specific strengths, gaps, and a short recommendation.
                        The goal is honest calibration: a high score means a
                        strong match across most criteria, not flattery.
                      </p>
                    </div>
                    <div className={styles["build-section"]}>
                      <h3>Tech Stack</h3>
                      <p>
                        Python · LangGraph · FastAPI · LanceDB · Claude Code ·
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
                          onClick={() => {
                            playComputerThink();
                            handleSend(suggestion);
                          }}
                        >
                          {suggestion}
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
                        <div
                          className={`${styles.bubble}${isTyping && isStreaming && msg.id === streamingIdRef.current ? ` ${styles.streaming}` : ""}`}
                        >
                          {msg.sender === "assistant"
                            ? renderWithLineBreaks(msg.text)
                            : msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && !isStreaming && (
                      <div
                        className={`${styles["message-wrapper"]} ${styles.assistant}`}
                      >
                        <div className={`${styles.bubble} ${styles.typing}`}>
                          <Loader2 size={16} className={styles.spinner} />
                          {statusText || "Thinking..."}
                        </div>
                      </div>
                    )}
                    {followupSuggestion &&
                      assistantCount === 1 &&
                      !isTyping && (
                        <motion.div
                          className={styles["followup-hint"]}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <span className={styles["followup-label"]}>
                            You might also want to ask:
                          </span>
                          <button
                            className={styles["followup-btn"]}
                            onClick={() => {
                              playComputerThink();
                              handleSend(followupSuggestion);
                            }}
                          >
                            {followupSuggestion}
                          </button>
                        </motion.div>
                      )}
                    <div ref={messagesEndRef} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={styles.footer}>
              {/* Input — always rendered, visually hidden when not applicable */}
              <form
                className={`${styles["input-wrapper"]} ${showBuildInfo || showAskAnother ? styles["input-hidden"] : ""}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  playComputerThink();
                  handleSend(inputValue);
                }}
              >
                <input
                  type="text"
                  placeholder={
                    messages.length === 0
                      ? "Ask a custom question about Bart's experience"
                      : "Ask a follow-up question..."
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isTyping || showBuildInfo || showAskAnother}
                />
                <button
                  type="submit"
                  className={styles["send-btn"]}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send size={18} />
                </button>
              </form>
              {/* Button row — always rendered */}
              <div className={styles["button-row"]}>
                <button
                  className={styles["build-info-btn"]}
                  disabled={isTyping}
                  onClick={() => {
                    playButtonClick();
                    setShowBuildInfo((prev) => !prev);
                    setMessages([]);
                  }}
                >
                  {showBuildInfo ? "← Back to chat" : "How was this AI built?"}
                </button>
                {!showBuildInfo && !isTyping && messages.length > 0 && (
                  <button
                    className={styles["ask-another-btn"]}
                    onClick={() => {
                      playButtonClick();
                      handleReset();
                    }}
                  >
                    Ask another question
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIPanel;
