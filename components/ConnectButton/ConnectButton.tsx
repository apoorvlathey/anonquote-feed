import { Box } from "@chakra-ui/react";
import { ConnectButton as RConnectButton } from "@rainbow-me/rainbowkit";
import { useSwitchChain } from "wagmi";
import { Chain } from "viem";

import { ConnectWalletBtn } from "./ConnectWalletBtn";
import { WrongNetworkBtn } from "./WrongNetworkBtn";
import { ChainButton } from "./ChainButton";
import { AccountButton } from "./AccountButton";

// TODO: make mobile responsive
export const ConnectButton = ({
  expectedChainId,
  expectedChain,
}: {
  expectedChainId?: number;
  expectedChain?: Chain;
}) => {
  const { switchChain } = useSwitchChain();

  return (
    <RConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready: boolean = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        const isWrongNetwork =
          (expectedChainId !== undefined && chain?.id !== expectedChainId) ||
          (expectedChain !== undefined && chain?.id !== expectedChain?.id);

        return ready ? (
          <Box hidden={!ready}>
            {(() => {
              if (!connected) {
                return <ConnectWalletBtn onClick={openConnectModal} />;
              }
              if (chain.unsupported || isWrongNetwork) {
                return (
                  <Box
                    display="flex"
                    py="0"
                    alignItems="center"
                    borderRadius="xl"
                    gap={2}
                  >
                    <WrongNetworkBtn
                      onClick={() => {
                        if (
                          isWrongNetwork &&
                          (expectedChainId || expectedChain)
                        ) {
                          switchChain({
                            chainId: expectedChainId || expectedChain!.id,
                          });
                        } else {
                          openChainModal();
                        }
                      }}
                      chainName={expectedChain ? expectedChain.name : undefined}
                    />
                    <AccountButton
                      onClick={openAccountModal}
                      account={account}
                    />
                  </Box>
                );
              }

              return (
                <Box
                  display="flex"
                  py="0"
                  alignItems="center"
                  borderRadius="xl"
                >
                  <ChainButton onClick={openChainModal} chain={chain} />
                  <AccountButton onClick={openAccountModal} account={account} />
                </Box>
              );
            })()}
          </Box>
        ) : null;
      }}
    </RConnectButton.Custom>
  );
};
