import { dbs } from '../commons/globals';
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import { ePubType } from '../commons/enums';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;


interface IAdControlParams {
    pathname: string,
    pid?: string,
}


class AdController {
    async onRewardedVideoCompleted ({ pathname, pid }: IAdControlParams, user: DecodedIdToken) {
        const game = await dbs.Game.findOne({ title: pathname });
        if ( !game ) {
            throw CreateError(ErrorCodes.INVALID_GAME_ID);
        }

        const { id: game_id, developer } = game;
        if ( developer ) {
            const user_id = developer;
            await dbs.GeneratedPointsLog.createAD({ user_id, game_id });
        }

        if ( pid ) {
            const pu = await dbs.User.findOne({ uid: pid });
            await dbs.UserPublishing.updateCount({ user_id: pu.id, game_id, pub_type: ePubType.AD });
            await dbs.GeneratedPointsLog.createPoints({ user_id: pu.id, game_id, pub_type: ePubType.AD });
        }
    }
}


export default new AdController()
