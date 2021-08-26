import { Redis as IRedis } from 'ioredis';


class CacheModel {
    protected redis!: IRedis;

    protected async initialize (redis: IRedis) {
        this.redis = redis;
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
}


export default CacheModel
