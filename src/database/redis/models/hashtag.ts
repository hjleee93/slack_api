import * as _ from 'lodash';
import { Redis as IRedis } from 'ioredis';
import CacheModel from './_cache';
import { dbs } from '../../../commons/globals';


const HashtagGames = `zempie:games:hashtag:`;

class HashtagCache extends CacheModel {
    public readonly name = 'hashtag';


    protected async initialize(redis: IRedis): Promise<void> {
        await super.initialize(redis);

        // let games = await dbs.Game.getList({ limit: undefined })
        // games = _.map(games, game => game.get({plain: true}));
        // _.forEach(games, (game: any) => {
        //     if ( game.hashtags !== null && game.hashtags !== '' ) {
        //         this.addTag(game.title, game.title, JSON.stringify(game));
        //         this.addTag(game.hashtags, game.title, JSON.stringify(game));
        //     }
        // })
    }

    addTag(keys: Array<string> | string, field: string, value: string) {
        let _keys: Array<string>;
        if ( typeof keys === 'string' ) {
            // _keys = [];
            // _keys.push(keys.trim())
            _keys = keys.split(',');
        }
        else {
            _keys = [...keys];
        }
        _.forEach(_keys, (key) => {
            key = key.trim();
            if ( key.indexOf('#tags:') !== 0 ) {
                key = '#tags:' + key;
            }
            this.redis.hset(key, field, value);
        })
    }

    delTag(key: string, field: string) {
        key = key.trim();
        if ( key.indexOf('#tags:') !== 0 ) {
            key = '#tags:' + key;
        }
        this.redis.hdel(key, field);
    }

    async findAll(key: string) {
        key = key.trim();
        if ( key.indexOf('#tags:') !== 0 ) {
            key = '#tags:' + key;
        }
        return this.redis.hgetall(key);
    }

    async getGames(key: string) {
        const data = await this.redis.get(HashtagGames + key);
        return data? JSON.parse(data) : null;
    }
    setGames(key: string, games: any) {
        this.redis.set(HashtagGames + key, JSON.stringify(games), () => {
            this.redis.expire(HashtagGames + key, 600, () => {});
        })
    }
}


export default new HashtagCache()
