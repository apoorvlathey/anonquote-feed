import dynamic from "next/dynamic";

const ManagerPageContent = dynamic(
  () => import("./components/ManagerPageContent"),
  {
    ssr: false,
  }
);

export default function Page() {
  return <ManagerPageContent />;
}
