import React from "react";
import { Button } from "@chakra-ui/react";

interface Props {
  onClick: () => void;
  chainName?: string;
}

export const WrongNetworkBtn = ({ onClick, chainName }: Props) => {
  return (
    <Button colorScheme={"red"} onClick={onClick}>
      {chainName ? `Switch to ${chainName}` : "Wrong network"}
    </Button>
  );
};
