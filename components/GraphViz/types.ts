import { TickData } from "@/types";

// Chart data structure used in visualization
export interface ChartDataPoint {
  tick: number;
  mcap: number;
  FairLaunchETHOnly?: number;
  FairLaunchCoinOnly?: number;
  BidWall?: number;
  InFairLaunch?: number;
  PendingBidWall?: number;
  ETHAtCurrentTick?: number;
  [key: string]: number | undefined;
}

// Props for GraphViz component
export interface GraphVizProps {
  ticksData: TickData[];
  currentTick: number;
  isFLETHZero: boolean;
  ethUSDCPrice: number;
  coinSymbol?: string;
}

// Props for Chart component
export interface ChartComponentProps {
  chartData: ChartDataPoint[];
  mcapDomain: {
    min: number;
    max: number;
  };
  coinSymbol?: string;
  currentMCAP: number;
  barSize: number;
  maxYValue: number;
  effectiveTickSpacing: number;
  isFLETHZero: boolean;
  ethUSDCPrice: number;
}

// Control panel props
export interface ControlPanelProps {
  onPanLeft: () => void;
  onPanRight: () => void;
  onRecenter: () => void;
  autoRecenter: boolean;
  setAutoRecenter: (value: boolean) => void;
}
