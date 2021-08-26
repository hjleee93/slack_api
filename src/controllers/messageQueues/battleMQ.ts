import { SrvMQ } from './_srvMQ';
import { Message } from 'kafka-node';
import { dbs } from '../../commons/globals';
import { Transaction } from 'sequelize';


class BattleMQ extends SrvMQ {
    async battleGameStart (message: Message) {
        const { battle_uid, battle_user_id }: any = message;

        // dbs.BattleLog.create({
        //     battle_uid,
        //     battle_user_id,
        //     score: -1
        // });
    }


    async battle_gameOver (message: Message) {
        const { battle_uid, user_uid, secret_id, best_score, score, new_record }: any = message;

        await dbs.BattleLog.updateScore({ id: secret_id, score });

        // if ( new_record ) {
        //     await dbs.BattleUser.updateBestScore({ battle_uid, user_uid, best_score: score });
        // }

        // timeline
    }
}


export default new BattleMQ()
