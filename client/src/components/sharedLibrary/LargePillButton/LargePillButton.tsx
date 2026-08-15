import React from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type LargePillButtonTextColor = "accent" | "white";

export interface LargePillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Text color variant — "accent" is the bright blue used for Ask AI, "white" for use on darker/solid backgrounds elsewhere. */
  textColor?: LargePillButtonTextColor;
}

const TEXT_COLOR_CLASS: Record<LargePillButtonTextColor, string> = {
  accent: "text-ask-ai-text",
  white: "text-white",
};

const LargePillButton: React.FC<LargePillButtonProps> = ({
  children,
  className = "",
  type = "button",
  textColor = "accent",
  ...props
}) => (
  <button
    type={type}
    className={`bg-accent-blue-15 border border-accent-blue-40 ${TEXT_COLOR_CLASS[textColor]} px-6 py-2.5 rounded-full font-semibold cursor-pointer transition-all duration-200 shadow-[0_0_8px_var(--accent-blue-40)] hover:bg-accent-blue-25 hover:-translate-y-px hover:border-accent-blue [[data-theme=light]_&]:hover:bg-border-color [[data-theme=light]_&]:hover:text-white ${className}`.trim()}
    {...props}
  >
    {children}
  </button>
);

export default LargePillButton;
