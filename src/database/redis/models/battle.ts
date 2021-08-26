import * as _ from 'lodash';
import CacheModel from './_cache';


const RedirectKey = `zempie:redirect:battle:`;

class BattleCache extends CacheModel {
    public readonly name = 'battle';

    async getByUid(uid: string) {
        const battle = await this.redis.get(RedirectKey + uid);
        if ( battle ) {
            return JSON.parse(battle)
        }
        return battle
    }
    setByUid(ret: any, uid: string) {
        this.redis.set(RedirectKey + uid, JSON.stringify(ret), () => {
            this.redis.expire(RedirectKey + uid, 60 * 10, () => {});
        })
    }

    async gameStart (battle_uid: string, battle_key: string, user_uid: string, best_score?: number) {
        this.redis.hset(`zempie:battle:${battle_uid}:users`, user_uid, JSON.stringify({
            user_uid,
            best_score: best_score || -1,
        }))
    }

    async gameOver (battle_uid: string, user_uid: string, score: number) {
        this.redis.zadd(`zempie:battle:${battle_uid}`)
    }
}


export default new BattleCache()
