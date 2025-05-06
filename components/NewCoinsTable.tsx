"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Box,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Image,
  Spinner,
  Center,
  HStack,
  Text,
  Skeleton,
} from "@chakra-ui/react";
import axios from "axios";
import { MotionTr } from "@/components/MotionTr";
import { usePoolCreatedEvents } from "@flaunch/sdk/hooks";
import { ReadFlaunchSDK, resolveIPFS } from "@flaunch/sdk";
import { formatTimeAgo } from "@/helpers/time";
import { chainIdToBlockDelayInSeconds, chains } from "@/data/chains";
import { useRouter } from "next/navigation";

const CoinLogo = ({ tokenUri }: { tokenUri: string }) => {
  const [coinImage, setCoinImage] = useState<string | null>(null);

  useEffect(() => {
    const getCoinImage = async () => {
      const uriJson = await axios.get(resolveIPFS(tokenUri));
      setCoinImage(resolveIPFS(uriJson.data.image));
    };
    getCoinImage();
  }, [tokenUri]);

  return (
    <Box maxH="2rem" maxW="2rem">
      {coinImage ? <Image src={coinImage} alt="Coin Logo" /> : <Spinner />}
    </Box>
  );
};

export const NewCoinsTable = ({
  chainKey,
  flaunch,
}: {
  chainKey: string;
  flaunch: ReadFlaunchSDK;
}) => {
  const router = useRouter();
  const startTimeAgoInSeconds = 4 * 60 * 60;
  const blocksAgo =
    startTimeAgoInSeconds / chainIdToBlockDelayInSeconds[flaunch.chainId];

  const [currentBlockNumber, setCurrentBlockNumber] = useState<bigint | null>(
    null
  );
  const [startBlockNumber, setStartBlockNumber] = useState<bigint | null>(null);

  const chain = chains[chainKey];

  useEffect(() => {
    const fetchBlockNumber = async () => {
      const blockNumber = await flaunch.drift.getBlockNumber();
      setCurrentBlockNumber(blockNumber);
      setStartBlockNumber(blockNumber - BigInt(blocksAgo));
    };
    fetchBlockNumber();
  }, [flaunch, blocksAgo]);

  const { logs, isFetchingFromStart } = usePoolCreatedEvents(
    flaunch,
    startBlockNumber ?? undefined
  );

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        New {chain.name} Flaunches
      </Text>
      <Box maxH="35rem" overflowY="auto" borderRadius="md" borderWidth="1px">
        <Table variant="simple" size="sm">
          <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
            <Tr>
              <Th width="100px">Time</Th>
              <Th>Logo</Th>
              <Th>Symbol</Th>
              <Th>Name</Th>
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
                      <Skeleton height="32px" width="32px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="50px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="100px" />
                    </Td>
                  </Tr>
                ))}
              </>
            )}
            {isFetchingFromStart && (
              <>
                <Tr>
                  <Td colSpan={4}>
                    <Center>
                      <HStack>
                        <Spinner />
                        <Text>
                          Fetching flaunches in the past{" "}
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
                      <Skeleton height="32px" width="32px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="50px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="100px" />
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
                _hover={{ bg: "whiteAlpha.100", cursor: "pointer" }}
                onClick={() => {
                  router.push(`/${chainKey}/coin/${log.args._memecoin}`);
                }}
                style={{ cursor: "pointer" }}
              >
                <Td>{formatTimeAgo(log.timestamp)}</Td>
                <Td>
                  <CoinLogo tokenUri={log.args._params.tokenUri} />
                </Td>
                <Td>{log.args._params.symbol}</Td>
                <Td>{log.args._params.name}</Td>
              </MotionTr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
