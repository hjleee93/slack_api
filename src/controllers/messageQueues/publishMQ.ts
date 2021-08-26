import { SrvMQ } from './_srvMQ';
import { Message } from 'kafka-node';
import { dbs } from '../../commons/globals';
import { ePubType } from '../../commons/enums';
import { CreateError, ErrorCodes } from '../../commons/errorCodes';
import { Transaction } from 'sequelize';


class PublishMQ extends SrvMQ {
    async gameOver(message: Message) {
        const { pid, game_id, }: any = message;

        if ( pid ) {
            const pu = await dbs.User.findOne({ uid: pid });
            // const game = await dbs.Game.findOne({ id: game_id });
            // const { id: game_id } = game;

            await dbs.UserPublishing.updateCount({ user_id: pu.id, game_id, pub_type: ePubType.PubGamePlay });
            await dbs.GeneratedPointsLog.createPoints({ user_id: pu.id, game_id, pub_type: ePubType.PubGamePlay });
        }
    }

    async pub_PlayGame(message: Message) {
        const { pathname, user_uid }: any = message;
        const game = await dbs.Game.findOne({ title: pathname });
        if ( !game ) {
            throw CreateError(ErrorCodes.INVALID_GAME_ID);
        }

        return dbs.User.getTransaction(async (transaction: Transaction) => {
            const user = await dbs.User.findOne({ uid: user_uid }, transaction);
            if ( !user ) {
                throw CreateError(ErrorCodes.INVALID_USER_UID);
            }

            await dbs.UserPublishing.updateCount({ user_id: user.id, game_id: game.id, pub_type: ePubType.Open }, transaction);
        })
    }
}


export default new PublishMQ()
