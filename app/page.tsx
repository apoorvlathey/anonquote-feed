import dynamic from "next/dynamic";

const ManagerPageContent = dynamic(
  () => import("./components/ManagerPageContent"),
  {
    ssr: false,
  }
);

export default function Page({
  params,
}: {
  params: { chainKey: string; manager: string };
}) {
  return <ManagerPageContent params={params} />;
}
