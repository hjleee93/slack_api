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
const _ = require("lodash");
const _cache_1 = require("./_cache");
const HashtagGames = `zempie:games:hashtag:`;
class HashtagCache extends _cache_1.default {
    constructor() {
        super(...arguments);
        this.name = 'hashtag';
    }
    initialize(redis) {
        const _super = Object.create(null, {
            initialize: { get: () => super.initialize }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.initialize.call(this, redis);
            // let games = await dbs.Game.getList({ limit: undefined })
            // games = _.map(games, game => game.get({plain: true}));
            // _.forEach(games, (game: any) => {
            //     if ( game.hashtags !== null && game.hashtags !== '' ) {
            //         this.addTag(game.title, game.title, JSON.stringify(game));
            //         this.addTag(game.hashtags, game.title, JSON.stringify(game));
            //     }
            // })
        });
    }
    addTag(keys, field, value) {
        let _keys;
        if (typeof keys === 'string') {
            // _keys = [];
            // _keys.push(keys.trim())
            _keys = keys.split(',');
        }
        else {
            _keys = [...keys];
        }
        _.forEach(_keys, (key) => {
            key = key.trim();
            if (key.indexOf('#tags:') !== 0) {
                key = '#tags:' + key;
            }
            this.redis.hset(key, field, value);
        });
    }
    delTag(key, field) {
        key = key.trim();
        if (key.indexOf('#tags:') !== 0) {
            key = '#tags:' + key;
        }
        this.redis.hdel(key, field);
    }
    findAll(key) {
        return __awaiter(this, void 0, void 0, function* () {
            key = key.trim();
            if (key.indexOf('#tags:') !== 0) {
                key = '#tags:' + key;
            }
            return this.redis.hgetall(key);
        });
    }
    getGames(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.redis.get(HashtagGames + key);
            return data ? JSON.parse(data) : null;
        });
    }
    setGames(key, games) {
        this.redis.set(HashtagGames + key, JSON.stringify(games), () => {
            this.redis.expire(HashtagGames + key, 600, () => { });
        });
    }
}
exports.default = new HashtagCache();
//# sourceMappingURL=hashtag.js.map