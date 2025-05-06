"use client";

import { useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { P5CanvasInstance } from "@p5-wrapper/react";
import { Box, Spinner } from "@chakra-ui/react";

const ReactP5Wrapper = dynamic(
  () => import("@p5-wrapper/react").then((mod) => mod.ReactP5Wrapper),
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  }
);

const P5ClientWrapper = dynamic(
  () => import("./P5ClientWrapper").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" alignItems="center" h="600px">
        <Spinner size="xl" />
      </Box>
    ),
  }
);

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

export interface Position {
  height: number;
  startTick: number;
  endTick: number;
}

export const CONSTANTS = {
  numBars: 20,
  barWidth: 30,
  axisOffset: 100,
  startingTickOffset: 4,
  canvas: {
    width: 800,
    height: 600,
    frameRate: 60,
  },
  colors: {
    initialTickLine: "rgb(18, 84, 188)",
    currentTickLine: "red",
    eth: "hsla(257, 54.90%, 52.20%, 0.80)",
    coin: "hsla(330, 70%, 70%, 0.8)",
    bidWallEth: "hsla(257, 71.00%, 24.30%, 0.80)",
    bidWallCoin: "hsla(330, 70%, 30%, 0.8)",
    current: "hsla(200, 70%, 60%, 1)",
  },
};

const tickHeightPerEth = 40;

export const ethToHeight = (eth: number) => {
  return eth * tickHeightPerEth;
};

const heightToEth = (height: number) => {
  return height / tickHeightPerEth;
};

interface UniswapV4VizProps {
  initialTick: number;
  currentTick: number;
  ethAtCurrentTick: number;
  fairLaunchMemePosition: Position;
}

export const UniswapV4Viz = ({
  initialTick,
  currentTick,
  ethAtCurrentTick,
  fairLaunchMemePosition,
}: UniswapV4VizProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const startingTick = currentTick - CONSTANTS.startingTickOffset;

  const [fairLaunchEthOnlyPosition, _] = useState<Position>({
    height: ethToHeight(1),
    startTick: 1,
    endTick: 15,
  });

  const [bidWallPosition, setBidWallPosition] = useState<Position>({
    height: ethToHeight(2),
    startTick: 3,
    endTick: 4,
  });

  const tickBarHeight = useCallback(
    (tick: number) => {
      let height = 0;

      if (
        tick >= fairLaunchEthOnlyPosition.startTick &&
        tick <= fairLaunchEthOnlyPosition.endTick - 1
      ) {
        height += fairLaunchEthOnlyPosition.height;
      }
      if (
        tick >= fairLaunchMemePosition.startTick &&
        tick <= fairLaunchMemePosition.endTick - 1
      ) {
        height += fairLaunchMemePosition.height;
      }
      if (
        tick >= bidWallPosition.startTick &&
        tick <= bidWallPosition.endTick - 1
      ) {
        height += bidWallPosition.height;
      }

      return height;
    },
    [fairLaunchEthOnlyPosition, fairLaunchMemePosition, bidWallPosition]
  );

  const getETHFillRatio = useCallback(
    (tick: number, eth: number) => {
      const totalETHPossible = heightToEth(tickBarHeight(tick));
      return totalETHPossible > 0 ? eth / totalETHPossible : 0;
    },
    [tickBarHeight]
  );

  const sketch = useCallback((p5: P5CanvasInstance<SketchProps>) => {
    let hoveredBar = -1;
    let _initialTick = 0;
    let _currentTick = 0;
    let _ethAtCurrentTick = 0;
    let _fairLaunchEthOnlyPosition: Position;
    let _fairLaunchMemePosition: Position;
    let _bidWallPosition: Position;
    let _tickBarHeight: (tick: number) => number;
    let _getETHFillRatio: (tick: number, eth: number) => number;
    // Update the props update handler
    p5.updateWithProps = (props: SketchProps) => {
      _currentTick = props.currentTick;
      _initialTick = props.initialTick;
      _ethAtCurrentTick = props.ethAtCurrentTick;
      _fairLaunchEthOnlyPosition = props.fairLaunchEthOnlyPosition;
      _fairLaunchMemePosition = props.fairLaunchMemePosition;
      _bidWallPosition = props.bidWallPosition;
      _tickBarHeight = props.tickBarHeight;
      _getETHFillRatio = props.getETHFillRatio;
    };

    const setupCanvas = () => {
      p5.createCanvas(CONSTANTS.canvas.width, CONSTANTS.canvas.height);
      p5.frameRate(CONSTANTS.canvas.frameRate);
    };

    const drawBars = (relativeMouseX: number, relativeMouseY: number) => {
      p5.noStroke();

      // Reset hoveredBar at the start of each frame
      hoveredBar = -1;

      for (let i = 0; i < CONSTANTS.numBars; i++) {
        const x = i * CONSTANTS.barWidth;
        const barValue = i + startingTick;

        const isFairLaunchETHOnly =
          barValue >= _fairLaunchEthOnlyPosition.startTick &&
          barValue <= _fairLaunchEthOnlyPosition.endTick - 1;

        const isFairLaunchMeme =
          barValue >= _fairLaunchMemePosition.startTick &&
          barValue <= _fairLaunchMemePosition.endTick - 1;

        const isBidWall =
          barValue >= _bidWallPosition.startTick &&
          barValue <= _bidWallPosition.endTick - 1;

        if (!isFairLaunchETHOnly && !isFairLaunchMeme && !isBidWall) {
          continue;
        }

        let fairLaunchY = 0;
        let fairLaunchHeight = 0;
        let bidWallY = 0;
        let bidWallHeight = 0;

        if (isFairLaunchETHOnly) {
          fairLaunchHeight = -_fairLaunchEthOnlyPosition.height;
        } else if (isFairLaunchMeme) {
          fairLaunchHeight = -_fairLaunchMemePosition.height;
        }

        if (isBidWall) {
          bidWallY = fairLaunchHeight;
          bidWallHeight = -_bidWallPosition.height;
        }

        const totalBarHeight = fairLaunchHeight + bidWallHeight;

        const isHovered =
          relativeMouseX > x &&
          relativeMouseX < x + CONSTANTS.barWidth &&
          relativeMouseY < 0 &&
          relativeMouseY > totalBarHeight;

        if (isHovered) {
          hoveredBar = i;
          p5.fill(p5.color(CONSTANTS.colors.current));
          p5.rect(x, 0, CONSTANTS.barWidth, totalBarHeight);
        } else {
          if (barValue > _currentTick) {
            // Future Fair Launch bars - all coin
            p5.fill(p5.color(CONSTANTS.colors.coin));
            p5.rect(x, fairLaunchY, CONSTANTS.barWidth, fairLaunchHeight);
          } else if (barValue < _currentTick) {
            // Past Fair Launch bars - all eth
            p5.fill(p5.color(CONSTANTS.colors.eth));
            p5.rect(x, fairLaunchY, CONSTANTS.barWidth, fairLaunchHeight);

            // Past Bid Wall bars - different color
            p5.fill(p5.color(CONSTANTS.colors.bidWallEth));
            p5.rect(x, bidWallY, CONSTANTS.barWidth, bidWallHeight);
          } else {
            // Current bar - draw with gradient based on fillLevel
            const ethFillRatio = _getETHFillRatio(
              _currentTick,
              _ethAtCurrentTick
            );
            const totalGrayHeight = totalBarHeight * ethFillRatio;
            const totalPinkHeight = totalBarHeight - totalGrayHeight;

            let bidWallGrayHeight = 0;
            let bidWallPinkHeight = 0;
            let fairLaunchGrayHeight = 0;
            let fairLaunchPinkHeight = 0;

            if (isBidWall) {
              // note: heights are in negative
              if (fairLaunchHeight < totalPinkHeight) {
                // only fair launch is part pink
                fairLaunchPinkHeight = totalPinkHeight;
                fairLaunchGrayHeight = fairLaunchHeight - totalPinkHeight;
                // bid wall is all gray
                bidWallGrayHeight = bidWallHeight;
                bidWallPinkHeight = 0;
              } else {
                // fair launch is all pink
                fairLaunchPinkHeight = fairLaunchHeight;
                fairLaunchGrayHeight = 0;
                // bid wall is part or all pink
                bidWallPinkHeight = totalPinkHeight - fairLaunchPinkHeight;
                bidWallGrayHeight = bidWallHeight - bidWallPinkHeight;
              }
            } else {
              fairLaunchGrayHeight = totalGrayHeight;
              fairLaunchPinkHeight = totalPinkHeight;
            }

            // Fair Launch
            // Draw pink portion
            p5.fill(p5.color(CONSTANTS.colors.coin));
            p5.rect(x, 0, CONSTANTS.barWidth, fairLaunchPinkHeight);
            // Draw gray portion
            p5.fill(p5.color(CONSTANTS.colors.eth));
            p5.rect(
              x,
              fairLaunchPinkHeight,
              CONSTANTS.barWidth,
              fairLaunchGrayHeight
            );

            // Bid Wall
            // Draw pink portion
            p5.fill(p5.color(CONSTANTS.colors.bidWallCoin));
            p5.rect(x, fairLaunchHeight, CONSTANTS.barWidth, bidWallPinkHeight);
            // Draw gray portion
            p5.fill(p5.color(CONSTANTS.colors.bidWallEth));
            p5.rect(
              x,
              fairLaunchHeight + bidWallPinkHeight,
              CONSTANTS.barWidth,
              bidWallGrayHeight
            );
          }
        }

        // Add dividing lines
        p5.stroke(200);
        p5.strokeWeight(1);
        p5.line(x, 0, x, totalBarHeight);
      }
    };

    const drawTooltip = () => {
      if (hoveredBar !== -1) {
        const tooltipX = hoveredBar * CONSTANTS.barWidth;
        const value = hoveredBar + startingTick;

        const totalBarHeight = _tickBarHeight(value);
        const ethInBar = heightToEth(totalBarHeight);
        const tooltipText = `${ethInBar} ETH`;

        // Set text properties first to measure
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(12); // Set explicit text size
        const textWidth = p5.textWidth(tooltipText);

        // Add padding around text
        const padding = 10;
        const rectWidth = textWidth + padding * 2;
        const rectHeight = 24;

        // Center the rectangle over the bar
        const rectX = tooltipX + (CONSTANTS.barWidth - rectWidth) / 2;

        // Draw white background with border
        p5.fill(255);
        p5.stroke(0);
        p5.strokeWeight(1);
        p5.rect(rectX, -totalBarHeight - 30, rectWidth, rectHeight, 4); // Added rounded corners

        // Draw text
        p5.fill(0);
        p5.noStroke();
        p5.text(
          tooltipText,
          tooltipX + CONSTANTS.barWidth / 2,
          -totalBarHeight - 18
        );
      }
    };

    const drawXAxis = () => {
      p5.stroke(0);
      p5.strokeWeight(2);
      const axisLength = CONSTANTS.numBars * CONSTANTS.barWidth;

      // Main line
      p5.line(-20, 0, axisLength + 20, 0);

      // Left arrow
      p5.line(-20, 0, -10, -5);
      p5.line(-20, 0, -10, 5);

      // Right arrow
      p5.line(axisLength + 20, 0, axisLength + 10, -5);
      p5.line(axisLength + 20, 0, axisLength + 10, 5);

      // Draw labels and tick marks
      p5.noStroke();
      p5.fill(0);
      p5.textAlign(p5.CENTER);

      for (let i = 0; i <= CONSTANTS.numBars; i++) {
        const x = i * CONSTANTS.barWidth;
        p5.stroke(0);
        p5.line(x, 0, x, 5);

        p5.noStroke();
        const value = i + startingTick;
        // Only show labels for alternate points
        if (i % 2 === 0) {
          p5.text(value.toString(), x, 20);
        }
      }
    };

    const drawInitialTickLine = () => {
      // Calculate position between bars - add half bar width to center between bars
      const leftBar = Math.floor(_initialTick - startingTick);
      const priceX = leftBar * CONSTANTS.barWidth + CONSTANTS.barWidth / 2 - 2; // few pixels on the left to avoid overlap with the current price line

      let barHeight = 0;

      const currentBarHeight = _tickBarHeight(_initialTick);
      const leftBarHeight =
        _initialTick != startingTick ? _tickBarHeight(_initialTick - 1) : 0;
      const rightBarHeight =
        _initialTick != CONSTANTS.numBars + startingTick
          ? _tickBarHeight(_initialTick + 1)
          : 0;

      barHeight = Math.max(currentBarHeight, leftBarHeight, rightBarHeight);

      // Draw vertical line
      p5.stroke(p5.color(CONSTANTS.colors.initialTickLine));
      p5.strokeWeight(2);
      p5.line(priceX, -barHeight, priceX, -barHeight - 20);

      // Draw tick label
      p5.noStroke();
      p5.fill(p5.color(CONSTANTS.colors.initialTickLine));
      p5.textAlign(p5.CENTER);
      p5.text(`Initial Tick: ${_initialTick}`, priceX, -barHeight - 30);
    };

    const drawCurrentTickLine = () => {
      // Calculate position between bars - add half bar width to center between bars
      const leftBar = Math.floor(_currentTick - startingTick);
      const priceX = leftBar * CONSTANTS.barWidth + CONSTANTS.barWidth / 2;

      let barHeight = 0;
      const extraHeight = 20;

      const currentBarHeight = _tickBarHeight(_currentTick) + extraHeight; // make it higher than initial tick line (to avoid overlap);
      const leftBarHeight =
        _currentTick != startingTick ? _tickBarHeight(_currentTick - 1) : 0;
      const rightBarHeight =
        _currentTick != CONSTANTS.numBars + startingTick
          ? _tickBarHeight(_currentTick + 1)
          : 0;

      barHeight = Math.max(currentBarHeight, leftBarHeight, rightBarHeight);

      // Draw vertical line
      p5.stroke(p5.color(CONSTANTS.colors.currentTickLine));
      p5.strokeWeight(2);
      p5.line(
        priceX,
        -(barHeight - extraHeight),
        priceX,
        -(barHeight + extraHeight)
      );

      // Draw tick label
      p5.noStroke();
      p5.fill(p5.color(CONSTANTS.colors.currentTickLine));
      p5.textAlign(p5.CENTER);
      p5.text(`Current Tick: ${_currentTick}`, priceX, -barHeight - 30);
    };

    // p5.js lifecycle methods
    p5.setup = setupCanvas;

    p5.draw = () => {
      p5.background(240);

      // Move origin to center-bottom
      p5.translate(
        p5.width / 2 - (CONSTANTS.numBars * CONSTANTS.barWidth) / 2,
        p5.height - CONSTANTS.axisOffset
      );

      // Calculate relative mouse position
      const relativeMouseX =
        p5.mouseX -
        (p5.width / 2 - (CONSTANTS.numBars * CONSTANTS.barWidth) / 2);
      const relativeMouseY = p5.mouseY - (p5.height - CONSTANTS.axisOffset);

      drawBars(relativeMouseX, relativeMouseY);
      drawXAxis();
      drawCurrentTickLine();
      drawInitialTickLine();
      drawTooltip();
    };
  }, []);

  return (
    <P5ClientWrapper
      sketch={sketch}
      initialTick={initialTick}
      currentTick={currentTick}
      ethAtCurrentTick={ethAtCurrentTick}
      fairLaunchEthOnlyPosition={fairLaunchEthOnlyPosition}
      fairLaunchMemePosition={fairLaunchMemePosition}
      bidWallPosition={bidWallPosition}
      tickBarHeight={tickBarHeight}
      getETHFillRatio={getETHFillRatio}
    />
  );
};
