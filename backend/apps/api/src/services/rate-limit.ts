import type Redis from "ioredis";
import { rateLimitKey } from "@survival/infrastructure";

export class RateLimiter {
  constructor(private readonly redis: Redis) {}

  async consume(
    scope: string,
    id: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = rateLimitKey(scope, id);
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  }
}
