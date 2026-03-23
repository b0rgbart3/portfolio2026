import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Circle,
  X,
  Zap,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import styles from "./FitCheck.module.scss";

const strong = [
  "UI design & development",
  "User experience",
  "AI tooling & integration",
  "Component architectural design",
  "Engineering mentorship",
  "Design & branding",
  "Code reviews",
  "Freelance breadth & client delivery",
  "Solo contributor",
  "CI/CD Pipelines and Cloud hosting",
];

const moderate = [
  "Cross-functional leadership",
  "Agentic workflow architectural design",
  "Data engineering",
  "Mobile development",
  "Production deployments",
];

const gaps = [
  "Product analytics & user research",
  "Database design & maintenance",
  "Performance optimization",
  "Security & compliance",
  "Open source contributions & community presence",
];

const BAD_FIT_JD = `If you want an exciting job with one of the largest off-price retail stores in the nation, join the Burlington Stores, Inc. as a Stocking Associate! Are you looking for a hands-on role in a fast-paced environment? Do you have great organizational skills and work well as part of a team? Would you thrive in a process-driven environment? If you answered yes, then this may be the role for you!

Stocking Associates are critical to making sure our stores remain stocked with the merchandise our customers want! Daily tasks include receiving, ticketing, sorting, and moving merchandise into and throughout the store quickly, efficiently, and accurately. You'll play a major role in successfully managing the flow of merchandise from the stockroom through our stores, which is a critical element in driving positive results for the company.

Responsibilities:

Receive freight and convey shipments from the shipping/receiving platform to backroom
Process, ticket, store, move, and display merchandise
Stock, organize and present new merchandise on the sales floor
Perform other tasks as assigned by manager from time-to-time

Candidates must be able to work a flexible schedule; including nights, weekends, and holidays as required.

If you...

 are excited to deliver great values to customers every day;
 take a sense of pride and ownership in helping drive positive results for a team;
 are committed to treating colleagues and customers with respect;
 believe in the power of diversity and inclusion;
 want to participate in initiatives that positively impact the world around you;

Come join our team. You're going to like it here!

You will enjoy a competitive wage, flexible hours, and an associate discount. Part-time associates, based on hours worked, may be eligible for Burlington's benefits package which includes medical coverage and a 401(k) plan. Part-time associates may also be eligible for up to 4 hours of paid time off annually after one year of service, up to 8 paid holidays, and paid sick time in accordance with applicable law. We are a rapidly growing brand, and provide a variety of training and development opportunities so our associates can grow with us.

Our store teams work hard and have fun together! Burlington associates make a difference in the lives of customers, colleagues, and the communities where we live and work every day. Burlington Stores, Inc. is an equal opportunity employer committed to workplace diversity.`;

const GOOD_FIT_JD = `At Cube, we're redefining how organizations deliver, consume, and automate data and analytics across teams, tools, and AI agents. Our mission is to enable Agentic Analytics — where AI agents work alongside humans on a shared semantic foundation. If you're fascinated by building core data and AI infrastructure — the kind that powers analytics at the world's most advanced technology companies — but want the agility and ownership of a startup, Cube is where you'll thrive.

With 19,000+ GitHub stars and 13,000+ community members, Cube is trusted by companies like SecurityScorecard, Webflow, The Linux Foundation, Cloud Academy, and SamCart. Our platform empowers AI agents with a universal semantic foundation — enabling autonomous analytics at scale while maintaining the same consistency, security, and performance across BI tools, spreadsheets, and embedded applications.

As a Full-Stack Engineer at Cube, you will work across the frontend and backend of Cube Cloud platform and developer-facing tools. Your goal will be to deliver high-quality product features that make complex analytics infrastructure intuitive, powerful, and accessible to developers and data teams.

You will collaborate closely with product, design, and core engineering teams to turn complex technical capabilities into simple, well-designed user experiences.

What you will do:
Building and evolving the Cube Cloud platform web application and developer-facing interfaces.
Designing and implementing backend APIs that power configuration, management, and analytics workflows.
Translating complex analytics concepts into clear and usable UI/UX.
Improving performance, reliability, and scalability of end-user features.
Working with large datasets and real-time analytics results in frontend applications.
Collaborating with Core engineers to integrate new Cube capabilities into the product.

Who you are:
Strong experience with JavaScript/TypeScript and modern frontend frameworks (React).
Solid backend experience with Node.js or similar server-side runtimes.
Experience designing and consuming REST or GraphQL APIs.
Understanding of web application performance, security, and scalability.
Ability to work across the stack and take ownership of features end to end.
Good communication skills and product-oriented mindset.
Fluent English.

Bonus points:
Experience working with data-heavy or analytics-driven products.
Familiarity with SQL and analytical databases.
Experience with cloud platforms (AWS, GCP) and containerized environments.
Background in UX/UI design collaboration or design systems.
Contributions to open-source projects, especially developer tools.`;

type AssessStatus = "idle" | "loading" | "done" | "error";

interface AssessResult {
  fit_percentage: number;
  good_fit: string[];
  mismatches: string[];
  recommendation: string;
}

const CIRCUMFERENCE = 2 * Math.PI * 35; // r=35 → ~219.9

function scoreLabel(pct: number): string {
  if (pct >= 85) return "Excellent Match";
  if (pct >= 70) return "Strong Match";
  if (pct >= 55) return "Partial Match";
  return "Significant Gaps";
}

function scoreColor(pct: number): string {
  if (pct >= 80) return "#4ade80";
  if (pct >= 60) return "#38bdf8";
  return "#c9a227";
}

const FitCheck: React.FC = () => {
  const [jdText, setJdText] = useState("");
  const [status, setStatus] = useState<AssessStatus>("idle");
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState<AssessResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const runAssessment = async (text: string) => {
    if (!text.trim() || text.trim().length < 50) return;

    setStatus("loading");
    setStatusText("Connecting...");
    setResult(null);
    setErrorMsg("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: text }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const dataLine = part.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          const jsonStr = dataLine.slice("data: ".length).trim();
          if (!jsonStr) continue;

          let event: { type: string; text?: string; data?: AssessResult };
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (event.type === "status") {
            setStatusText(event.text ?? "");
          } else if (event.type === "result" && event.data) {
            setResult(event.data);
          } else if (event.type === "done") {
            setStatus("done");
            reader.cancel();
            return;
          } else if (event.type === "error") {
            throw new Error(event.text ?? "Assessment failed");
          }
        }
      }

      setStatus("done");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong — please try again.",
      );
      setStatus("error");
    }
  };

  const handlePreset = (text: string) => {
    setJdText(text);
    runAssessment(text);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setStatus("idle");
    setResult(null);
    setJdText("");
    setStatusText("");
    setErrorMsg("");
  };

  const dashOffset = result
    ? CIRCUMFERENCE - (result.fit_percentage / 100) * CIRCUMFERENCE
    : CIRCUMFERENCE;

  return (
    <section className={styles.fitCheck} id="fit-check">
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Honest Fit Assessment</h2>
          <p>
            Where I'm strong, where I'm competent, and where I'm still growing
            (I'll tell you upfront)
          </p>
        </motion.div>

        <div className={styles.grid}>
          {/* STRONG */}
          <motion.div
            className={`${styles.card} ${styles.cardStrong}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className={`${styles.cardLabel} ${styles.labelStrong}`}>
              Strong
            </div>
            <ul>
              {strong.map((item) => (
                <li key={item}>
                  <Check size={14} className={styles.iconStrong} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* MODERATE */}
          <motion.div
            className={`${styles.card} ${styles.cardModerate}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={`${styles.cardLabel} ${styles.labelModerate}`}>
              Moderate
            </div>
            <ul>
              {moderate.map((item) => (
                <li key={item}>
                  <Circle size={14} className={styles.iconModerate} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* GAPS */}
          <motion.div
            className={`${styles.card} ${styles.cardGaps}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className={`${styles.cardLabel} ${styles.labelGaps}`}>
              Growing Edges
            </div>
            <ul>
              {gaps.map((item) => (
                <li key={item}>
                  <X size={14} className={styles.iconGaps} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* ── AI ASSESSOR ─────────────────────────────────── */}
        <motion.div
          className={styles.assessorSection}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={styles.assessorHeader}>
            <Zap size={21} className={styles.assessorIcon} />
            <span>AI Fit Check</span>
          </div>

          <p className={styles.assessorSubtitle}>
            Paste a job description. Get an honest assessment of whether I'm the
            right person— including when I'm not.
          </p>

          <AnimatePresence mode="wait">
            {status !== "done" ? (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.presetRow}>
                  <button
                    className={`${styles.presetBtn} ${styles.presetGood}`}
                    onClick={() => handlePreset(GOOD_FIT_JD)}
                    disabled={status === "loading"}
                  >
                    <Check size={12} />
                    Good Fit Example
                  </button>
                  <button
                    className={`${styles.presetBtn} ${styles.presetBad}`}
                    onClick={() => handlePreset(BAD_FIT_JD)}
                    disabled={status === "loading"}
                  >
                    <X size={12} />
                    Bad Fit Example
                  </button>
                </div>

                <textarea
                  className={styles.jdInput}
                  placeholder="Paste job description here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  disabled={status === "loading"}
                  rows={5}
                />

                {status === "loading" && (
                  <div className={styles.loadingRow}>
                    <Loader2 size={15} className={styles.spinner} />
                    <span>{statusText}</span>
                  </div>
                )}

                {status === "error" && (
                  <div className={styles.errorMsg}>{errorMsg}</div>
                )}

                <div className={styles.assessorActions}>
                  <button
                    className={styles.assessBtn}
                    onClick={() => runAssessment(jdText)}
                    disabled={status === "loading" || jdText.trim().length < 50}
                  >
                    {status === "loading" ? "Assessing..." : "Run Fit Check"}
                  </button>
                  {status === "error" && (
                    <button className={styles.resetBtn} onClick={handleReset}>
                      Clear
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {result && (
                  <>
                    {/* Score ring */}
                    <div
                      className={`${styles.scoreRow} ${result.fit_percentage > 60 ? styles.scoreRowGood : styles.scoreRowBad}`}
                    >
                      <div
                        className={`${styles.thumbsCircle} ${result.fit_percentage > 60 ? styles.thumbsCircleGood : styles.thumbsCircleBad}`}
                      >
                        {result.fit_percentage > 60 ? (
                          <ThumbsUp size={28} className={styles.thumbsGood} />
                        ) : (
                          <ThumbsDown size={28} className={styles.thumbsBad} />
                        )}
                      </div>
                      <div className={styles.scoreRing}>
                        <svg viewBox="0 0 80 80" fill="none">
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="6"
                          />
                          <motion.circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke={scoreColor(result.fit_percentage)}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={CIRCUMFERENCE}
                            initial={{ strokeDashoffset: CIRCUMFERENCE }}
                            animate={{ strokeDashoffset: dashOffset }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={styles.scoreRingCircle}
                          />
                        </svg>
                        <div className={styles.scoreNumber}>
                          <span>{result.fit_percentage}</span>
                          <span className={styles.scorePct}>%</span>
                        </div>
                      </div>

                      <div className={styles.scoreLabel}>
                        <strong>{scoreLabel(result.fit_percentage)}</strong>
                        <span>based on CV & project documentation</span>
                      </div>
                    </div>

                    {/* Good fit */}
                    {result.good_fit.length > 0 && (
                      <div
                        className={`${styles.resultCard} ${styles.resultGood}`}
                      >
                        <div className={styles.resultCardLabel}>
                          Strong Matches
                        </div>
                        <ul>
                          {result.good_fit.map((item, i) => (
                            <li key={i}>
                              <Check size={13} className={styles.iconStrong} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mismatches */}
                    {result.mismatches.length > 0 && (
                      <div
                        className={`${styles.resultCard} ${styles.resultGap}`}
                      >
                        <div className={styles.resultCardLabel}>
                          Gaps / Questions
                        </div>
                        <ul>
                          {result.mismatches.map((item, i) => (
                            <li key={i}>
                              <X size={13} className={styles.iconGaps} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {result?.recommendation && (
                  <div className={styles.recommendationBox}>
                    <div className={styles.recommendationLabel}>
                      Recommendation
                    </div>
                    <p>{result.recommendation}</p>
                  </div>
                )}

                <button className={styles.resetBtn} onClick={handleReset}>
                  Check Another Role
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default FitCheck;
