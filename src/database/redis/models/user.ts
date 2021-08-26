import CacheModel from './_cache';


const Key = 'zempie:users:info:';
const ChannelKey = `zempie:users:channel:`

class UserCache extends CacheModel {
    public readonly name = 'user';

    async getInfo(uid: string) {
        const user: string | null = await this.redis.get(Key + uid);
        return user? JSON.parse(user) : null;
    }

    setInfo(uid: string, user: any) {
        this.redis.set(Key + uid, JSON.stringify(user), () => {
            this.redis.expire(Key + uid, 60, () => {});
        });
    }

    delInfo(uid: string) {
        this.redis.expire(Key + uid, 0, () => {});
    }


    async getChannel(channel_id: string) {
        const profile: string | null = await this.redis.get(ChannelKey + channel_id);
        return profile? JSON.parse(profile) : null;
    }

    setChannel(channel_id: string, profile: any) {
        this.redis.set(ChannelKey + channel_id, JSON.stringify(profile), () => {
            this.redis.expire(ChannelKey + channel_id, 60, () => {});
        })
    }

    delChannel(channel_id: string) {
        this.redis.expire(ChannelKey + channel_id, 0, () => {});
    }
}


export default new UserCache()
