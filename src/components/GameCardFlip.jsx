import { motion, useReducedMotion } from "motion/react";

export function GameCardFlip({ flipped, children }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className="game-card-flip-inner"
      initial={false}
      animate={{ rotateY: flipped ? 180 : 0 }}
      transition={{ type: "tween", duration: reducedMotion ? 0 : 0.46, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
