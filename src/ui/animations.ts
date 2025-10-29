import type { Variants } from 'motion-dom';

// Helpers
export const buildStagger = (staggerChildren = 0.1, delayChildren = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
      type: 'spring',
      damping: 25,
      stiffness: 120,
    },
  },
});

// Page-level container and header
export const containerVariants: Variants = buildStagger(0.1, 0.1);

export const headerVariants: Variants = {
  hidden: { opacity: 0, y: -50, scale: 0.85, rotateX: -20 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { type: 'spring', damping: 20, stiffness: 300, mass: 0.8 },
  },
};

// Card variants with hover/tap
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95, rotateX: -10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { type: 'spring', damping: 20, stiffness: 300, mass: 0.8 },
  },
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transition: { type: 'spring', damping: 15, stiffness: 400 },
  },
  tap: {
    scale: 0.98,
    transition: { type: 'spring', damping: 25, stiffness: 500 },
  },
};

// Statistics and small highlights
export const statisticVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', damping: 15, stiffness: 200, delay: 0.3 },
  },
};

// Chart cards
export const chartVariants: Variants = {
  hidden: { opacity: 0, x: -50, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', damping: 25, stiffness: 120, duration: 0.8 },
  },
};

// Synonym to match existing files naming
export const chartCardVariants = chartVariants;

// Service card list items using custom index
export const serviceCardVariants: Variants = {
  hidden: { opacity: 0, y: 50, rotateY: -90 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    rotateY: 0,
    transition: { type: 'spring', damping: 20, stiffness: 200, delay: index * 0.1 },
  }),
  hover: {
    scale: 1.05,
    rotateY: 5,
    z: 50,
    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
    transition: { type: 'spring', damping: 15, stiffness: 300 },
  },
};

// Performance card used in APIs page
export const performanceCardVariants: Variants = {
  hidden: { opacity: 0, x: -50, rotateY: -15 },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20, duration: 0.8 },
  },
  hover: {
    scale: 1.02,
    rotateY: 5,
    boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
};

// Status card variant used in APIs page
export const statusCardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  hover: {
    scale: 1.05,
    y: -5,
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    transition: { type: 'spring', stiffness: 400, damping: 10 },
  },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

// Metric card variant used in Nginx page
export const metricCardVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.8, rotateY: -20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateY: 0,
    transition: { type: 'spring', damping: 20, stiffness: 200, delay: index * 0.06 },
  }),
  hover: {
    scale: 1.03,
    y: -6,
    rotateY: 3,
    boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
    transition: { type: 'spring', damping: 18, stiffness: 350 },
  },
};

// Table and button variants
export const tableVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 25, duration: 0.8 },
  },
  hover: {
    scale: 1.01,
    transition: { type: 'spring', damping: 18, stiffness: 350 },
  },
};

export const buttonVariants: Variants = {
  // Sem deslocamento: apenas opacidade e leve escala
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 15, stiffness: 200, delay: 0.1 },
  },
  hover: {
    scale: 1.03,
    boxShadow: '0 8px 20px rgba(0, 229, 255, 0.25)',
    transition: { type: 'spring', damping: 15, stiffness: 300 },
  },
  tap: {
    scale: 0.98,
    transition: { type: 'spring', damping: 25, stiffness: 500 },
  },
};

// Page transition helpers
export const pageInitial = 'hidden';
export const pageAnimate = 'visible';