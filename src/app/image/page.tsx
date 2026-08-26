import { GenerateWorkspace } from "@/components/studio/generate-workspace";

export const metadata = { title: "Prism — Image" };

export default function ImagePage() {
  return <GenerateWorkspace forcedMode="image" />;
}
