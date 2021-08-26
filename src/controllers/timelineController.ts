import * as _ from 'lodash'
import * as uniqid from 'uniqid';
import { ITimelineParams } from "./_interfaces";
import { dbs } from "../commons/globals";
import { Transaction } from "sequelize";
import { eTimeline } from "../commons/enums";
import { CreateError, ErrorCodes } from "../commons/errorCodes";
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;


class TimelineController {

    async getList({user_uid, limit = 50, offset = 0}: ITimelineParams, user: DecodedIdToken) {
        user_uid = user_uid || user.uid;

        const userRecord = await dbs.User.findOne({uid: user_uid});
        if ( !userRecord ) {
            throw CreateError(ErrorCodes.INVALID_USER_UID);
        }
        const user_id = userRecord.id;
        const timeline = await dbs.Timeline.getList({user_id, limit, offset});

        // const games = await gameCache.get();
        return {
            timeline: _.map(timeline, (t: any) => {
                return {
                    id: t.id,
                    type: t.type,
                    extra: JSON.parse(t.extra),
                    created_at: t.created_at,
                    user: t.user,
                    // game: _.find(games, (g: any) => g.game_uid === t.game_uid),
                    game: t.game,
                }
            })
        }
    }


    async doPosting({type, score, follower_ids, game_id, user_id, achievement_id, battle_id}: ITimelineParams, user: DecodedIdToken, transaction?: Transaction) {
        const uid = uniqid();
        let extra;
        switch ( type ) {
            case eTimeline.PR:          extra = JSON.stringify({ score }); break;
            case eTimeline.PRW:         extra = JSON.stringify({ score, follower_ids }); break;
            case eTimeline.Share:       extra = JSON.stringify({ game_id }); break;
            case eTimeline.Achievement: extra = JSON.stringify({ achievement_id }); break;
            case eTimeline.Battle_1st:  extra = JSON.stringify({ battle_id }); break;
        }

        const posting = await dbs.Timeline.create({
            uid,
            user_id,
            game_id,
            type,
            extra
        }, transaction);

        return {
            posting: {
                id: posting.id,
                uid,
                type: posting.type,
            }
        }
    }

    async deletePosting({uid}: ITimelineParams, user: DecodedIdToken) {
        return dbs.Timeline.getTransaction(async (transaction: Transaction) => {
            const posting = await dbs.Timeline.findOne({ uid }, transaction);
            if ( !posting ) {
                throw CreateError(ErrorCodes.INVALID_TIMELINE_USER_UID);
            }
            if ( posting.user_uid !== user.uid ) {
                throw CreateError(ErrorCodes.INVALID_TIMELINE_USER_UID);
            }

            await posting.destroy({transaction});
        })
    }

}

export default new TimelineController()

export function checkTimeline() {

}
