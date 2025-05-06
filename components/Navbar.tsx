import { useRouter } from "next/navigation";
import { Center, Flex, Heading, Spacer } from "@chakra-ui/react";
import { ConnectButton } from "@/components/ConnectButton";
import { useAccount } from "wagmi";

// TODO: Add a settings button that opens a popover with the option to set RPC URL per chainKey
// the RPC URL should be saved in the local storage and referenced by the createPublicClient
// also have a "default" button next to the input field, so users can revert back to the default.

export default function Navbar({
  hideConnectWalletBtn,
}: {
  hideConnectWalletBtn?: boolean;
}) {
  const router = useRouter();

  // const { isConnected } = useAccount();

  return (
    <Flex
      pt={"10"}
      pr={"1rem"}
      pb={4}
      borderBottom="1px"
      borderColor={"brand.greenLight"}
    >
      <Spacer />
      <Center flex="1" flexDir={"column"}>
        <Heading
          cursor={"pointer"}
          onClick={() => {
            router.push("/");
          }}
        >
          Flaunch Viz
        </Heading>
      </Center>

      <Center flex="1" justifyContent={"end"}>
        {/* {hideConnectWalletBtn ? (
          isConnected ? (
            <ConnectButton />
          ) : (
            ""
          )
        ) : (
          <ConnectButton />
        )} */}
      </Center>
    </Flex>
  );
}
