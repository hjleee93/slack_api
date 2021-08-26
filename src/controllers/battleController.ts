import * as uniqid from 'uniqid';
import { dbs } from '../commons/globals';
import { IBattleParams, IBattlePlayParams } from './_interfaces';
import { Transaction } from 'sequelize';
import { signJWT, verifyJWT } from '../commons/utils';
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import { Producer } from '../services/kafkaService';
import MQ from '../services/messageQueueService';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;


class BattleController {
    getBattleList = async () => {

    }

    getInfo = async ({ battle_uid }: any) => {
        const battle = await dbs.Battle.get({ battle_uid });
        const { user: host, game } = battle;

        return {
            battle_uid: battle.uid,
            host,
            game,
            battle: {
                end_at: battle.end_at,
            },
        }
    }


    hostBattle = async ({ game_id, is_infinity }: any, user: DecodedIdToken) => {
        const uid = uniqid();

        await dbs.Battle.create({
            uid,
            user_uid: user.uid,
            game_id,
            // end_at: is_infinity ? null : new Date()
            end_at: Date.now() + (1000 * 60 * 10)
        });

        return {
            battle_uid: uid,
            share_url: `http://localhost:8280/battle/${uid}`
        }
    }


    gameStart = async ({ battle_uid, battle_key }: IBattleParams, user: DecodedIdToken) => {
        const battle = await dbs.Battle.findOne({uid: battle_uid});
        if ( !battle ) {
            throw CreateError(ErrorCodes.INVALID_BATTLE);
        }
        if ( new Date(battle.end_at) < new Date() ) {
            throw CreateError(ErrorCodes.BATTLE_OVER);
        }
        // battle.user_count += 1;
        // await battle.save({transaction});


        let decoded = battle_key && battle_key !== ''? verifyJWT(battle_key) : {
            user_uid: uniqid(),
            best_score: -1
        };
        let user_uid = user? user.uid : decoded.user_uid;


        const { record: battle_user, isNew } = await dbs.BattleUser.findOrCreate({
            battle_uid,
            user_uid,
        }, undefined);
        decoded.best_score = battle_user.best_score;


        const record = await dbs.BattleLog.create({
            battle_uid,
            battle_user_id: battle_user.id,
            score: -1
        });


        const new_battle_key = signJWT({
            uid: battle_uid,
            game_id: battle.game_id,
            user_uid,
            secret_id: record.id,
            best_score: decoded.best_score,
        }, '10m');


        return {
            battle_key: new_battle_key,
            user_uid
        }
    }


    gameOver = async ({ battle_key, score }: IBattlePlayParams, user: DecodedIdToken) => {
        const decoded = verifyJWT(battle_key);
        const { uid: battle_uid, game_id, user_uid, secret_id, best_score } = decoded;

        const new_record = score > best_score;
        if ( new_record ) {
            await dbs.BattleUser.updateBestScore({ battle_uid, user_uid, best_score: score });
        }

        // MQ.send({
        //     topic: 'battle_gameOver',
        //     messages: [{
        //         value: JSON.stringify({
        //             battle_uid,
        //             user_uid,
        //             secret_id,
        //             best_score,
        //             score,
        //             new_record,
        //         })
        //     }]
        // })
        MQ.send({
            topic: 'gameOver',
            messages: [{
                value: JSON.stringify({
                    user_uid,
                    game_id,
                    score,
                    battle_uid,
                }),
            }]
        })

        return {
            new_record
        }
    }


    updateUserName = async ({ battle_key, name }: IBattlePlayParams, user: DecodedIdToken) => {
        // 불량 단어 색출
        if ( !!name && !await dbs.ForbiddenWords.isOk(name) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }

        const decoded = verifyJWT(battle_key);
        const { uid: battle_uid, game_id, user_uid, secret_id, best_score } = decoded;

        await dbs.BattleUser.updateUserName({ battle_uid, user_uid, name})
    }



    getRanking = async ({ battle_uid }: IBattlePlayParams, user: DecodedIdToken) => {
        const ranking = await dbs.BattleUser.getRanking({ battle_uid });
        return {
            ranking
        }
    }
}

export default new BattleController()
