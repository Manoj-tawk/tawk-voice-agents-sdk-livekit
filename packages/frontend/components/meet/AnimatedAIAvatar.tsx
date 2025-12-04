"use client";

import React from "react";
import { motion } from "motion/react";
import styles from "./AnimatedAIAvatar.module.css";

interface AnimatedAIAvatarProps {
  isSpeaking: boolean;
  size?: number;
}

export function AnimatedAIAvatar({
  isSpeaking,
  size = 200,
}: AnimatedAIAvatarProps) {
  return (
    <div
      className={styles.container}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Outer glow ring - pulses when speaking */}
      <motion.div
        className={styles.glowRing}
        animate={{
          scale: isSpeaking ? [1, 1.2, 1] : 1,
          opacity: isSpeaking ? [0.5, 1, 0.5] : 0.3,
        }}
        transition={{
          duration: 1.5,
          repeat: isSpeaking ? Infinity : 0,
          ease: "easeInOut",
        }}
      />

      {/* Middle ring - rotates when speaking */}
      <motion.div
        className={styles.middleRing}
        animate={{
          rotate: isSpeaking ? 360 : 0,
          scale: isSpeaking ? [1, 1.05, 1] : 1,
        }}
        transition={{
          rotate: {
            duration: 8,
            repeat: isSpeaking ? Infinity : 0,
            ease: "linear",
          },
          scale: {
            duration: 2,
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut",
          },
        }}
      />

      {/* Robot avatar - main character */}
      <motion.div className={styles.robotContainer}>
        {/* Robot head */}
        <motion.div
          className={styles.robotHead}
          animate={{
            scale: isSpeaking ? [1, 1.05, 1] : 1,
            rotate: isSpeaking ? [0, -2, 2, -2, 0] : 0,
          }}
          transition={{
            duration: 0.6,
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          {/* Antenna */}
          <motion.div
            className={styles.antenna}
            animate={{
              rotate: isSpeaking ? [0, 10, -10, 10, 0] : 0,
            }}
            transition={{
              duration: 1.5,
              repeat: isSpeaking ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className={styles.antennaTip}
              animate={{
                scale: isSpeaking ? [1, 1.5, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: isSpeaking ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Eyes */}
          <div className={styles.eyes}>
            <motion.div
              className={styles.eye}
              animate={{
                scaleY: isSpeaking ? [1, 0.1, 1] : [1, 0.1, 1],
              }}
              transition={{
                duration: isSpeaking ? 0.3 : 3,
                repeat: Infinity,
                repeatDelay: isSpeaking ? 0 : 2,
              }}
            />
            <motion.div
              className={styles.eye}
              animate={{
                scaleY: isSpeaking ? [1, 0.1, 1] : [1, 0.1, 1],
              }}
              transition={{
                duration: isSpeaking ? 0.3 : 3,
                repeat: Infinity,
                repeatDelay: isSpeaking ? 0 : 2,
              }}
            />
          </div>

          {/* Mouth - animates when speaking */}
          <motion.div
            className={styles.mouth}
            animate={{
              scaleY: isSpeaking ? [1, 1.3, 1] : 1,
              scaleX: isSpeaking ? [1, 0.9, 1] : 1,
            }}
            transition={{
              duration: 0.2,
              repeat: isSpeaking ? Infinity : 0,
              ease: "easeInOut",
            }}
          />

          {/* Cheek lights */}
          <motion.div
            className={styles.cheekLight}
            style={{ left: "10%" }}
            animate={{
              opacity: isSpeaking ? [0.3, 1, 0.3] : 0.3,
            }}
            transition={{
              duration: 0.5,
              repeat: isSpeaking ? Infinity : 0,
            }}
          />
          <motion.div
            className={styles.cheekLight}
            style={{ right: "10%" }}
            animate={{
              opacity: isSpeaking ? [0.3, 1, 0.3] : 0.3,
            }}
            transition={{
              duration: 0.5,
              repeat: isSpeaking ? Infinity : 0,
              delay: 0.25,
            }}
          />
        </motion.div>

        {/* Robot body */}
        <motion.div
          className={styles.robotBody}
          animate={{
            scale: isSpeaking ? [1, 1.02, 1] : 1,
          }}
          transition={{
            duration: 0.8,
            repeat: isSpeaking ? Infinity : 0,
          }}
        >
          {/* Chest display/screen */}
          <div className={styles.chestDisplay}>
            <motion.div
              className={styles.waveform}
              animate={{
                opacity: isSpeaking ? [0.5, 1, 0.5] : 0.3,
              }}
              transition={{
                duration: 0.5,
                repeat: isSpeaking ? Infinity : 0,
              }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className={styles.waveBar}
                  animate={{
                    scaleY: isSpeaking ? [0.3, 1, 0.3] : 0.3,
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: isSpeaking ? Infinity : 0,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
