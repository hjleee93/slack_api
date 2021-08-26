import { SrvMQ } from './_srvMQ';
import { Message } from 'kafka-node';
import { dbs } from '../../commons/globals';


class LogMQ extends SrvMQ {
    async gameOver(message: string) {
        const { user_uid, game_id, score, playtime }: any = JSON.parse(message);

        // dbs.GameLog.create({ user_uid, game_id, score, playtime });
    }
}


export default new LogMQ()
