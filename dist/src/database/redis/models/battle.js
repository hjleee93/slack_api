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
const RedirectKey = `zempie:redirect:battle:`;
class BattleCache extends _cache_1.default {
    constructor() {
        super(...arguments);
        this.name = 'battle';
    }
    getByUid(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const battle = yield this.redis.get(RedirectKey + uid);
            if (battle) {
                return JSON.parse(battle);
            }
            return battle;
        });
    }
    setByUid(ret, uid) {
        this.redis.set(RedirectKey + uid, JSON.stringify(ret), () => {
            this.redis.expire(RedirectKey + uid, 60 * 10, () => { });
        });
    }
    gameStart(battle_uid, battle_key, user_uid, best_score) {
        return __awaiter(this, void 0, void 0, function* () {
            this.redis.hset(`zempie:battle:${battle_uid}:users`, user_uid, JSON.stringify({
                user_uid,
                best_score: best_score || -1,
            }));
        });
    }
    gameOver(battle_uid, user_uid, score) {
        return __awaiter(this, void 0, void 0, function* () {
            this.redis.zadd(`zempie:battle:${battle_uid}`);
        });
    }
}
exports.default = new BattleCache();
//# sourceMappingURL=battle.js.map