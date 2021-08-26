import * as uniqid from 'uniqid';
import * as path from 'path';
import * as _ from 'lodash';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;
import { IGameListParams, IGameParams, IGamePlayParams, IRoute } from '../_interfaces';
import { Op, Sequelize, Transaction } from 'sequelize';
import { caches, dbs } from '../../commons/globals';
import MQ from '../../services/messageQueueService';
import Opt from '../../../config/opt';
import { getGameData } from '../_common';
import { eGameCategory } from '../../commons/enums';
import { CreateError, ErrorCodes } from '../../commons/errorCodes';
import { signJWT } from '../../commons/utils';
import * as jwt from 'jsonwebtoken';
const { Url } = Opt;
import * as i18n from 'i18n';
i18n.configure({
    locales: ['ko', 'en', 'uk-UA'],
    defaultLocale: 'ko',
    directory: path.join(__dirname, '..', '..', '..', 'config', 'locales'),
})


class GameController {
    featuredList = async ({ lang = 'ko' }: { lang: string }) => {
        let ret = await caches.game.getFeatured();
        if ( !ret ) {
            const popular = await dbs.Game.getListWithUser({
                activated: true,
                enabled: true
            }, { order: [['count_start', 'desc']], limit: 5 });

            const ids = _.map(popular, (p: any) => p.id);
            const recommended = await dbs.Game.getListWithUser({
                activated: true,
                enabled: true,
                category: {[Op.ne]: 2},
                id: {[Op.ne]: ids},
            }, { order: Sequelize.literal('rand()'), limit: 5 });
            // const latest = await dbs.Game.getListWithUser({ activated: true, enabled: true }, { order: [['id', 'asc']], limit: 5 });
            // const certified = await dbs.Game.getListWithUser({ category: eGameCategory.Certified, activated: true, enabled: true }, { order: Sequelize.literal('rand()'), limit: 5 });
            const uncertified = await dbs.Game.getListWithUser({ category: eGameCategory.Challenge, activated: true, enabled: true }, { order: Sequelize.literal('rand()'), limit: 5 });

            const affiliated = await dbs.Game.getListWithUser({
                activated: true,
                enabled: true,
                category: 2
            }, { order: Sequelize.literal('rand()'), limit: 7 });

            ret = [
                {
                    name: i18n.__({ phrase: 'Recommended Games', locale: lang }),
                    games: _.map(recommended, obj => getGameData(obj)),
                },
                {
                    name: i18n.__({ phrase: 'Popular Games', locale: lang }),
                    games: _.map(popular, obj => getGameData(obj)),
                },
                {
                    name: i18n.__({ phrase: 'Affiliated Games', locale: lang }),
                    games: _.map(affiliated, obj => getGameData(obj)),
                },
                // {
                //     name: i18n.__({ phrase: 'New Games', locale: lang }),
                //     games: _.map(latest, obj => getGameData(obj)),
                // },
                // {
                //     name: i18n.__({ phrase: 'Certified Games', locale: lang }),
                //     games: _.map(certified, obj => getGameData(obj)),
                //     key: 'official',
                // },
                {
                    name: i18n.__({ phrase: 'Challenging Games', locale: lang }),
                    games: _.map(uncertified, obj => getGameData(obj)),
                    key: 'unofficial',
                },
            ];

            // caches.game.setFeatured(ret);
        }

        return ret;
    }


    playGame = async ({ pathname, user_uid }: IGamePlayParams) => {
        if ( !user_uid ) {
            return;
        }

        MQ.send({
            topic: 'pubPlayGame',
            messages: [{
                value: JSON.stringify({
                    pathname,
                    user_uid,
                })
            }]
        })
    }

    redirectGame = ({ pathname, pid }: any, user: any, { req, res }: IRoute) => {
        // const { pathname, pid } = _.assignIn({}, req.body, req.query, req.params);
        let url = `${Url.GameClient}/${pathname}`;
        if ( pid ) {
            url += `/${pid}`;
        }
        res.redirect(url);
    }
    // redirectGame = (req: Request, res: Response) => {
    //     const { pathname, pid } = _.assignIn({}, req.body, req.query, req.params);
    //     let url = `${Url.GameClient}/${pathname}`;
    //     if ( pid ) {
    //         url += `/${pid}`;
    //     }
    //     res.redirect(url);
    // }

    gameStart = async ({game_id}: IGameParams, user: DecodedIdToken) => {
        // const user_uid = user.uid;
        // await dbs.GameLog.create({
        //     user_uid: uid,
        //     game_uid
        // });
        const pid = jwt.sign({
            game_id,
            user_uid: user?.uid,
            started_at: new Date().getTime(),
        }, 'KJf8y972hfk!#F', {
            algorithm: 'HS256',
            expiresIn: '6h',
            issuer: 'from the red',
        })

        return {
            pid
        }
    }


    gameOver = async ({ score, pid }: IGameParams, _user: DecodedIdToken) => {
        if ( !pid ) {
            throw CreateError(ErrorCodes.INVALID_PLAY);
        }

        let game_id: number;
        let user_uid: string;
        let playtime: number;
        try {
            const decoded: any = jwt.verify(pid, 'KJf8y972hfk!#F');
            game_id = decoded.game_id;
            user_uid = decoded.user_uid || null;
            playtime = new Date().getTime() - new Date(decoded.started_at).getTime();
        }
        catch (e) {
            throw CreateError(ErrorCodes.INVALID_PLAY);
        }

        MQ.send({
            topic: 'gameOver',
            messages: [{
                value: JSON.stringify({
                    user_uid,
                    game_id,
                    score,
                    pid,
                    playtime,
                }),
            }]
        })

        if ( !user_uid ) {
            return ;
        }

        return await dbs.UserGame.getTransaction(async (transaction: Transaction) => {
            const record = await dbs.UserGame.findOne({user_uid, game_id}, transaction);
            const previous_score = record? record.score : 0;
            const new_record = score > previous_score;

            if ( new_record ) {
                if ( record ) {
                    record.score = score;
                    await record.save({transaction});
                } else {
                    await dbs.UserGame.create({user_uid, game_id, score}, transaction);
                }
            }

            return {
                new_record
            }
        })
    }


    getGame = async ({pathname}: any, user: DecodedIdToken) => {
        // let game = await caches.game.getByPathname(pathname);
        // if ( !game ) {
        //     game = await dbs.Game.getInfo({ pathname });
        //     game = getGameData(game);
        //     caches.game.setByPathname(game);
        //     caches.game.setByPathname(ret, pathname);
        // }
        // return {
        //     game
        // };
        const user_uid = user? user.uid : '';
        const key = pathname + '_' + user_uid;
        let ret = await caches.game.getByPathname(key);
        if ( !ret ) {
            const game = await dbs.Game.getInfo({ pathname });
            const my_heart = await dbs.GameHeart.findOne({ game_id: game.id, user_uid });
            const my_emotions: any = { e1: false, e2: false, e3: false, e4: false, e5: false };
            const emotions = await dbs.UserGameEmotion.findAll({ game_id: game.id, user_uid });
            _.forEach(emotions, (obj) => {
                const e = obj.get({plain: true});
                my_emotions[e.emotion] = e.activated;
            })
            ret = {
                game: getGameData(game),
                my_heart: my_heart? my_heart.activated : false,
                my_emotions,
            }
            // 임시 주석
            // caches.game.setByPathname(ret, key);
        }
        // const game = await dbs.Game.getInfo({ pathname });
        // const ret = {
        //     game: getGameData(game),
        // }
        return ret;
    }

    getGameList = async ({ category, limit = 50, offset = 0, sort, dir }: IGameListParams, user: DecodedIdToken, { req }: IRoute) => {
        const query = JSON.stringify(req.query);
        let games = await caches.game.getList(query);
        if ( !games ) {
            const rows = await dbs.Game.getList({ category, limit, offset, sort, dir });
            games = _.map(rows, game => getGameData(game))

            // caches.game.setList(games, query);
        }

        return {
            games
        }
    }


    getHashTags = async ({ tag }: {tag: string}, user: DecodedIdToken) => {
        const tags = await dbs.Hashtag.getTagsLike(tag);

        return {
            tags: _.map(tags, (tag: any) => {
                return {
                    id: tag.id,
                    tag: tag.name,
                }
            })
        }
    }


    getHashTagById = async ({ id, limit = 50, offset = 0 }: {id: number, limit: number, offset: number}, user: DecodedIdToken) => {
        const ref = await dbs.Hashtag.getGamesById(id, {limit, offset});
        return {
            tag: ref.name,
            games: _.map(ref.refTags, ref => {
                const { game } = ref;
                return getGameData(game)
            })
        }
    }


    getGameListByHashtag = async (params: { tag: string, limit: number, offset: number }, user: DecodedIdToken) => {
        const { tag, limit = 50, offset = 0 } = params;
        const query = JSON.stringify(params);
        let games = await caches.hashtag.getGames(query)
        if ( !games ) {
            const record = await dbs.Hashtag.getGamesByTag(tag, { limit, offset });
            games = _.map(record.refTags, (r: any) => {
                return getGameData(r.game);
            })
            caches.hashtag.setGames(query, games);
        }
        return {
            games
        }
    }



    sampleTest = async ({}, user: {}) => {
        const data = await MQ.send({
            topic: 'gameOver',
            messages: [{
                value: JSON.stringify({
                    key1: 'value1',
                    key2: 'value2',
                }),
            }]
        });
        console.log(data)
        console.log('sent')
    }

    cacheTest = async () => {
        caches.hashtag.addTag('arcade', 'papa', JSON.stringify({
            uid: 'papa123',
            title: 'basketball papa',
        }))
        caches.hashtag.addTag(['#arcade', 'puzzle'], 'shark', JSON.stringify({
            uid: 'shark000',
            title: 'shark frenzy',
        }))
    }
    cacheTest2 = async ({k}: any) => {
        const records = await caches.hashtag.findAll(k);
        return {
            records: _.map(records, JSON.parse)
        };
    }


    tagTest = async (params: any, user: DecodedIdToken) => {
        if ( !dbs.BadWords.areOk(params) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }
    }

    tagTest2 = async ({ tag }: any) => {
        const r = await dbs.Hashtag.getGamesByTagLike(tag);

        return {
            tag,
            games: _.map(r?.refTags, (ref: any) => getGameData(ref.game))
        }
    }
}


export default new GameController()
