"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const IORedis = require("ioredis");
const path = require("path");
const dbs_1 = require("../../../config/dbs");
const logger_1 = require("../../commons/logger");
const utils_1 = require("../../commons/utils");
const globals_1 = require("../../commons/globals");
/**
 * sudo docker run -v /home/loki/redis/redis.conf:/usr/local/etc/redis/redis.conf --name redis -d -p 6379:6379 redis redis-server /usr/local/etc/redis/redis.conf
 */
class Redis {
    constructor() {
        this.interval = null;
    }
    initialize() {
        if (this.redis) {
            //
        }
        this.redis = new IORedis(dbs_1.default.redis);
        if (this.redis) {
            this.redis.hset('server:zempie', 'status', 'running');
            // this.setTimer();
            logger_1.logger.info('redis is ready.');
        }
        this.preloadCaches();
    }
    preloadCaches() {
        const dir = path.join(__dirname, '/models/');
        utils_1.getFiles(dir, (dir, file) => __awaiter(this, void 0, void 0, function* () {
            const cache = require(path.join(dir, file)).default;
            cache.initialize(this.redis);
            globals_1.caches[cache.name] = cache;
        }));
    }
    getRedis() {
        return this.redis;
    }
}
exports.default = new Redis();
//# sourceMappingURL=index.js.map