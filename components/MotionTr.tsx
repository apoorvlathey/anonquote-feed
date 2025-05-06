import { chakra } from "@chakra-ui/react";
import { motion, isValidMotionProp } from "framer-motion";
import { ComponentProps } from "react";

const _MotionTr = chakra(motion.tr, {
  shouldWrapChildren: true,
  shouldPassThroughProps: (prop: string) =>
    isValidMotionProp(prop) || prop === "transition",
});

export const MotionTr = (props: ComponentProps<typeof _MotionTr>) => {
  return (
    <_MotionTr
      variants={{
        hidden: { x: -100, opacity: 0 },
        visible: { x: 0, opacity: 1 },
      }}
      {...props}
    />
  );
};
