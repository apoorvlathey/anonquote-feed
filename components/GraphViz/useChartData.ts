import { useMemo } from "react";
import { HEIGHT_PER_ETH, TICK_SPACING } from "./constants";
import { ChartDataPoint } from "./types";
import { getCoinMCAPForTick } from "./utils";
import { TickData } from "@/types";

/**
 * Custom hook to transform raw tick data into chart-friendly format
 */
export const useChartData = ({
  xDomain,
  effectiveTickSpacing,
  ticksData,
  isFLETHZero,
  ethUSDCPrice,
}: {
  xDomain: { min: number; max: number };
  effectiveTickSpacing: number;
  ticksData: TickData[];
  isFLETHZero: boolean;
  ethUSDCPrice: number;
}) => {
  return useMemo(() => {
    const data: ChartDataPoint[] = [];
    const dataPointMap: Record<number, ChartDataPoint> = {};

    // Generate base data points for the visualization with spacing based on current zoom level
    for (
      let tick = xDomain.min;
      tick <= xDomain.max;
      tick += effectiveTickSpacing
    ) {
      const mcap = getCoinMCAPForTick({ tick, isFLETHZero, ethUSDCPrice });

      const dataPoint: ChartDataPoint = {
        tick: tick,
        mcap: mcap,
      };

      // Initialize aggregated values for each liquidity type
      ticksData.forEach(({ tag }) => {
        dataPoint[tag] = 0;
        dataPoint[`${tag}Original`] = 0;
      });

      dataPointMap[tick] = dataPoint;
      data.push(dataPoint);
    }

    // Process each tick range in the tick data to correctly assign liquidity
    ticksData.forEach(({ tag, startTick, endTick, ethEquivalentPerTick }) => {
      // Skip if no liquidity or invalid range
      if (ethEquivalentPerTick <= 0 || startTick >= endTick) return;

      // Calculate the bar height based on ETH equivalent
      const barHeight =
        ethEquivalentPerTick * effectiveTickSpacing * HEIGHT_PER_ETH;

      // Find all data points this liquidity should be assigned to
      for (
        let tick = xDomain.min;
        tick <= xDomain.max;
        tick += effectiveTickSpacing
      ) {
        // Define the range covered by this data point
        const rangeStart = tick;
        const rangeEnd = tick + effectiveTickSpacing;

        // Check for overlap between the data point's range and the liquidity range
        if (rangeEnd > startTick && rangeStart < endTick) {
          // Calculate how much of this range overlaps with the liquidity
          const overlapStart = Math.max(rangeStart, startTick);
          const overlapEnd = Math.min(rangeEnd, endTick);

          // Calculate what fraction of the tick spacing this represents
          const overlapTicks = Math.max(0, overlapEnd - overlapStart);
          const fractionOfRange = overlapTicks / effectiveTickSpacing;

          // Apply the appropriate fraction of the liquidity to this data point
          const adjustedHeight = barHeight * fractionOfRange;

          if (adjustedHeight > 0) {
            dataPointMap[tick][`${tag}Original`] =
              (dataPointMap[tick][`${tag}Original`] || 0) + adjustedHeight;
          }
        }
      }
    });

    // Apply cube root transformation to all data points
    data.forEach((dataPoint) => {
      ticksData.forEach(({ tag }) => {
        const originalValue = dataPoint[`${tag}Original`] || 0;
        dataPoint[tag] = originalValue > 0 ? Math.cbrt(originalValue) : 0;
      });
    });

    return data;
  }, [
    xDomain.min,
    xDomain.max,
    effectiveTickSpacing,
    ticksData,
    isFLETHZero,
    ethUSDCPrice,
  ]);
};
