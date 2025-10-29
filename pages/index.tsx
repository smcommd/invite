import dynamic from "next/dynamic";

const IndexClient = dynamic(() => import("./components/IndexClient"), { ssr: false });

export default function IndexPage() {
  return <IndexClient />;
}

