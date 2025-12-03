import { headers } from "next/headers";
import { App } from "@/components/app/app";
import { getAppConfig } from "@/lib/utils";

export default async function Page({
  searchParams,
}: {
  searchParams: { agent?: string } | Promise<{ agent?: string }>;
}) {
  const hdrs = await headers();
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const appConfig = await getAppConfig(hdrs);
  
  // Override agent name from URL query parameter
  if (params.agent) {
    appConfig.agentName = params.agent;
  }

  return <App appConfig={appConfig} />;
}
