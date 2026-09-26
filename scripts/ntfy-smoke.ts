import { publishNtfy } from "../lib/server/ntfy";

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--send")) {
    console.error("Usage: npm run smoke:watch [-- --send]");
    process.exitCode = 1;
    return;
  }
  if (!args.includes("--send")) {
    console.log(process.env.NTFY_TOPIC ? "ntfy topic is configured. Dry run: no notification sent." : "NTFY_TOPIC is not configured. Dry run: no notification sent.");
    console.log("Configure the ignored .env, then pass --send and confirm iPhone receipt and the physical Garmin buzz.");
    return;
  }
  try {
    await publishNtfy("FirstDose watch test. Check your iPhone and Garmin.");
    console.log("ntfy accepted the request. Confirm iPhone receipt and the physical Garmin buzz; neither is verified by this command.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Notification request failed. Delivery is unconfirmed.");
    process.exitCode = 1;
  }
}

void main();
