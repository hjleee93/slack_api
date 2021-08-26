import * as IORedis from 'ioredis';
import * as path from 'path';
import db_options from '../../../config/dbs';
import { logger } from '../../commons/logger';
import { Redis as IRedis } from 'ioredis';
import { getFiles } from '../../commons/utils';
import { caches } from '../../commons/globals';

/**
 * sudo docker run -v /home/loki/redis/redis.conf:/usr/local/etc/redis/redis.conf --name redis -d -p 6379:6379 redis redis-server /usr/local/etc/redis/redis.conf
 */

class Redis {
    private redis!: IRedis;
    private interval: any = null;

    public initialize() {
        if ( this.redis ) {
            //
        }
        this.redis = new IORedis(db_options.redis);
        if ( this.redis ) {
            this.redis.hset('server:zempie', 'status', 'running');
            // this.setTimer();
            logger.info('redis is ready.'.cyan);
        }

        this.preloadCaches()
    }

    private preloadCaches() {
        const dir = path.join(__dirname, '/models/');

        getFiles(dir, async (dir: string, file: string) => {
            const cache = require(path.join(dir, file)).default;
            cache.initialize(this.redis);
            caches[cache.name] = cache;
        });
    }

    public getRedis() {
        return this.redis;
    }
}


export default new Redis()
