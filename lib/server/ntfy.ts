type Options = {
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  timeoutMs?: number;
};

export async function publishNtfy(message: string, options: Options = {}): Promise<void> {
  if (typeof message !== "string" || !message.trim() || [...message].length > 200) {
    throw new Error("Notification text must contain 1–200 characters.");
  }
  const env = options.env ?? process.env;
  const topic = env.NTFY_TOPIC;
  if (!topic || !/^[A-Za-z0-9_-]{1,64}$/.test(topic)) throw new Error("Configure a valid NTFY_TOPIC.");
  let server: URL;
  try {
    server = new URL(env.NTFY_SERVER || "https://ntfy.sh");
    if (server.protocol !== "https:" || server.username || server.password || server.search || server.hash || server.pathname !== "/") throw new Error();
  } catch {
    throw new Error("NTFY_SERVER must be an HTTPS origin without credentials or a path.");
  }
  const timeoutMs = options.timeoutMs ?? 5_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 5_000) throw new Error("Notification timeout must be between 1 and 5000 milliseconds.");
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new Error("Timeout"));
    }, timeoutMs);
  });
  try {
    const request = async () => {
      const response = await (options.fetch ?? fetch)(server.href, {
        method: "POST",
        redirect: "error",
        headers: {
          "Content-Type": "application/json",
          ...(env.NTFY_TOKEN ? { Authorization: `Bearer ${env.NTFY_TOKEN}` } : {}),
        },
        body: JSON.stringify({ topic, title: "FirstDose", message, priority: 4 }),
        signal: controller.signal,
      });
      // We only need HTTP acceptance. Do not retain or print provider response text.
      await response.body?.cancel();
      if (!response.ok) throw new Error("Rejected");
    };
    await Promise.race([request(), timeout]);
  } catch {
    // A retry after an ambiguous failure could buzz the watch twice.
    throw new Error(timedOut
      ? "Notification request timed out. Delivery is unconfirmed."
      : "Notification request failed. Delivery is unconfirmed.");
  } finally {
    clearTimeout(timer);
  }
}
