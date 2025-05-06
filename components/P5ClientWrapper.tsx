"use client";

import { useEffect, useState } from "react";
import { P5CanvasInstance, ReactP5Wrapper } from "@p5-wrapper/react";

interface Position {
  height: number;
  startTick: number;
  endTick: number;
}

interface SketchProps {
  initialTick: number;
  currentTick: number;
  ethAtCurrentTick: number;
  fairLaunchEthOnlyPosition: Position;
  fairLaunchMemePosition: Position;
  bidWallPosition: Position;
  tickBarHeight: (tick: number) => number;
  getETHFillRatio: (tick: number, eth: number) => number;
}

interface P5ClientWrapperProps extends SketchProps {
  sketch: (p5: P5CanvasInstance<SketchProps>) => void;
}

export default function P5ClientWrapper(props: P5ClientWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <ReactP5Wrapper {...props} />;
}
