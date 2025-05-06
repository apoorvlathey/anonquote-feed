import { COIN_SUPPLY, TICK_SPACING } from "./constants";
import { ChartDataPoint } from "./types";

/**
 * Calculates the market capitalization of the coin at a given tick
 * @param tick - The tick position in the Uniswap V3 pool
 * @param isFLETHZero - Flag indicating if FLETH is token0 (true) or token1 (false)
 * @param ethUSDCPrice - Current ETH to USDC price
 * @returns The market cap in USD
 */
export const getCoinMCAPForTick = ({
  tick,
  isFLETHZero,
  ethUSDCPrice,
}: {
  tick: number;
  isFLETHZero: boolean;
  ethUSDCPrice: number;
}) => {
  const price = Math.pow(1.0001, tick);

  let ethPerCoin = 0;
  if (isFLETHZero) {
    ethPerCoin = 1 / price;
  } else {
    ethPerCoin = price;
  }

  return ethPerCoin * COIN_SUPPLY * ethUSDCPrice;
};

/**
 * Format MCAP for display with appropriate unit suffix
 */
export const formatMCAP = (mcap: number): string => {
  return `$${formatCoin(mcap)}`;
};

export const formatCoin = (val: number): string => {
  if (val >= 1_000_000_000_000) {
    return `${(val / 1_000_000_000_000).toFixed(2)}T`;
  } else if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(2)}B`;
  } else if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(2)}M`;
  } else if (val >= 1_000) {
    return `${(val / 1_000).toFixed(2)}K`;
  } else {
    return `${val.toFixed(2)}`;
  }
};

/**
 * Calculate effective tick spacing based on zoom level and range
 */
export const calculateEffectiveTickSpacing = (
  xDomainMin: number,
  xDomainMax: number,
  maxDataPoints: number
) => {
  const totalRange = xDomainMax - xDomainMin;
  const targetDataPoints = Math.min(maxDataPoints, totalRange / TICK_SPACING);

  // Increase aggregation as we zoom out
  const aggregationFactor = Math.max(
    1,
    Math.ceil(totalRange / TICK_SPACING / targetDataPoints)
  );
  return TICK_SPACING * aggregationFactor;
};

/**
 * Calculate dynamic bar size based on chart data and domain
 */
export const calculateBarSize = (
  chartData: ChartDataPoint[],
  mcapMin: number,
  mcapMax: number
) => {
  if (chartData.length <= 1) return 10;

  // Get the MCAP range for the current view
  const mcapRange = Math.abs(mcapMax - mcapMin);

  // For each bar, calculate how much of the total MCAP range it should cover
  const avgMcapPerBar = mcapRange / chartData.length;

  // Scale this to pixels (assuming 1200px width)
  const baseWidth = (avgMcapPerBar / mcapRange) * 1200;

  // Add some overlap to ensure bars connect
  const width = Math.ceil(baseWidth * 1.5);

  // Ensure minimum width of 3 pixels and maximum of 50
  return Math.min(50, Math.max(3, width));
};

/**
 * Calculate maximum Y value for chart with appropriate padding
 */
export const calculateMaxYValue = (
  chartData: ChartDataPoint[],
  tickTags: string[],
  effectiveTickSpacing: number
) => {
  let maxBarHeight = 0;

  // Find the maximum value in our aggregated chart data
  chartData.forEach((point) => {
    tickTags.forEach((tag) => {
      const value = point[tag];
      if (value && value > maxBarHeight) {
        maxBarHeight = value;
      }
    });
  });

  // Add padding on top with a fixed padding factor
  const paddingFactor = 2;

  return maxBarHeight * paddingFactor;
};
