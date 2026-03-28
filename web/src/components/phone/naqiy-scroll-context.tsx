"use client";

import { createContext, useContext } from "react";
import { type MotionValue, motionValue } from "motion/react";

interface NaqiyScrollContextType {
  scrollYProgress: MotionValue<number>;
}

const fallback = motionValue(0);

const NaqiyScrollContext = createContext<NaqiyScrollContextType>({
  scrollYProgress: fallback,
});

export const NaqiyScrollProvider = NaqiyScrollContext.Provider;
export const useNaqiyScroll = () => useContext(NaqiyScrollContext);
