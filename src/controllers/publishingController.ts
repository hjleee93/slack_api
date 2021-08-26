import { dbs } from '../commons/globals';
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import * as _ from 'lodash';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;


class PublishingController {
    getList = async ({}, { uid }: DecodedIdToken) => {
        const user = await dbs.User.getPublishing({ uid });
        if ( !user ) {
            throw CreateError(ErrorCodes.INVALID_USER_UID)
        }

        const { publishing } = user;
        return {
            publishing: _.map(publishing, (obj: any) => {
                const { game } = obj;
                return {
                    game_id: game.id,
                    title: game.title,
                    count_open: obj.count_open,
                }
            })
        }
    }
}


export default new PublishingController()
