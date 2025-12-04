export function getLiveKitURL(
  projectUrl: string,
  region: string | null,
): string {
  const url = new URL(projectUrl);
  if (region && url.hostname.includes("livekit.cloud")) {
    const [projectId, ...hostParts] = url.hostname.split(".");
    const updatedHostParts =
      hostParts[0] !== "staging" ? ["production", ...hostParts] : hostParts;
    const regionURL = [projectId, region, ...updatedHostParts].join(".");
    url.hostname = regionURL;
  }
  return url.toString();
}
