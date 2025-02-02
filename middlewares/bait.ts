import { getLogger } from "@logtape/logtape";
import type { BunFile, SocketAddress } from "bun";
import { createMiddleware } from "hono/factory";
import { matches } from "ip-matching";
import { config } from "~/packages/config-manager";

const baitFile = async (): Promise<BunFile | undefined> => {
    const file = Bun.file(config.http.bait.send_file || "./beemovie.txt");

    if (await file.exists()) {
        return file;
    }

    const logger = getLogger("server");

    logger.error`Bait file not found: ${config.http.bait.send_file}`;
};

export const bait = createMiddleware(async (context, next) => {
    const requestIp = context.env?.ip as SocketAddress | undefined | null;

    if (!config.http.bait.enabled) {
        return await next();
    }

    const file = await baitFile();

    if (!file) {
        return await next();
    }

    // Check for bait IPs
    if (requestIp?.address) {
        for (const ip of config.http.bait.bait_ips) {
            if (matches(ip, requestIp.address)) {
                return context.body(file.stream());
            }
        }
    }

    // Check for bait user agents (regex)
    const ua = context.req.header("user-agent") ?? "";

    for (const agent of config.http.bait.bait_user_agents) {
        if (new RegExp(agent).test(ua)) {
            return context.body(file.stream());
        }
    }

    await next();
});
