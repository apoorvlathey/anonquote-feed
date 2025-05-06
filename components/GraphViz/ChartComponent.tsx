import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Box, Spacer, Flex } from "@chakra-ui/react";
import { ChartComponentProps } from "./types";
import {
  LegendColors,
  BarColors,
  TICK_SPACING,
  COIN_SUPPLY,
} from "./constants";
import { formatCoin, formatMCAP, getCoinMCAPForTick } from "./utils";

/**
 * Chart component for liquidity visualization
 */
export const ChartComponent: React.FC<ChartComponentProps> = ({
  chartData,
  mcapDomain,
  currentMCAP,
  barSize,
  maxYValue,
  effectiveTickSpacing,
  isFLETHZero,
  ethUSDCPrice,
  coinSymbol,
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        barGap={0}
        barCategoryGap={0}
        margin={{ top: 30, right: 30, left: 20, bottom: 25 }}
      >
        <defs>
          <pattern
            id="pendingBidWallPattern-left"
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
          >
            <path
              d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
              stroke={BarColors.left.PendingBidWall}
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="pendingBidWallPattern-right"
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
          >
            <path
              d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
              stroke={BarColors.right.PendingBidWall}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(200, 200, 200, 0.2)"
        />
        <XAxis
          dataKey="mcap"
          type="number"
          scale="log"
          domain={[Math.max(1, mcapDomain.min), mcapDomain.max]}
          tickCount={5}
          angle={-30}
          textAnchor="end"
          height={60}
          tickFormatter={(value) => formatMCAP(value)}
          interval="preserveStartEnd"
          label={{
            value: "Market Cap (USD)",
            position: "insideBottom",
            offset: -15,
          }}
        />
        {/* <YAxis
          scale="linear"
          domain={[0, maxYValue]}
          label={{
            value: "", // cube root of height
            angle: -90,
            position: "insideLeft",
          }}
        /> */}
        <Tooltip
          formatter={(value: number, name: string, props: any) => {
            const originalName = name.replace("Original", "");
            if (name.endsWith("Original")) return null;

            const originalValue = props.payload[`${name}Original`];
            return originalValue === 0 ? null : originalValue.toFixed(18);
          }}
          labelFormatter={(mcap: number) => `Market Cap: ${formatMCAP(mcap)}`}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              // Filter out items with zero values and original values
              const filteredPayload = payload.filter(
                (item) =>
                  item &&
                  item.name &&
                  !item.name.endsWith("Original") &&
                  item.value !== 0
              );

              if (filteredPayload.length === 0) return null;

              // Get the actual data point from chartData for this tick
              const dataPoint = chartData.find((dp) => dp.mcap === label);
              if (!dataPoint) return null;

              // Show MCAP and tick info
              const mcap = dataPoint.mcap;
              const tick = dataPoint.tick;

              // Show MCAP range when aggregated
              const tickStart = tick;
              const tickEnd = tick + effectiveTickSpacing - TICK_SPACING;

              const mcapStart = getCoinMCAPForTick({
                tick: tickStart,
                isFLETHZero,
                ethUSDCPrice,
              });
              const mcapEnd = getCoinMCAPForTick({
                tick: tickEnd,
                isFLETHZero,
                ethUSDCPrice,
              });

              // Determine which MCAP to show first based on isFLETHZero
              const [firstMCAP, secondMCAP] = isFLETHZero
                ? [mcapEnd, mcapStart]
                : [mcapStart, mcapEnd];

              const mcapDisplay =
                effectiveTickSpacing > TICK_SPACING
                  ? `Market Cap: ${formatMCAP(firstMCAP)} to ${formatMCAP(
                      secondMCAP
                    )}`
                  : `Market Cap: ${formatMCAP(mcap)}`;

              return (
                <Box bg="#f8f9fa" p={2} borderRadius="md" boxShadow="md">
                  <Box fontWeight="bold" color="#38B2AC" mb={1}>
                    {mcapDisplay}
                  </Box>
                  <Box color="#666" fontSize="sm" mb={1}>
                    Tick: {Math.round(tick)}
                  </Box>
                  {filteredPayload.map((entry, index) => {
                    // Access original values directly from our chart data
                    const originalName = `${entry.name}Original`;
                    const originalValue = dataPoint?.[originalName] || 0;

                    return (
                      <Box
                        key={`item-${index}`}
                        display="flex"
                        justifyContent="space-between"
                        mb={1}
                      >
                        <Box
                          mr={4}
                          color={
                            LegendColors[
                              entry.name as keyof typeof LegendColors
                            ]
                          }
                        >
                          {entry.name === "FairLaunchCoinOnly"
                            ? "Post FairLaunch LP"
                            : entry.name === "FairLaunchETHOnly"
                            ? "FairLaunch LP"
                            : entry.name}
                        </Box>
                        <Box>
                          <Box
                            color={
                              LegendColors[
                                entry.name as keyof typeof LegendColors
                              ]
                            }
                          >
                            {formatMCAP(originalValue * ethUSDCPrice)}{" "}
                            {mcapStart < currentMCAP ||
                            entry.name === "ETHAtCurrentTick"
                              ? `(${originalValue.toFixed(4)} ETH)`
                              : `(${formatCoin(
                                  (COIN_SUPPLY * originalValue * ethUSDCPrice) /
                                    currentMCAP
                                )} ${coinSymbol})`}
                          </Box>
                          <Box w="100%">
                            <Flex
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Spacer />
                              <Box
                                color={
                                  LegendColors[
                                    entry.name as keyof typeof LegendColors
                                  ]
                                }
                              >
                                {!(
                                  mcapStart < currentMCAP ||
                                  entry.name === "ETHAtCurrentTick"
                                )
                                  ? `(~${originalValue.toFixed(4)} ETH)`
                                  : `(~${formatCoin(
                                      (COIN_SUPPLY *
                                        originalValue *
                                        ethUSDCPrice) /
                                        currentMCAP
                                    )} ${coinSymbol})`}
                              </Box>
                            </Flex>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              );
            }
            return null;
          }}
        />
        {/* Render each bar type */}
        {[
          "ETHAtCurrentTick",
          "FairLaunchCoinOnly",
          "InFairLaunch",
          "FairLaunchETHOnly",
          "BidWall",
          "PendingBidWall",
        ].map((tag) => (
          <Bar
            key={tag}
            dataKey={tag}
            name={tag}
            fill={LegendColors[tag as keyof typeof LegendColors]}
            barSize={barSize}
            stackId="stack"
            isAnimationActive={false}
            animationDuration={0}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  tag === "PendingBidWall"
                    ? `url(#pendingBidWallPattern-${
                        entry.mcap > currentMCAP ? "right" : "left"
                      })`
                    : entry.mcap > currentMCAP
                    ? BarColors.right[tag as keyof typeof BarColors.right]
                    : BarColors.left[tag as keyof typeof BarColors.left]
                }
              />
            ))}
          </Bar>
        ))}
        {/* Reference line for current MCAP */}
        <ReferenceLine
          x={currentMCAP}
          stroke="#ff5050"
          strokeWidth={2}
          label={{
            value: `Current Market Cap: ${formatMCAP(currentMCAP)}`,
            position: "insideTopRight",
            fill: "#ff5050",
            fontSize: 12,
            offset: -15,
            fontWeight: "bold",
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
