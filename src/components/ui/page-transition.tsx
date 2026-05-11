"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// One UI–inspired easing: fast start, smooth deceleration
const ONE_UI_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: ONE_UI_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.99,
    transition: {
      duration: 0.14,
      ease: [0.36, 0, 0.66, -0.56] as [number, number, number, number],
    },
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.03,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 14, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: ONE_UI_EASE,
    },
  },
};

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// One UI spring card tap
export function SpringCard({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
