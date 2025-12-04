import React from "react";
import styles from "./GlassInput.module.css";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  (
    { label, error, icon, iconPosition = "left", className = "", ...props },
    ref,
  ) => {
    return (
      <div className={`${styles.container} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={`${styles.inputWrapper} ${error ? styles.error : ""}`}>
          {icon && iconPosition === "left" && (
            <span className={styles.iconLeft}>{icon}</span>
          )}
          <input
            ref={ref}
            className={`${styles.input} ${icon && iconPosition === "left" ? styles.withIconLeft : ""} ${icon && iconPosition === "right" ? styles.withIconRight : ""}`}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <span className={styles.iconRight}>{icon}</span>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  },
);

GlassInput.displayName = "GlassInput";
