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
const _cache_1 = require("./_cache");
const Key = 'zempie:users:info:';
const ChannelKey = `zempie:users:channel:`;
class UserCache extends _cache_1.default {
    constructor() {
        super(...arguments);
        this.name = 'user';
    }
    getInfo(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.redis.get(Key + uid);
            return user ? JSON.parse(user) : null;
        });
    }
    setInfo(uid, user) {
        this.redis.set(Key + uid, JSON.stringify(user), () => {
            this.redis.expire(Key + uid, 60, () => { });
        });
    }
    delInfo(uid) {
        this.redis.expire(Key + uid, 0, () => { });
    }
    getChannel(channel_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield this.redis.get(ChannelKey + channel_id);
            return profile ? JSON.parse(profile) : null;
        });
    }
    setChannel(channel_id, profile) {
        this.redis.set(ChannelKey + channel_id, JSON.stringify(profile), () => {
            this.redis.expire(ChannelKey + channel_id, 60, () => { });
        });
    }
    delChannel(channel_id) {
        this.redis.expire(ChannelKey + channel_id, 0, () => { });
    }
}
exports.default = new UserCache();
//# sourceMappingURL=user.js.map