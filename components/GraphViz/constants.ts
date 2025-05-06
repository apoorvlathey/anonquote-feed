// Graph visualization constants
export const TICK_SPACING = 60; // From Uniswap V3
export const COIN_SUPPLY = 100_000_000_000; // 100 billion
export const HEIGHT_PER_ETH = 1;
export const ZOOM_FACTOR = 2;
export const PAN_FACTOR = 500;
export const MAX_DATA_POINTS = 50;
export const INITIAL_RANGE = 2000; // Show 2000 ticks initially around current tick
export const MAX_RANGE = 887272 - -887272; // MAX_TICK - MIN_TICK

// Visualization colors
export const LegendColors = {
  InFairLaunch: "#ff7f50",
  ETHAtCurrentTick: "#8884d8",
  FairLaunchETHOnly: "#8884d8",
  FairLaunchCoinOnly: "hsl(113, 55.00%, 33.10%)",
  BidWall: "#ff7f50",
  PendingBidWall: "hsl(257, 54.90%, 52.20%)",
};

export const BarColors = {
  left: {
    InFairLaunch: "hsl(257, 54.90%, 52.20%)", // Purple
    FairLaunchCoinOnly: "hsl(257, 54.90%, 52.20%)", // Purple
    FairLaunchETHOnly: "hsl(257, 55.20%, 62.40%)", // Lighter purple
    ETHAtCurrentTick: "hsl(257, 55.20%, 62.40%)", // Lighter purple
    BidWall: "hsl(257, 64.10%, 40.40%)", // Darker purple
    PendingBidWall: "hsla(257, 58.20%, 52.20%, 0.7)",
  },
  right: {
    InFairLaunch: "hsl(330, 69.90%, 70.00%)", // Pink
    FairLaunchCoinOnly: "hsl(330, 69.90%, 70.00%)", // Pink
    FairLaunchETHOnly: "hsl(330, 70.60%, 80.00%)", // Lighter pink
    ETHAtCurrentTick: "hsl(257, 55.20%, 62.40%)", // Lighter purple
    BidWall: "hsl(330, 69.60%, 60.00%)", // Darker pink
    PendingBidWall: "hsla(330, 69.90%, 70.00%, 0.7)",
  },
} as const;
