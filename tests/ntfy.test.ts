import { describe, expect, it, vi } from "vitest";
import { publishNtfy } from "@/lib/server/ntfy";

const env = { NTFY_TOPIC: "fictional-test-topic", NTFY_TOKEN: "fictional-test-token" };
const success = () => vi.fn<typeof fetch>().mockResolvedValue(new Response("{}"));

describe("ntfy transport", () => {
  it("publishes a bounded JSON message without placing the topic in the URL", async () => {
    const transport = success();
    await publishNtfy("FirstDose watch test.", { env, fetch: transport });
    const [url, request] = transport.mock.calls[0];
    expect(url).toBe("https://ntfy.sh/");
    expect(request).toMatchObject({ method: "POST", redirect: "error" });
    expect(new Headers(request?.headers).get("authorization")).toBe("Bearer fictional-test-token");
    expect(JSON.parse(request?.body as string)).toEqual({ topic: "fictional-test-topic", title: "FirstDose", message: "FirstDose watch test.", priority: 4 });
  });

  it("supports configured HTTPS servers and omits absent authorization", async () => {
    const transport = success();
    await publishNtfy("Test", { env: { NTFY_TOPIC: env.NTFY_TOPIC, NTFY_SERVER: "https://notify.example.test/" }, fetch: transport });
    expect(transport.mock.calls[0][0]).toBe("https://notify.example.test/");
    expect(new Headers(transport.mock.calls[0][1]?.headers).has("authorization")).toBe(false);
  });

  it.each(["", " ", "x".repeat(201)])("rejects invalid message length before publishing", async (message) => {
    const transport = success();
    await expect(publishNtfy(message, { env, fetch: transport })).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });

  it("counts Unicode code points without truncating valid text", async () => {
    const transport = success();
    const message = "🔔".repeat(200);
    await publishNtfy(message, { env, fetch: transport });
    expect(JSON.parse(transport.mock.calls[0][1]?.body as string).message).toBe(message);
  });

  it.each([
    {},
    { NTFY_TOPIC: "../secret" },
    { NTFY_TOPIC: "has space" },
    { ...env, NTFY_SERVER: "http://notify.example.test" },
    { ...env, NTFY_SERVER: "https://user:password@notify.example.test" },
    { ...env, NTFY_SERVER: "https://notify.example.test?token=secret" },
    { ...env, NTFY_SERVER: "https://notify.example.test/path" },
  ])("rejects missing or unsafe configuration without contacting a service", async (config) => {
    const transport = success();
    await expect(publishNtfy("Test", { env: config, fetch: transport })).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });

  it("does not retry rejected or uncertain requests and sanitizes errors", async () => {
    for (const transport of [
      vi.fn<typeof fetch>().mockResolvedValue(new Response("provider response with secret", { status: 401 })),
      vi.fn<typeof fetch>().mockRejectedValue(new Error("network URL/topic/token secret")),
    ]) {
      await expect(publishNtfy("Test", { env, fetch: transport })).rejects.toThrow("Notification request failed. Delivery is unconfirmed.");
      expect(transport).toHaveBeenCalledTimes(1);
    }
  });

  it("bounds even an uncooperative fetch and aborts the signal", async () => {
    const transport = vi.fn<typeof fetch>(() => new Promise(() => {}));
    await expect(publishNtfy("Test", { env, fetch: transport, timeoutMs: 10 })).rejects.toThrow("Notification request timed out. Delivery is unconfirmed.");
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("also bounds response cleanup without exposing provider content", async () => {
    const body = new ReadableStream({ cancel: () => new Promise(() => {}) });
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
    await expect(publishNtfy("Test", { env, fetch: transport, timeoutMs: 10 })).rejects.toThrow("Notification request timed out. Delivery is unconfirmed.");
  });
});
