import { dbs } from '../commons/globals';
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import { INotifyParams, INotify } from '../controllers/_interfaces';
import admin from 'firebase-admin';

class NotifyService {

    async notify({user_uid, type, data}: INotifyParams) {
        const user = await dbs.User.getSetting({uid: user_uid});
        if ( !user ) {
            throw CreateError(ErrorCodes.INVALID_USER_UID);
        }
        if ( !user.fcm_token ) {
             // throw CreateError(ErrorCodes.INVALID_FCM_TOKEN);
            return;
        }

        if ( user.notify[type] ) {
            await this.send({
                token: user.fcm_token,
                data: {
                    type: type.toString(),
                    ...data
                }
            });
        }
    }


    async send({ topic, token, data }: INotify) {
        if ( topic && token ) {
            throw CreateError(ErrorCodes.INVALID_PARAMS);
        }

        const message: any = {
            // notification: {
            //     title,
            //     body,
            //     imageUrl: 'https://zemini.s3.ap-northeast-2.amazonaws.com/companies/FTR_Symbol.png'
            // },
            // webpush: {},
            fcmOptions: {
                analyticsLabel: ''
            },
            topic: topic? topic : undefined,
            token: token? token : undefined,
            data,
        };

        return await admin.messaging().send(message);
    }


    async broadcastMessage() {

    }
}


export default new NotifyService()