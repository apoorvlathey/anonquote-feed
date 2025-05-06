import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { Box, VStack, HStack, Button } from "@chakra-ui/react";
import { TickFinder } from "@flaunch/sdk";

// Import custom components and hooks
import { ChartComponent } from "./ChartComponent";
import { ControlPanel } from "./ControlPanel";
import { useChartData } from "./useChartData";
import { GraphVizProps } from "./types";

// Import utilities and constants
import {
  getCoinMCAPForTick,
  calculateEffectiveTickSpacing,
  calculateBarSize,
  calculateMaxYValue,
} from "./utils";
import {
  INITIAL_RANGE,
  MAX_RANGE,
  TICK_SPACING,
  ZOOM_FACTOR,
  PAN_FACTOR,
  MAX_DATA_POINTS,
} from "./constants";

/**
 * Main visualization component for displaying liquidity distribution
 */
export const GraphViz: React.FC<GraphVizProps> = ({
  ticksData,
  currentTick,
  isFLETHZero,
  ethUSDCPrice,
  coinSymbol,
}) => {
  // UI state
  const [autoRecenter, setAutoRecenter] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // References to track changes
  const isInitialMount = useRef(true);
  const prevTickRef = useRef(currentTick);

  // Domain state (visible range of ticks)
  const [xDomain, setXDomain] = useState(() => {
    const center = currentTick;
    return {
      min:
        Math.floor((center - INITIAL_RANGE / 2) / TICK_SPACING) * TICK_SPACING,
      max:
        Math.ceil((center + INITIAL_RANGE / 2) / TICK_SPACING) * TICK_SPACING,
    };
  });

  // Calculate current market cap based on the current tick
  const currentMCAP = useMemo(
    () => getCoinMCAPForTick({ tick: currentTick, isFLETHZero, ethUSDCPrice }),
    [currentTick, isFLETHZero, ethUSDCPrice]
  );

  // Calculate MCAP range for Y-axis based on visible tick range
  const mcapDomain = useMemo(() => {
    const minMCAP = getCoinMCAPForTick({
      tick: xDomain.min,
      isFLETHZero,
      ethUSDCPrice,
    });

    const maxMCAP = getCoinMCAPForTick({
      tick: xDomain.max,
      isFLETHZero,
      ethUSDCPrice,
    });

    // Invert range if FLETH is token0 due to inverse price relationship
    return isFLETHZero
      ? { min: maxMCAP, max: minMCAP }
      : { min: minMCAP, max: maxMCAP };
  }, [xDomain.min, xDomain.max, isFLETHZero, ethUSDCPrice]);

  // Calculate dynamic tick spacing based on zoom level and range
  const effectiveTickSpacing = useMemo(
    () =>
      calculateEffectiveTickSpacing(xDomain.min, xDomain.max, MAX_DATA_POINTS),
    [xDomain.min, xDomain.max]
  );

  // Transform raw tick data into chart-friendly format
  const chartData = useChartData({
    xDomain,
    effectiveTickSpacing,
    ticksData,
    isFLETHZero,
    ethUSDCPrice,
  });

  // Calculate bar size and max Y value for consistent visualization
  const barSize = useMemo(
    () => calculateBarSize(chartData, mcapDomain.min, mcapDomain.max),
    [chartData, mcapDomain.min, mcapDomain.max]
  );

  const maxYValue = useMemo(
    () =>
      calculateMaxYValue(
        chartData,
        ticksData.map((d) => d.tag),
        effectiveTickSpacing
      ),
    [chartData, ticksData, effectiveTickSpacing]
  );

  // Event handlers for user interaction
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => prev * ZOOM_FACTOR);
    const range = xDomain.max - xDomain.min;
    const center =
      Math.round((xDomain.min + xDomain.max) / 2 / TICK_SPACING) * TICK_SPACING;
    const newRange = range / ZOOM_FACTOR;

    setXDomain({
      min: Math.floor((center - newRange / 2) / TICK_SPACING) * TICK_SPACING,
      max: Math.ceil((center + newRange / 2) / TICK_SPACING) * TICK_SPACING,
    });
  }, [xDomain]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => prev / ZOOM_FACTOR);
    const range = xDomain.max - xDomain.min;
    const center =
      Math.round((xDomain.min + xDomain.max) / 2 / TICK_SPACING) * TICK_SPACING;
    let newRange = range * ZOOM_FACTOR;

    // Limit the maximum range to the entire tick range
    newRange = Math.min(newRange, MAX_RANGE);

    // Calculate new min/max while respecting boundaries
    let newMin =
      Math.floor((center - newRange / 2) / TICK_SPACING) * TICK_SPACING;
    let newMax =
      Math.ceil((center + newRange / 2) / TICK_SPACING) * TICK_SPACING;

    // Ensure we don't exceed boundaries
    if (newMin < TickFinder.MIN_TICK) {
      newMin = TickFinder.MIN_TICK;
      newMax = Math.min(TickFinder.MAX_TICK, TickFinder.MIN_TICK + newRange);
    }

    if (newMax > TickFinder.MAX_TICK) {
      newMax = TickFinder.MAX_TICK;
      newMin = Math.max(TickFinder.MIN_TICK, TickFinder.MAX_TICK - newRange);
    }

    setXDomain({
      min: newMin,
      max: newMax,
    });
  }, [xDomain]);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    const center = currentTick;
    setXDomain({
      min:
        Math.floor((center - INITIAL_RANGE / 2) / TICK_SPACING) * TICK_SPACING,
      max:
        Math.ceil((center + INITIAL_RANGE / 2) / TICK_SPACING) * TICK_SPACING,
    });
  }, [currentTick]);

  const handlePanLeft = useCallback(() => {
    // Adjust pan factor based on zoom level - more aggressive when zoomed out
    const scaledPanFactor = PAN_FACTOR / zoomLevel;
    const shift = Math.round(scaledPanFactor / TICK_SPACING) * TICK_SPACING;

    // When isFLETHZero is true, the MCAP decreases as tick increases, so we need to reverse direction
    const actualShift = isFLETHZero ? shift : -shift;

    setXDomain((prev) => ({
      min: Math.max(TickFinder.MIN_TICK, prev.min + actualShift),
      max: Math.max(
        TickFinder.MIN_TICK + (prev.max - prev.min),
        prev.max + actualShift
      ),
    }));
  }, [zoomLevel, isFLETHZero]);

  const handlePanRight = useCallback(() => {
    // Adjust pan factor based on zoom level - more aggressive when zoomed out
    const scaledPanFactor = PAN_FACTOR / zoomLevel;
    const shift = Math.round(scaledPanFactor / TICK_SPACING) * TICK_SPACING;

    // When isFLETHZero is true, the MCAP decreases as tick increases, so we need to reverse direction
    const actualShift = isFLETHZero ? -shift : shift;

    setXDomain((prev) => ({
      min: Math.min(
        TickFinder.MAX_TICK - (prev.max - prev.min),
        prev.min + actualShift
      ),
      max: Math.min(TickFinder.MAX_TICK, prev.max + actualShift),
    }));
  }, [zoomLevel, isFLETHZero]);

  const handleRecenter = useCallback(() => {
    const range = xDomain.max - xDomain.min;
    const center = currentTick;
    setXDomain({
      min: Math.floor((center - range / 2) / TICK_SPACING) * TICK_SPACING,
      max: Math.ceil((center + range / 2) / TICK_SPACING) * TICK_SPACING,
    });
  }, [xDomain.min, xDomain.max, currentTick]);

  // Modified auto-recenter effect
  useEffect(() => {
    // Skip the first render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevTickRef.current = currentTick;
      return;
    }

    // Check if currentTick has changed
    if (autoRecenter && prevTickRef.current !== currentTick) {
      // Calculate MCAP for current tick
      const currentMCAPValue = getCoinMCAPForTick({
        tick: currentTick,
        isFLETHZero,
        ethUSDCPrice,
      });

      // Check if current MCAP is outside visible range
      const isCurrentMCAPVisible =
        currentMCAPValue >= mcapDomain.min &&
        currentMCAPValue <= mcapDomain.max;

      // Only recenter if current MCAP is not visible in the graph
      if (!isCurrentMCAPVisible) {
        handleRecenter();
      }
    }

    // Update the ref with current tick
    prevTickRef.current = currentTick;
  }, [
    currentTick,
    autoRecenter,
    handleRecenter,
    mcapDomain,
    isFLETHZero,
    ethUSDCPrice,
  ]);

  // Debugging
  useEffect(() => {
    console.log({
      chartData,
      maxYValue,
      effectiveTickSpacing,
      barSize,
    });
  }, [
    JSON.stringify(
      chartData.map((d) => ({
        tick: d.tick,
        mcap: d.mcap,
        FairLaunchETHOnly: d.FairLaunchETHOnly,
        FairLaunchCoinOnly: d.FairLaunchCoinOnly,
        BidWall: d.BidWall,
        FairLaunchETHOnlyOriginal: d.FairLaunchETHOnlyOriginal,
        FairLaunchCoinOnlyOriginal: d.FairLaunchCoinOnlyOriginal,
        BidWallOriginal: d.BidWallOriginal,
      }))
    ),
    maxYValue,
    effectiveTickSpacing,
    barSize,
  ]);

  return (
    <VStack spacing={4} w="full" h="600px">
      <ControlPanel
        onPanLeft={handlePanLeft}
        onPanRight={handlePanRight}
        onRecenter={handleRecenter}
        autoRecenter={autoRecenter}
        setAutoRecenter={setAutoRecenter}
      />

      <Box w="full" h="500px" position="relative">
        {/* Zoom controls in top right */}
        <HStack
          position="absolute"
          top="2rem"
          right="2rem"
          spacing={2}
          zIndex={10}
          bg="rgba(0,0,0,0.1)"
          p={2}
          borderRadius="md"
        >
          <Button size="sm" onClick={handleZoomIn}>
            Zoom In
          </Button>
          <Button size="sm" onClick={handleZoomOut}>
            Zoom Out
          </Button>
          <Button size="sm" onClick={handleResetZoom}>
            Reset Zoom
          </Button>
        </HStack>

        <ChartComponent
          chartData={chartData}
          mcapDomain={mcapDomain}
          currentMCAP={currentMCAP}
          barSize={barSize}
          maxYValue={maxYValue}
          effectiveTickSpacing={effectiveTickSpacing}
          isFLETHZero={isFLETHZero}
          ethUSDCPrice={ethUSDCPrice}
          coinSymbol={coinSymbol}
        />
      </Box>

      {/* Pan controls at the bottom */}
      <HStack spacing={4} justify="center" w="full">
        <Button onClick={handlePanLeft}>← Pan Left</Button>
        <Button onClick={handleRecenter}>Recenter</Button>
        <Button onClick={handlePanRight}>Pan Right →</Button>
      </HStack>
    </VStack>
  );
};
