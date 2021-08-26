import { IGameParams } from './_interfaces';
import { Op, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../commons/globals';
import * as _ from 'lodash';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;


class RankingController {
    getGlobalRanking = async ({ game_id, limit = 50, offset = 0 }: IGameParams, user: DecodedIdToken) => {
        let score, rank;

        // const userRecord = await dbs.User.findOne({ uid });
        // const game = await dbs.Game.findOne({ uid: game_uid });
        // if ( !game ) {
        //     throw CreateError(ErrorCodes.INVALID_GAME_UID);
        // }
        //
        // const user_id = userRecord.id;
        // const game_id = game.id;

        if ( user && user.uid ) {
            const gameRecord = await dbs.UserGame.findOne({game_id, user_uid: user.uid});
            if ( gameRecord ) {
                score = gameRecord.score;
                rank = await dbs.UserGame.model.count({
                    where: {
                        game_id,
                        score: {
                            [Op.gt]: score
                        },
                    },
                    order: [['score', 'desc']],
                });
                rank += 1;
            }
        }

        const { count, rows } = await dbs.UserGame.model.findAndCountAll({
            where: { game_id },
            include: [{
                model: dbs.User.model,
                required: true,
            }],
            attributes: {
                include: [
                    [Sequelize.literal('(RANK() OVER (ORDER BY score DESC))'), 'rank'],
                ],
            },
            limit,
            offset
        });

        return {
            count,
            rank,
            score,
            list: _.map(rows, (record: any) => {
                const { rank, user, score } = record.get({plain: true});
                return {
                    rank,
                    user_uid: user.uid,
                    name: user.name,
                    picture: user.picture,
                    channel_id: user.channel_id,
                    score,
                }
            })
        }
    }


    getFollowingRanking = async ({game_id, limit = 50, offset = 0}: IGameParams, {uid: user_uid}: DecodedIdToken, transaction?: Transaction) => {
        let score, rank;

        const gameRecord = await dbs.UserGame.findOne({game_id, user_uid}, transaction);
        if( gameRecord ) {
            score = gameRecord.score;
            rank = await dbs.Follow.model.count({
                where: { user_uid },
                include: [{
                    model: dbs.UserGame.model,
                    as: 'gameRecord',
                    where: {
                        game_id,
                        score: {
                            [Op.gt]: score,
                        }
                    }
                }],
            })
            rank += 1;
        }

        const { count, rows } = await dbs.Follow.model.findAndCountAll({
            where: { user_uid },
            include: [{
                model: dbs.UserGame.model,
                as: 'gameRecord',
                where: { game_id },
            }, {
                model: dbs.User.model,
                as: 'target',
                required: true,
            }],
            attributes: {
                include: [
                    [Sequelize.literal('(RANK() OVER (ORDER BY gameRecord.score DESC))'), 'rank'],
                ]
            },
            limit, offset, transaction
        });

        return {
            count,
            rank,
            score,
            list: _.map(rows, (record: any) => {
                const { rank, target, gameRecord } = record.get({plain: true});
                return {
                    rank,
                    user_uid: target.uid,
                    name: target.name,
                    picture: target.picture,
                    score: gameRecord.score,
                }
            })
        }
    }
}


export default new RankingController()
