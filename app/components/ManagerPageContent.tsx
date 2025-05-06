"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Container,
  Box,
  Text,
  Image,
  Spinner,
  Center,
  Skeleton,
  Flex,
  SimpleGrid,
  useToast,
  useBreakpointValue,
} from "@chakra-ui/react";
import { createPublicClient, http, Address } from "viem";
import { createDrift } from "@delvtech/drift";
import { viemAdapter } from "@delvtech/drift-viem";
import { ReadFlaunchSDK, resolveIPFS } from "@flaunch/sdk";
import { chainIdToRpcUrl, chains } from "@/data/chains";

// Grid view token card component
const TokenCard = ({
  token,
  onClick,
}: {
  token: TokenData;
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
            {token.metadata?.symbol ? `$${token.metadata.symbol}` : "-"}
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
};

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

export default function ManagerPageContent() {
  const toast = useToast({
    position: "bottom-right",
    duration: 5000,
    isClosable: true,
  });

  // Simple loading states
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Track if data is already loaded to prevent duplicate fetches
  const dataLoadedRef = useRef(false);

  // Containers for infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Chain info
  const chainKey = "base";
  const manager = "0x124f62e1BF232AfD29c7725904F351399C83f572";
  const chain = chains[chainKey];

  // Grid columns based on screen size
  const columns = useBreakpointValue({ base: 2, sm: 3, md: 4, lg: 5 }) || 4;

  // Load initial data
  useEffect(() => {
    // Skip if data already loaded
    if (dataLoadedRef.current) return;

    async function loadInitialData() {
      try {
        setLoading(true);

        // Create SDK instance
        const flaunch = new ReadFlaunchSDK(
          chain.id,
          createDrift({
            adapter: viemAdapter({
              publicClient: createPublicClient({
                transport: http(chainIdToRpcUrl[chain.id]),
              }),
            }),
          })
        );

        // Fetch all tokens in manager
        const managerAddress = manager as Address;
        const managerTokens = await flaunch.revenueManagerAllTokensInManager({
          revenueManagerAddress: managerAddress,
          sortByDesc: true,
        });

        // Set total count for UI display
        setTotalCount(managerTokens.length);

        // If no tokens, we're done
        if (managerTokens.length === 0) {
          setLoading(false);
          return;
        }

        // Take first batch of tokens (12 per page)
        const batchSize = 12;
        const firstBatch = managerTokens.slice(0, batchSize);

        // Fetch metadata for first batch
        const metadataResults = await flaunch.getCoinMetadataFromTokenIds(
          firstBatch
        );

        // Process tokens with metadata
        const processedTokens = firstBatch.map((token, index) => {
          const metadata = metadataResults[index];
          return {
            flaunch: token.flaunch,
            tokenId: token.tokenId,
            metadata: metadata
              ? {
                  coinAddress: metadata.coinAddress,
                  name: metadata.name,
                  symbol: metadata.symbol,
                  image: metadata.image,
                  description: metadata.description,
                }
              : undefined,
          };
        });

        // Update tokens state
        setTokens(processedTokens);

        // Store all tokens for pagination in sessionStorage
        // This avoids keeping large state in memory and prevents re-renders
        sessionStorage.setItem(
          "allTokens",
          JSON.stringify(
            managerTokens.map((t) => ({
              flaunch: t.flaunch,
              tokenId: t.tokenId.toString(),
            }))
          )
        );

        // Mark data as loaded
        dataLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading initial data:", error);
        // toast({
        //   title: "Error",
        //   description: "Failed to load quotes",
        //   status: "error",
        // });
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [chain.id, manager, toast]);

  // Load more tokens when user scrolls
  const loadMoreTokens = useCallback(async () => {
    try {
      // Skip if initial data still loading
      if (loading) return;

      // Get stored tokens from sessionStorage
      const storedTokens = sessionStorage.getItem("allTokens");
      if (!storedTokens) return;

      const allTokens = JSON.parse(storedTokens);

      // If we've loaded all tokens, don't try to load more
      if (tokens.length >= allTokens.length) return;

      // Determine next batch to load
      const batchSize = 12;
      const nextBatch = allTokens
        .slice(tokens.length, tokens.length + batchSize)
        .map((t: { flaunch: string; tokenId: string }) => ({
          flaunch: t.flaunch as Address,
          tokenId: BigInt(t.tokenId),
        }));

      // Skip if no more tokens to load
      if (nextBatch.length === 0) return;

      // Create new SDK instance for this request
      const flaunch = new ReadFlaunchSDK(
        chain.id,
        createDrift({
          adapter: viemAdapter({
            publicClient: createPublicClient({
              transport: http(chainIdToRpcUrl[chain.id]),
            }),
          }),
        })
      );

      // Fetch metadata
      const metadataResults = await flaunch.getCoinMetadataFromTokenIds(
        nextBatch
      );

      // Process tokens
      const newTokens = nextBatch.map(
        (token: { flaunch: Address; tokenId: bigint }, index: number) => {
          const metadata = metadataResults[index];
          return {
            flaunch: token.flaunch,
            tokenId: token.tokenId,
            metadata: metadata
              ? {
                  coinAddress: metadata.coinAddress,
                  name: metadata.name,
                  symbol: metadata.symbol,
                  image: metadata.image,
                  description: metadata.description,
                }
              : undefined,
          };
        }
      );

      // Update state with new tokens
      setTokens((currentTokens) => [...currentTokens, ...newTokens]);
    } catch (error) {
      console.error("Error loading more tokens:", error);
      toast({
        title: "Error",
        description: "Failed to load more quotes",
        status: "error",
      });
    }
  }, [tokens.length, loading, chain.id, toast]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    // Use intersection observer to detect when we near the bottom
    const observer = new IntersectionObserver(
      (entries) => {
        // If the load-more element is visible and we're not already loading
        if (entries[0].isIntersecting && !loading) {
          loadMoreTokens();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreTokens, loading]);

  return (
    <Container maxW="8xl" mt={4} px={{ base: 2, md: 4 }}>
      <Box
        mb={2}
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
            {totalCount > 0
              ? `Fetched Quotes ${tokens.length}/${totalCount}`
              : "Fetching Quotes..."}
          </Text>
        </Flex>

        <Box
          ref={scrollContainerRef}
          maxH={{ base: "calc(100vh - 8rem)", md: "calc(100vh - 10rem)" }}
          overflowY="auto"
          sx={{
            "&::-webkit-scrollbar": {
              width: "4px",
              borderRadius: "4px",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              borderRadius: "4px",
            },
          }}
        >
          {loading ? (
            // Loading skeleton
            <SimpleGrid columns={columns} spacing={4}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  height="0"
                  paddingBottom="100%"
                  borderRadius="xl"
                />
              ))}
            </SimpleGrid>
          ) : tokens.length === 0 ? (
            // No tokens found
            <Center h="200px">
              <Text>No quotes found</Text>
            </Center>
          ) : (
            // Token grid
            <>
              <SimpleGrid columns={columns} spacing={4}>
                {tokens.map((token, index) => (
                  <TokenCard
                    key={`${
                      token.flaunch
                    }-${token.tokenId.toString()}-${index}`}
                    token={token}
                    onClick={() => {
                      if (token.metadata?.coinAddress) {
                        window.open(
                          `https://anonquote.xyz/quote/${token.metadata.coinAddress}`,
                          "_blank"
                        );
                      }
                    }}
                  />
                ))}
              </SimpleGrid>

              {/* Load more trigger element with loading indicator */}
              <Box ref={loadMoreRef} h="20px" mt={4}></Box>
              {tokens.length > 0 && tokens.length < totalCount && (
                <Center py={4}>
                  <Flex align="center" direction="column">
                    <Spinner size="sm" mb={2} />
                    <Text fontSize="sm" color="gray.500">
                      Loading more quotes...
                    </Text>
                  </Flex>
                </Center>
              )}
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
}
