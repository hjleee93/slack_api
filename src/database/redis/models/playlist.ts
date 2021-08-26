import CacheModel from './_cache';


const PlaylistKey = `zempie:playlist:ig:`;

class PlaylistCache extends CacheModel {
    public readonly name = 'playlist';

    async getOne (uid: string) {
        const ret: string | null = await this.redis.get(PlaylistKey + uid);
        if ( ret ) {
            return JSON.parse(ret);
        }
        return null;
    }

    setOne( uid: string, ret: any) {
        this.redis.set(PlaylistKey + uid, JSON.stringify(ret), () => {
            //
        })
    }

    delOne (uid: string) {
        this.redis.del(PlaylistKey + uid, () => {});
    }

}


export default new PlaylistCache()
