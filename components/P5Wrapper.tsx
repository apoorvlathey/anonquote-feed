import { P5CanvasInstance, ReactP5Wrapper } from "@p5-wrapper/react";

export interface Position {
  height: number;
  startTick: number;
  endTick: number;
}

export interface SketchProps {
  currentTick: number;
  ethAtCurrentTick: number;
  fairLaunchEthOnlyPosition: Position;
  fairLaunchMemePosition: Position;
  bidWallPosition: Position;
  tickBarHeight: (tick: number) => number;
  getETHFillRatio: (tick: number, eth: number) => number;
  [key: string]: any;
}

export interface P5WrapperProps extends SketchProps {
  sketch: (p5: P5CanvasInstance<SketchProps>) => void;
}

const P5Wrapper: React.FC<P5WrapperProps> = (props) => {
  return <ReactP5Wrapper {...props} />;
};

export default P5Wrapper;
