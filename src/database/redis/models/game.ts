import * as uniqid from 'uniqid';
import CacheModel from './_cache';


const FeaturedKey = `zempie:game:featured`;
const PathnameKey = `zempie:game:p:`;
const ListKey = 'zempie:games:';
const GameKey = `zempie:game:g:`;
const BattleKey = `zempie:game:b:`;
const SharedKey = `zempie:game:s:`;

class GameCache extends CacheModel {
    public readonly name = 'game';

    async getList(query: string) {
        const games: string | null = await this.redis.get(ListKey + query);
        if ( games ) {
            return JSON.parse(games);
        }
        return null
    }
    setList(games: any, query = '') {
        if ( games.length > 0 ) {
            this.redis.set(ListKey + query, JSON.stringify(games), () => {
                this.redis.expire(ListKey + query, 60, () => {});
            });
        }
    }

    async getData(keyType: string, key: string) {
        const data = await this.redis.get(keyType + key);
        return data? JSON.parse(data) : null;
    }
    setData(data: any, keyType: string, key: string, seconds = 60) {
        this.redis.set(keyType + key, JSON.stringify(data), () => {
            this.redis.expire(keyType + key, seconds, () => {});
        })
    }

    async getByPathname(pathname: string) {
        const game = await this.redis.get(PathnameKey + pathname);
        if ( game ) {
            return JSON.parse(game)
        }
        return game;
    }
    setByPathname(ret: any, pathname: string) {
        this.redis.set(PathnameKey + pathname, JSON.stringify(ret), () => {
            this.redis.expire(PathnameKey + pathname, 60, () => {});
        })
    }
    delByPathname(pathname: string, user_uid: string) {
        const key = pathname + '_' + user_uid;
        this.redis.expire(PathnameKey + key, 0, () => {});
    }

    /**
     * featured
     */
    async getFeatured() {
        const ret = await this.redis.get(FeaturedKey);
        if ( ret ) {
            return JSON.parse(ret)
        }
        return ret;
    }
    setFeatured(ret: any) {
        this.redis.set(FeaturedKey, JSON.stringify(ret), () => {
            this.redis.expire(FeaturedKey, 60, () => {});
        })
    }

    /**
     * launcher - game (zempie)
     */
    async getByUid(uid: string) {
        const ret = await this.redis.get(GameKey + uid);
        if ( ret ) {
            return JSON.parse(ret)
        }
        return ret;
    }
    setByUid(ret: any, uid: string) {
        this.redis.set(GameKey + uid, JSON.stringify(ret), () => {
            this.redis.expire(GameKey + uid, 60, () => {});
        })
    }

    /**
     * launcher - battle
     */
    async getBattle(uid: string) {
        const ret = await this.redis.get(BattleKey + uid);
        if ( ret ) {
            return JSON.parse(ret)
        }
        return ret;
    }
    setBattle(ret: any, uid: string) {
        this.redis.set(BattleKey + uid, JSON.stringify(ret), () => {
            this.redis.expire(BattleKey + uid, 60 * 10, () => {});
        })
    }

    /**
     * launcher - shared
     */
    async getShared(uid: string) {
        const ret = await this.redis.get(SharedKey + uid);
        if ( ret ) {
            return JSON.parse(ret)
        }
        return ret;
    }
    setShared(ret: any, uid: string) {
        this.redis.set(SharedKey + uid, JSON.stringify(ret), () => {
            this.redis.expire(SharedKey + uid, 60, () => {});
        })
    }


    /**
     * playing game
     */
    async getPlayingGame () {

    }
    setPlayingGame (game_id: number, user_uid?: string) {
    }
}


export default new GameCache()
