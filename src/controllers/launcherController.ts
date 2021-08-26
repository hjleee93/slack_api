import * as uniqid from 'uniqid';
import { caches, dbs } from '../commons/globals';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;
import MQ from '../services/messageQueueService';
import { getGameData } from './_common';
import Opt from '../../config/opt';
const { Url, Deploy } = Opt;


interface ILauncherParams {
    uid: string
    game_id: number
    // game_uid: string
    pathname: string
}


class LauncherController {
    async getGame({ pathname }: ILauncherParams, user: DecodedIdToken) {
        let ret = await caches.game.getByPathname(pathname);
        if ( !ret ) {
            const game = await dbs.Game.getInfo({ pathname });
            ret = {
                game: getGameData(game),
            }
            caches.game.setByPathname(ret, pathname);
        }

        MQ.send({
            topic: 'gameLoaded',
            messages: [{
                value: JSON.stringify({
                    user_uid: user?.uid,
                    game_id: ret.game.id,
                })
            }]
        })
        // const game = await dbs.Game.getInfo({ pathname });
        // const ret = {
        //     game: getGameData(game),
        // }
        return ret;
    }


    async getBattleGame({ uid }: ILauncherParams) {
        let ret = await caches.game.getBattle(uid);
        if ( !ret ) {
            const battle = await dbs.Battle.getInfo(uid);
            const { host, game } = battle;
            ret = {
                battle_uid: battle.uid,
                battle: {
                    uid: battle.uid,
                    title: battle.title,
                    user_count: battle.user_count,
                    end_at: battle.end_at,
                },
                game: getGameData(game),
                host: {
                    uid: host.uid,
                    name: host.name,
                    channel_id: host.channel_id,
                    picture: host.picture,
                },
            }
            caches.game.setBattle(ret, uid);
        }
        return ret;
    }


    async getSharedGame({ uid }: ILauncherParams) {
        let ret = await caches.game.getShared(uid);
        if ( !ret ) {
            const sg = await dbs.SharedGame.getInfo({uid});
            const { game, user } = sg;
            ret = {
                user: {
                    uid: user.uid,
                    name: user.name,
                    channel_id: user.channel_id,
                    picture: user.picture,
                },
                game: getGameData(game),
            }
            caches.game.setShared(ret, uid);
        }
        return ret;
    }


    /**
     *
     */
    async getSharedUrl({ game_id }: ILauncherParams, user: DecodedIdToken) {
        const uid = await dbs.SharedGame.getSharedUid({ user_uid: user.uid, game_id });

        return {
            shared_uid: uid,
            shared_url: `${Url.Launcher}/shared/${uid}`
        }
    }


    async getBattleUrl({ game_id }: ILauncherParams, user: DecodedIdToken) {
        const uid = uniqid();

        await dbs.Battle.create({
            uid,
            user_uid: user.uid,
            game_id,
            end_at: Date.now() + (1000 * 60 * 10),
        })

        return {
            battle_uid: uid,
            battle_url: `${Url.Launcher}/battle/${uid}`
        }
    }
}


export default new LauncherController()
