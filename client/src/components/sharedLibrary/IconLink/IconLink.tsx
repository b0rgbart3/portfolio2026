import React from "react";

// Accepts any icon component (local SVG components, lucide-react, etc.)
// that takes a `size` prop, which is all IconLink relies on.
type IconComponent = React.ComponentType<{ size?: string | number }>;

export type IconLinkVariant = "minimal" | "button";

export interface IconLinkProps {
  href: string;
  icon: IconComponent;
  label: string;
  external?: boolean;
  /** "minimal" is a plain colored glyph (e.g. Navbar); "button" is a bordered, filled box (e.g. Footer). */
  variant?: IconLinkVariant;
  iconSize?: string | number;
  className?: string;
}

const DEFAULT_LAYOUT_CLASS = "ml-1.5 hidden md:flex items-center";

const VARIANT_CLASS: Record<IconLinkVariant, string> = {
  minimal: "text-dull-accent-blue transition-colors duration-200 hover:text-text-primary",
  button:
    "flex items-center justify-center w-12 h-12 rounded-xl bg-surface-subtle border border-border-color text-text-secondary transition-all duration-200 hover:bg-border-color hover:border-white/20 hover:text-text-primary [[data-theme=light]_&]:hover:text-white hover:-translate-y-0.5",
};

const IconLink: React.FC<IconLinkProps> = ({
  href,
  icon: Icon,
  label,
  external = false,
  variant = "minimal",
  iconSize = 18,
  className = DEFAULT_LAYOUT_CLASS,
}) => (
  <a
    href={href}
    aria-label={label}
    className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
  >
    <Icon size={iconSize} />
  </a>
);

export default IconLink;
