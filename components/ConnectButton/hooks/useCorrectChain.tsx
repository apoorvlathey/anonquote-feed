import { useAccount, useSwitchChain } from "wagmi";
import { Chain } from "viem";
import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";

interface UseCorrectChainProps {
  expectedChainId?: number;
  expectedChain?: Chain;
}

export const useCorrectChain = ({
  expectedChainId,
  expectedChain,
}: UseCorrectChainProps) => {
  const { isConnected, chainId } = useAccount();
  const { openChainModal } = useChainModal();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  const isCorrectChain =
    isConnected &&
    ((expectedChainId !== undefined && chainId === expectedChainId) ||
      (expectedChain !== undefined && chainId === expectedChain.id));

  let correctChainText = "Connect Wallet";
  let correctChainAction = () => {};
  if (isConnected) {
    if (!isCorrectChain) {
      correctChainText = expectedChain
        ? `Switch to ${expectedChain.name}`
        : "Switch Network";
      correctChainAction = () => {
        if (expectedChain) {
          switchChain({ chainId: expectedChain.id });
        } else {
          openChainModal?.();
        }
      };
    } else {
      correctChainText = "";
      correctChainAction = () => {
        openConnectModal?.();
      };
    }
  }

  return {
    isCorrectChain,
    correctChainText,
    correctChainAction,
  };
};
