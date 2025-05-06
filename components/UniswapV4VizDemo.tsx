"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { createMemoryClient, http } from "tevm";
import { base } from "tevm/common";
import { Address, decodeEventLog, formatEther, parseEther } from "viem";
import {
  FlaunchPositionManagerAbi,
  FlaunchPositionManagerAddress,
} from "@flaunch/sdk";
import { MotionTr } from "@/components/MotionTr";
import { formatTimeAgo } from "@/helpers/time";
import type { P5CanvasInstance } from "@p5-wrapper/react";

const memoryClient = createMemoryClient({
  common: base,
  fork: {
    // @warning we may face throttling using the public endpoint
    // In production apps consider using `loadBalance` and `rateLimit` transports
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL!)({}),
  },
});

interface SketchProps {
  currentTick: number;
  ethAtCurrentTick: number;
  fairLaunchEthOnlyPosition: Position;
  fairLaunchMemePosition: Position;
  bidWallPosition: Position;
  tickBarHeight: (tick: number) => number;
  getETHFillRatio: (tick: number, eth: number) => number;
}

interface Transaction {
  timestamp: number;
  to: string;
  action: string;
  color: string;
}

export interface Position {
  height: number;
  startTick: number;
  endTick: number;
}

const tickHeightPerEth = 100;

const ethToHeight = (eth: number) => {
  return eth * tickHeightPerEth;
};

const heightToEth = (height: number) => {
  return height / tickHeightPerEth;
};

// Move P5 imports to a separate component
const P5Wrapper = dynamic(() => import("./P5Wrapper"), {
  ssr: false,
});

export const UniswapV4VizDemo = () => {
  const [currentTick, setCurrentTick] = useState(4);
  const [ethAtCurrentTick, setEthAtCurrentTick] = useState(0);

  const [fairLaunchEthOnlyPosition, setFairLaunchEthOnlyPosition] =
    useState<Position>({
      height: ethToHeight(2),
      startTick: -1,
      endTick: 0,
    });

  const [fairLaunchMemePosition, setFairLaunchMemePosition] =
    useState<Position>({
      height: ethToHeight(1),
      startTick: 1,
      endTick: 15,
    });

  const [bidWallPosition, setBidWallPosition] = useState<Position>({
    height: ethToHeight(2),
    startTick: 3,
    endTick: 4,
  });

  const address: Address = ("0x" + "beef".padStart(40, "0")) as Address;

  const [blockNumber, setBlockNumber] = useState(0n);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Move pushTx definition before fundETH
  const pushTx = useCallback(
    ({ to, action, color }: { to: string; action: string; color?: string }) => {
      setTransactions((prev) => [
        {
          timestamp: Date.now(),
          to,
          action,
          color: color || "gray.500",
        },
        ...prev,
      ]);
    },
    []
  );

  const fundETH = useCallback(async () => {
    const value = parseEther("100");
    await memoryClient.setBalance({
      address,
      value,
    });

    pushTx({
      to: "tevm",
      action: `Deal ${formatEther(value)} ETH`,
      color: "blue.300",
    });
  }, [address, pushTx]);

  const flaunch = async () => {
    pushTx({
      to: "FlaunchPositionManager",
      action: `Flaunching...`,
      color: "yellow.200",
    });

    const flaunchResult = await memoryClient.tevmContract({
      createTransaction: "on-success",
      from: address,
      value: parseEther("1"),
      to: FlaunchPositionManagerAddress[memoryClient.chain.id],
      abi: FlaunchPositionManagerAbi,
      functionName: "flaunch",
      args: [
        {
          name: "Test",
          symbol: "TEST",
          tokenUri: "https://test.com",
          initialTokenFairLaunch: 7500000000000000000000000000n,
          premineAmount: 0n,
          creator: address,
          creatorFeeAllocation: 0,
          flaunchAt: 0n,
          initialPriceParams:
            "0x00000000000000000000000000000000000000000000000000000006fc23ac00", // 30k
          feeCalculatorParams: "0x",
        },
      ],
    });

    const logs = flaunchResult.logs!;
    const filteredLogs = logs.filter(
      (log) =>
        log.address === FlaunchPositionManagerAddress[memoryClient.chain.id]
    );
    // decode event using viem
    const event = filteredLogs[0];
    const decodedEvent = decodeEventLog({
      abi: FlaunchPositionManagerAbi,
      data: event.data,
      topics: event.topics as [
        signature: `0x${string}`,
        ...args: `0x${string}`[]
      ],
    });

    let memecoin: Address = "0x";
    if (decodedEvent.eventName === "PoolCreated") {
      memecoin = decodedEvent.args._memecoin;
    }

    pushTx({
      to: "FlaunchPositionManager",
      action: `Flaunched ${memecoin}`,
      color: "green.300",
    });

    const mineResult = await memoryClient.tevmMine();
    pushTx({
      to: "tevm",
      action: `Mined ${mineResult.blockHashes?.length} blocks`,
      color: "blue.300",
    });
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const blockNumber = await memoryClient.getBlockNumber();

      if (!mounted) return;

      setBlockNumber(blockNumber);
      pushTx({
        to: "tevm",
        action: `Forked Base @ ${blockNumber}`,
        color: "blue.300",
      });

      await fundETH();
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fundETH, pushTx, address]);

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

  // Constants
  const CONSTANTS = {
    numBars: 20,
    barWidth: 30,
    axisOffset: 100,
    startingTick: -4,
    canvas: {
      width: 800,
      height: 600,
      frameRate: 60,
    },
    colors: {
      gray: "hsla(0, 0%, 60%, 0.8)",
      pink: "hsla(330, 70%, 70%, 0.8)",
      bidWallGray: "hsla(0, 0%, 30%, 0.8)",
      bidWallPink: "hsla(330, 70%, 30%, 0.8)",
      current: "hsla(200, 70%, 60%, 1)",
    },
  };

  // Update handlers to use object parameter
  const handleBuy = (ethSwapped: number) => {
    if (ethSwapped <= 0) return;

    let newETHAtCurrentTick = ethAtCurrentTick + ethSwapped;
    let targetTick = currentTick;

    // Keep moving up ticks until we find one that can hold our ETH
    while (targetTick < CONSTANTS.numBars + CONSTANTS.startingTick) {
      // Add bounds check
      const totalETHPossibleAtCurrentTick = heightToEth(
        tickBarHeight(targetTick)
      );

      // If we can fit in current tick, break
      if (newETHAtCurrentTick <= totalETHPossibleAtCurrentTick) {
        break;
      }

      // Move excess to next tick
      newETHAtCurrentTick -= totalETHPossibleAtCurrentTick;
      targetTick += 1;
    }

    // move the bid wall up to the new tick
    if (targetTick != currentTick) {
      setBidWallPosition((pos) => ({
        ...pos,
        startTick: targetTick - 1,
        endTick: targetTick,
      }));
    }

    setCurrentTick(targetTick);
    setEthAtCurrentTick(newETHAtCurrentTick);

    // Update pushTx call to use object parameter
    pushTx({
      to: "UniswapV4Pool",
      action: `Buy ${ethSwapped} ETH`,
      color: "green.500",
    });
  };

  const handleSell = (ethSwapped: number) => {
    if (ethSwapped <= 0) return;

    let remainingETHToSell = ethSwapped;
    let newETHAtCurrentTick = ethAtCurrentTick;
    let targetTick = currentTick;

    // First try to sell from current tick
    if (remainingETHToSell <= newETHAtCurrentTick) {
      // Can satisfy sell from current tick
      newETHAtCurrentTick -= remainingETHToSell;
      remainingETHToSell = 0;
    } else {
      // Need to move down ticks
      remainingETHToSell -= newETHAtCurrentTick;
      newETHAtCurrentTick = 0;

      while (remainingETHToSell > 0 && targetTick > CONSTANTS.startingTick) {
        // Add bounds check
        targetTick -= 1;
        const ethInNextTick = heightToEth(tickBarHeight(targetTick));

        if (remainingETHToSell <= ethInNextTick) {
          // Can satisfy remaining sell from this tick
          newETHAtCurrentTick = ethInNextTick - remainingETHToSell;
          remainingETHToSell = 0;
        } else {
          // Need to keep moving down
          remainingETHToSell -= ethInNextTick;
        }
      }
    }

    // Only update if we could satisfy the full sell
    if (remainingETHToSell === 0) {
      setCurrentTick(targetTick);
      setEthAtCurrentTick(newETHAtCurrentTick);

      // Update pushTx call to use object parameter
      pushTx({
        to: "UniswapV4Pool",
        action: `Sell ${ethSwapped} ETH`,
        color: "red.500",
      });
    }
  };

  // Add effect to update times
  useEffect(() => {
    const timer = setInterval(() => {
      // Force re-render to update relative times
      setTransactions((prev) => [...prev]);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const sketch = useCallback((p5: P5CanvasInstance<SketchProps>) => {
    let hoveredBar = -1;
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
        const barValue = i + CONSTANTS.startingTick;

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
            // Future Fair Launch bars - all pink
            p5.fill(p5.color(CONSTANTS.colors.pink));
            p5.rect(x, fairLaunchY, CONSTANTS.barWidth, fairLaunchHeight);
          } else if (barValue < _currentTick) {
            // Past Fair Launch bars - all gray
            p5.fill(p5.color(CONSTANTS.colors.gray));
            p5.rect(x, fairLaunchY, CONSTANTS.barWidth, fairLaunchHeight);

            // Past Bid Wall bars - different color
            p5.fill(p5.color(CONSTANTS.colors.bidWallGray));
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
            p5.fill(p5.color(CONSTANTS.colors.pink));
            p5.rect(x, 0, CONSTANTS.barWidth, fairLaunchPinkHeight);
            // Draw gray portion
            p5.fill(p5.color(CONSTANTS.colors.gray));
            p5.rect(
              x,
              fairLaunchPinkHeight,
              CONSTANTS.barWidth,
              fairLaunchGrayHeight
            );

            // Bid Wall
            // Draw pink portion
            p5.fill(p5.color(CONSTANTS.colors.bidWallPink));
            p5.rect(x, fairLaunchHeight, CONSTANTS.barWidth, bidWallPinkHeight);
            // Draw gray portion
            p5.fill(p5.color(CONSTANTS.colors.bidWallGray));
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
        const value = hoveredBar + CONSTANTS.startingTick;

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
        const value = i + CONSTANTS.startingTick;
        p5.text(value.toString(), x, 20);
      }
    };

    const drawPriceLine = () => {
      // Calculate position between bars - add half bar width to center between bars
      const leftBar = Math.floor(_currentTick - CONSTANTS.startingTick);
      const priceX = leftBar * CONSTANTS.barWidth + CONSTANTS.barWidth / 2;

      let barHeight = 0;

      const currentBarHeight = _tickBarHeight(_currentTick);
      const leftBarHeight =
        _currentTick != CONSTANTS.startingTick
          ? _tickBarHeight(_currentTick - 1)
          : 0;
      const rightBarHeight =
        _currentTick != CONSTANTS.numBars + CONSTANTS.startingTick
          ? _tickBarHeight(_currentTick + 1)
          : 0;

      barHeight = Math.max(currentBarHeight, leftBarHeight, rightBarHeight);

      // Draw vertical line
      p5.stroke(255, 0, 0);
      p5.strokeWeight(2);
      p5.line(priceX, 0, priceX, -barHeight - 20);

      // Draw tick label
      p5.noStroke();
      p5.fill(255, 0, 0);
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
      drawTooltip();
      drawXAxis();
      drawPriceLine();
    };
  }, []); // Keep empty dependency array

  return (
    <Box w="full" display="flex" flexDir="column" alignItems="center" gap={4}>
      <HStack w="full" maxW="1200px" align="flex-start" spacing={8}>
        <Box>
          <P5Wrapper
            sketch={sketch}
            currentTick={currentTick}
            ethAtCurrentTick={ethAtCurrentTick}
            fairLaunchEthOnlyPosition={fairLaunchEthOnlyPosition}
            fairLaunchMemePosition={fairLaunchMemePosition}
            bidWallPosition={bidWallPosition}
            tickBarHeight={tickBarHeight}
            getETHFillRatio={getETHFillRatio}
          />
          <HStack spacing={4} mt={4} justify="center">
            <Button colorScheme="blue" onClick={() => flaunch()}>
              Flaunch
            </Button>
            <Button colorScheme="green" onClick={() => handleBuy(0.2)}>
              Buy
            </Button>
            <Button colorScheme="red" onClick={() => handleSell(0.2)}>
              Sell
            </Button>
          </HStack>
        </Box>

        <Box flex="1" maxW="400px">
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Recent Transactions
          </Text>
          <Box
            maxH="35rem"
            overflowY="auto"
            borderRadius="md"
            borderWidth="1px"
          >
            <Table variant="simple" size="sm">
              <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
                <Tr>
                  <Th width="100px">Time</Th>
                  <Th width="100px">To</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((tx, index) => (
                  <MotionTr
                    key={tx.timestamp + index}
                    initial={index === 0 ? "hidden" : "visible"}
                    animate="visible"
                    transition={{ duration: 0.3, delay: 0.1 } as any}
                  >
                    <Td>{formatTimeAgo(tx.timestamp)}</Td>
                    <Td>{tx.to}</Td>
                    <Td color={tx.color}>{tx.action}</Td>
                  </MotionTr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </HStack>
    </Box>
  );
};
