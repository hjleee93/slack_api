import { ISocialMedia } from './_interfaces';
import { dbs } from '../commons/globals';
import { Sequelize, Transaction } from 'sequelize';
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import NotifyService from '../services/notifyService';
import { eAlarm, eNotify } from '../commons/enums';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;


class SocialMediaController {
    follow = async ({target_uid}: ISocialMedia, user: DecodedIdToken) => {
        return dbs.Follow.getTransaction(async (transaction: Transaction) => {
            const user_uid = user.uid;
            const { user_id, target_id } = await this.getIds({ user_uid, target_uid }, transaction);

            await dbs.Follow.follow({ user_id, target_id }, transaction);

            await dbs.UserProfile.update({ following_cnt: Sequelize.literal('following_cnt + 1') }, { user_id }, transaction);
            await dbs.UserProfile.update({ followers_cnt: Sequelize.literal('followers_cnt + 1') }, { user_id: target_id }, transaction);

            await dbs.Alarm.create({user_uid: target_uid, target_uid: user_uid, type: eAlarm.Follow, extra: { target_uid }}, transaction);
            await NotifyService.notify({user_uid: target_uid, type: eNotify.Follow, data: { target_uid }});
        });
    }


    unFollow = ({target_uid}: ISocialMedia, user: DecodedIdToken) => {
        return dbs.Follow.getTransaction(async (transaction: Transaction) => {
            const user_uid = user.uid;
            const { user_id, target_id } = await this.getIds({ user_uid, target_uid }, transaction);

            await dbs.Follow.unFollow({ user_id, target_id }, transaction);

            await dbs.UserProfile.update({ following_cnt: Sequelize.literal('following_cnt - 1') }, { user_id }, transaction);
            await dbs.UserProfile.update({ followers_cnt: Sequelize.literal('followers_cnt - 1') }, { user_id: target_id }, transaction);
        })
    }


    private getIds = async ({ user_uid, target_uid }: ISocialMedia, transaction?: Transaction) => {
        if ( user_uid === target_uid ) {
            throw CreateError(ErrorCodes.INVALID_USER_UID);
        }

        const userRecord = await dbs.User.findOne({ uid: user_uid });
        const targetRecord = await dbs.User.findOne({ uid: target_uid });
        if ( !targetRecord ) {
            throw CreateError(ErrorCodes.INVALID_USER_UID);
        }

        return {
            user_id: userRecord.id,
            target_id: targetRecord.id
        }
    }


    async following({user_uid}: ISocialMedia, user: DecodedIdToken) {
        user_uid = user_uid || user.uid;
        const userRecord = await dbs.User.findOne({ uid: user_uid });
        const user_id = userRecord.id;
        const records = await dbs.Follow.following({ user_id });
        return {
            following: records.map((record: any) => {
                return {
                    uid: record.target.uid,
                    name: record.target.name,
                    picture: record.target.picture
                }
            })
        }
    }

    async followers({user_uid}: ISocialMedia, user: DecodedIdToken) {
        user_uid = user_uid || user.uid;
        const userRecord = await dbs.User.findOne({ uid: user_uid });
        const user_id = userRecord.id;
        const records = await dbs.Follow.followers({ user_id });
        return {
            followers: records.map((record: any) => {
                return {
                    uid: record.user.uid,
                    name: record.user.name,
                    picture: record.user.picture,
                    channel_id: record.user.channel_id,
                }
            })
        }
    }
}


export default new SocialMediaController()
