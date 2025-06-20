import config from "./config";
import { createClient } from "redis";

if (!config.redis.URL) {
  console.error("REDIS_URL not set");
}

/** @type {Record<string, ReturnType<typeof createClient>>} */
let clients = {};

/**
 * @param {import("redis").RedisClientOptions} [options]
 *
 * @returns {ReturnType<typeof createClient>}
 */
export default function getClient(options) {
  options = Object.assign(
    {},
    {
      url: config.redis.URL,
    },
    options,
  );

  if (!options.url) {
    throw new Error("You must pass a URL to connect");
  }

  let client = clients[options.url];

  if (client) {
    return client;
  }

  client = createClient(options);

  client
    .on("error", (err) => {
      console.error("Redis Client Error", err);

      try {
        client.destroy();
      } catch (err) {}

      void refreshClient(client);
    })
    .connect();

  clients[options.url] = client;

  return client;
}

/**
 * @param {ReturnType<typeof createClient>} client
 */
async function refreshClient(client) {
  if (client) {
    const options = client.options;

    if (options?.url) {
      delete clients[options?.url];
    }

    getClient(options);
  }
}
