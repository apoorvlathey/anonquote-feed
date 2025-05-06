"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Container,
  Box,
  Text,
  Image,
  Spinner,
  Center,
  Skeleton,
  Button,
  useToast,
  Flex,
  SimpleGrid,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { createPublicClient, http, Address } from "viem";
import { createDrift } from "@delvtech/drift";
import { viemAdapter } from "@delvtech/drift-viem";
import { ReadFlaunchSDK, resolveIPFS } from "@flaunch/sdk";
import { chainIdToRpcUrl, chains } from "@/data/chains";
import { motion } from "framer-motion";

// Grid view token card component
const TokenCard = motion(
  ({
    token,
    chain,
    onClick,
  }: {
    token: TokenData;
    chain: any;
    onClick: () => void;
  }) => {
    return (
      <Box
        position="relative"
        onClick={onClick}
        cursor="pointer"
        role="group"
        transition="transform 0.2s"
        _hover={{ transform: "scale(0.98)" }}
      >
        {/* Square aspect ratio container */}
        <Box
          position="relative"
          paddingBottom="100%"
          bg="gray.800"
          overflow="hidden"
          borderRadius="xl"
        >
          {/* Image container */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {token.metadata?.image ? (
              <Image
                src={resolveIPFS(token.metadata.image)}
                alt={token.metadata?.name || "Token"}
                objectFit="cover"
                w="100%"
                h="100%"
                loading="lazy"
                borderRadius="xl"
              />
            ) : (
              <Spinner size="lg" />
            )}
          </Box>

          {/* Hover overlay */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="blackAlpha.700"
            opacity="0"
            transition="opacity 0.2s"
            _groupHover={{ opacity: 1 }}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            p={4}
            borderRadius="xl"
          >
            <Text
              fontSize={{ base: "md", md: "xl" }}
              fontWeight="bold"
              color="white"
              textAlign="center"
            >
              {`$${token.metadata?.symbol}` || "-"}
            </Text>
            <Text
              fontSize={{ base: "sm", md: "md" }}
              color="whiteAlpha.800"
              textAlign="center"
              mt={2}
              noOfLines={2}
            >
              {token.metadata?.name || "-"}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }
);

interface TokenData {
  flaunch: Address;
  tokenId: bigint;
  metadata?: {
    coinAddress: Address;
    name: string;
    symbol: string;
    image: string;
    description: string;
  };
}

const ManagerPage = ({
  params,
}: {
  params: { chainKey: string; manager: string };
}) => {
  const router = useRouter();
  const toast = useToast({
    position: "bottom-right",
    duration: 5000,
    isClosable: true,
  });
  const loadMoreRef = useRef(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const chainKey = "base";
  // anonquote's flaunch manager
  const manager = "0x124f62e1BF232AfD29c7725904F351399C83f572";

  const [isLoading, setIsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allTokens, setAllTokens] = useState<
    { flaunch: Address; tokenId: bigint }[]
  >([]);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const chain = chains[chainKey];

  // Responsive grid columns
  const columns = useBreakpointValue({ base: 2, sm: 3, md: 4, lg: 5 });

  // Calculate tokens per page based on columns - showing 4 rows worth of tokens
  const tokensPerPage = useMemo(() => {
    // Debug log to see what columns value we're getting
    console.log("Current columns:", columns);

    // If columns is undefined (during initial render), use the largest possible value
    // This ensures we don't under-fetch tokens when the breakpoint value updates
    const currentColumns = typeof columns === "number" ? columns : 5;
    return currentColumns * 4; // Show 4 rows worth of tokens
  }, [columns]);

  const flaunch = useMemo(() => {
    if (!chain) return null;
    return new ReadFlaunchSDK(
      chain.id,
      createDrift({
        adapter: viemAdapter({
          publicClient: createPublicClient({
            transport: http(chainIdToRpcUrl[chain.id]),
          }),
        }),
      })
    );
  }, [chain]);

  // Fetch all tokens only once when component mounts or flaunch/manager changes
  useEffect(() => {
    let isMounted = true;

    const fetchAllManagerTokens = async () => {
      if (!flaunch) return;

      try {
        setInitialLoading(true);

        const managerAddress = manager as Address;
        const managerTokens = await flaunch.revenueManagerAllTokensInManager({
          revenueManagerAddress: managerAddress,
          sortByDesc: true,
        });

        if (isMounted) {
          setAllTokens(managerTokens);
          setHasMore(managerTokens.length > 0);

          if (managerTokens.length > 0) {
            await fetchTokenPage(0, managerTokens);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching all manager tokens:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to fetch manager tokens",
            status: "error",
          });
          setIsLoading(false);
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    fetchAllManagerTokens();

    return () => {
      isMounted = false;
    };
  }, [flaunch, manager]);

  const fetchTokenPage = async (page: number, allTokensList = allTokens) => {
    if (!flaunch || allTokensList.length === 0) return;

    try {
      if (page === 0) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      const startIndex = page * tokensPerPage;
      const endIndex = Math.min(
        startIndex + tokensPerPage,
        allTokensList.length
      );

      if (startIndex >= allTokensList.length) {
        setHasMore(false);
        return;
      }

      const pageTokens = allTokensList.slice(startIndex, endIndex);

      try {
        const metadataResults = await flaunch.getCoinMetadataFromTokenIds(
          pageTokens
        );

        const processedTokens: TokenData[] = pageTokens.map((token, index) => {
          const metadata = metadataResults[index];
          return {
            flaunch: token.flaunch,
            tokenId: token.tokenId,
            metadata: {
              coinAddress: metadata.coinAddress,
              name: metadata.name,
              symbol: metadata.symbol,
              image: metadata.image,
              description: metadata.description,
            },
          };
        });

        if (page === 0) {
          setTokens([...processedTokens]);
        } else {
          setTokens((prev) => [...prev, ...processedTokens]);
        }
      } catch (error) {
        console.error("Error fetching metadata for tokens:", error);
        const processedTokens: TokenData[] = pageTokens.map((token) => ({
          flaunch: token.flaunch,
          tokenId: token.tokenId,
        }));

        if (page === 0) {
          setTokens([...processedTokens]);
        } else {
          setTokens((prev) => [...prev, ...processedTokens]);
        }
      }

      setCurrentPage(page);
      setHasMore(endIndex < allTokensList.length);
    } catch (error) {
      console.error(`Error fetching token page ${page}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch token details for page ${page + 1}`,
        status: "error",
      });
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreTokens = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchTokenPage(currentPage + 1);
    }
  }, [currentPage, loadingMore, hasMore]);

  // Update the intersection observer effect
  useEffect(() => {
    if (!hasMore || loadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting) {
          loadMoreTokens();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "100px", // Load more when within 100px of the bottom
        threshold: 0.1,
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMoreTokens, hasMore, loadingMore, isLoading]);

  return (
    <Container maxW="8xl" mt={4} px={{ base: 2, md: 4 }}>
      <Box
        mb={6}
        cursor="pointer"
        onClick={() => {
          window.open("https://anonquote.xyz", "_blank");
        }}
      >
        <Text
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="bold"
          textAlign={{ base: "center", md: "left" }}
        >
          AnonQuote.xyz Feed
        </Text>
      </Box>

      <Box>
        <Flex
          justify="space-between"
          align="center"
          mb={4}
          direction={{ base: "column", md: "row" }}
          gap={2}
        >
          <Text
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="bold"
            textAlign={{ base: "center", md: "left" }}
            opacity={0.5}
          >
            Viewing Quotes{" "}
            {allTokens.length > 0 && `(${tokens.length}/${allTokens.length})`}
          </Text>
        </Flex>

        <Box
          ref={scrollContainerRef}
          maxH={{ base: "calc(100vh - 12rem)", md: "calc(100vh - 16rem)" }}
          overflowY="auto"
          sx={{
            "&::-webkit-scrollbar": {
              width: "4px",
              borderRadius: "4px",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              },
            },
          }}
        >
          {initialLoading ? (
            <SimpleGrid columns={columns} spacing={{ base: 1, md: 2 }}>
              {[...Array(tokensPerPage)].map((_, index) => (
                <Box key={index} position="relative" paddingBottom="100%">
                  <Skeleton
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    startColor="gray.800"
                    endColor="gray.700"
                    borderRadius="xl"
                  />
                </Box>
              ))}
            </SimpleGrid>
          ) : tokens.length === 0 ? (
            <Center py={4}>
              <Text>No tokens found for this manager</Text>
            </Center>
          ) : (
            <>
              <SimpleGrid columns={columns} spacing={{ base: 1, md: 2 }}>
                {tokens.map((token, index) => (
                  <TokenCard
                    key={`${token.flaunch}-${token.tokenId.toString()}`}
                    token={token}
                    chain={chain}
                    onClick={() => {
                      window.open(
                        `https://flaunch.gg/${chainKey}/coin/${token.metadata?.coinAddress}`,
                        "_blank"
                      );
                    }}
                  />
                ))}
              </SimpleGrid>

              {/* Loading more skeleton */}
              {loadingMore && (
                <SimpleGrid
                  columns={columns}
                  spacing={{ base: 1, md: 2 }}
                  mt={2}
                >
                  {[...Array(tokensPerPage)].map((_, index) => (
                    <Box
                      key={`loading-${index}`}
                      position="relative"
                      paddingBottom="100%"
                    >
                      <Skeleton
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        startColor="gray.800"
                        endColor="gray.700"
                        borderRadius="xl"
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              )}

              {/* Infinite scroll trigger */}
              <Box ref={loadMoreRef} h="20px" mt={4} />

              {/* Manual load more button */}
              {hasMore && !loadingMore && (
                <Flex justify="center" mt={4} mb={6}>
                  <Button
                    onClick={loadMoreTokens}
                    size="sm"
                    colorScheme="blue"
                    isLoading={loadingMore}
                    loadingText="Loading more..."
                    px={8}
                  >
                    Load More
                  </Button>
                </Flex>
              )}
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ManagerPage;
