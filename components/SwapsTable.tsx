"use client";

import {
  Box,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Text,
  Spinner,
  Link as ChakraLink,
  Center,
  HStack,
  Skeleton,
} from "@chakra-ui/react";
import { BuySwapLog, SellSwapLog } from "@flaunch/sdk";
import { formatTimeAgo } from "@/helpers/time";
import { MotionTr } from "@/components/MotionTr";
import { formatEther } from "viem";
import { chains } from "@/data/chains";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { formatNumberWithCommas } from "@/helpers/numbers";

export const SwapsTable = ({
  chainKey,
  coinSymbol,
  currentBlockNumber,
  startBlockNumber,
  isFetchingFromStart,
  startTimeAgoInSeconds,
  logs,
  ethUSDCPrice,
}: {
  chainKey: string;
  coinSymbol?: string;
  currentBlockNumber: bigint | null;
  startBlockNumber: bigint | null;
  isFetchingFromStart: boolean;
  startTimeAgoInSeconds: number;
  logs: (BuySwapLog | SellSwapLog)[];
  ethUSDCPrice: number;
}) => {
  const chain = chains[chainKey];

  return (
    <Box flex="1" maxW="550px">
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        Recent Swaps
      </Text>
      <Box maxH="35rem" overflowY="auto" borderRadius="md" borderWidth="1px">
        <Table variant="simple" size="sm">
          <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
            <Tr>
              <Th width="100px">Time</Th>
              <Th>Action</Th>
              <Th>USD</Th>
              <Th>ETH</Th>
              <Th>{coinSymbol ? `$${coinSymbol}` : "Coins"}</Th>
              <Th>Tx</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(!currentBlockNumber || !startBlockNumber) && (
              <>
                {[...Array(3)].map((_, index) => (
                  <Tr key={index}>
                    <Td>
                      <Skeleton height="20px" width="60px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="40px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="40px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="50px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="70px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="20px" />
                    </Td>
                  </Tr>
                ))}
              </>
            )}
            {isFetchingFromStart && (
              <>
                <Tr>
                  <Td colSpan={5}>
                    <Center>
                      <HStack>
                        <Spinner />
                        <Text>
                          Fetching swaps in the last{" "}
                          {formatTimeAgo(
                            new Date().getTime() - startTimeAgoInSeconds * 1000,
                            true
                          )}
                          {" ..."}
                        </Text>
                      </HStack>
                    </Center>
                  </Td>
                </Tr>
                {[...Array(2)].map((_, index) => (
                  <Tr key={index}>
                    <Td>
                      <Skeleton height="20px" width="60px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="40px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="40px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="50px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="70px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="20px" />
                    </Td>
                  </Tr>
                ))}
              </>
            )}
            {logs.map((log, index) => (
              <MotionTr
                key={log.timestamp + index}
                initial={index === 0 ? "hidden" : "visible"}
                animate="visible"
                transition={{ duration: 0.3, delay: 0.1 } as any}
              >
                <Td>{formatTimeAgo(log.timestamp)}</Td>
                <Td color={log.type === "BUY" ? "green.500" : "red.500"}>
                  {log.type === "BUY" ? "Buy" : "Sell"}
                </Td>
                <Td color={log.type === "BUY" ? "green.500" : "red.500"}>
                  $
                  {Number(
                    (
                      parseFloat(
                        log.type === "BUY"
                          ? formatEther(log.delta.flETHSold)
                          : formatEther(log.delta.flETHBought)
                      ) * ethUSDCPrice
                    ).toFixed(2)
                  )}
                </Td>
                <Td>
                  {parseFloat(
                    log.type === "BUY"
                      ? formatEther(log.delta.flETHSold)
                      : formatEther(log.delta.flETHBought)
                  ).toFixed(4)}
                </Td>
                <Td>
                  {formatNumberWithCommas(
                    parseFloat(
                      log.type === "BUY"
                        ? formatEther(log.delta.coinsBought)
                        : formatEther(log.delta.coinsSold)
                    ).toFixed(2)
                  )}
                </Td>
                <Td>
                  <ChakraLink
                    href={`${chain!.blockExplorers!.default.url}/tx/${
                      log.transactionHash
                    }`}
                    isExternal
                  >
                    <ExternalLinkIcon />
                  </ChakraLink>
                </Td>
              </MotionTr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
