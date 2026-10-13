import { Router } from "express";
import { requireAuth } from "../auth.js";

export const turnRouter = Router();

const FALLBACK_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const TURN_TTL_SECONDS = 2 * 60 * 60;

turnRouter.get("/turn-credentials", requireAuth, async (req, res) => {
  const tokenId = process.env.CF_TURN_TOKEN_ID;
  const apiToken = process.env.CF_TURN_API_TOKEN;

  if (!tokenId || !apiToken) {
    return res.json({ iceServers: FALLBACK_ICE_SERVERS });
  }

  try {
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${tokenId}/credentials/generate-ice-servers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: TURN_TTL_SECONDS }),
      }
    );

    if (!response.ok) {
      return res.json({ iceServers: FALLBACK_ICE_SERVERS });
    }

    const data = await response.json();
    const iceServers = data.iceServers ?? FALLBACK_ICE_SERVERS;
    res.json({ iceServers });
  } catch {
    res.json({ iceServers: FALLBACK_ICE_SERVERS });
  }
});
