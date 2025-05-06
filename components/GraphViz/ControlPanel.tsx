import React from "react";
import {
  Button,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  Heading,
} from "@chakra-ui/react";
import { ControlPanelProps } from "./types";

/**
 * Component for pan controls and auto-recenter toggle
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  onPanLeft,
  onPanRight,
  onRecenter,
  autoRecenter,
  setAutoRecenter,
}) => {
  return (
    <>
      {/* Header with title and auto-recenter toggle */}
      <HStack w="full" justify="space-between" px={4}>
        <Heading size="md">Liquidity Distribution</Heading>
        <FormControl display="flex" alignItems="center" w="auto">
          <FormLabel htmlFor="auto-recenter" mb="0" mr={2}>
            Auto-recenter
          </FormLabel>
          <Switch
            id="auto-recenter"
            isChecked={autoRecenter}
            onChange={(e) => setAutoRecenter(e.target.checked)}
          />
        </FormControl>
      </HStack>
    </>
  );
};
