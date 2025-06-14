import config from "../config.js";
import getClient from "../redis.js";
import { LEVEL, SPLAT, MESSAGE } from "triple-beam";
import winston from "winston";
import Transport from "winston-transport";

/**
 * @typedef {Object} TransportInfo
 * @property {string} [LEVEL] - The log level, used internally by winston.
 * @property {string} [MESSAGE] - The log message, used internally by winston.
 * @property {[any]} [SPLAT] - Additional metadata or arguments passed to the log.
 */

class RedisTransport extends Transport {
  /**
   * Logs messages to a Redis stream.
   *
   * @param {TransportInfo} info
   * @param {function} [callback] - Optional callback function to call after logging.
   */
  log(info, callback) {
    try {
      const level = info[LEVEL];
      let message = info[MESSAGE];
      let meta = info[SPLAT][0] ?? {};

      if (level.toLowerCase() === "info") {
        callback();
        return;
      }

      if (typeof message !== "string") {
        message = JSON.stringify(message);
      }

      if (typeof meta !== "string") {
        meta = JSON.stringify(meta);
      }

      const redis = getClient();
      // Don't await this so the app can keep moving.
      void redis.xAdd(config.log.LOG_STREAM, "*", {
        service: config.app.FULL_NAME,
        level,
        message,
        meta,
      });

      if (level.toLowerCase() === "error") {
        void redis.xAdd(config.log.ERROR_STREAM, "*", {
          service: config.app.SERVICE_NAME,
          level,
          message,
          meta,
        });
      }
    } catch (e) {}

    callback();
  }
}

const logger = winston.createLogger({
  level: config.log.LEVEL.toLowerCase(),
  format: winston.format.json(),
  defaultMeta: { service: config.app.FULL_NAME },
  transports: [
    new RedisTransport(),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export default logger;
