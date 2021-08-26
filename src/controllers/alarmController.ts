import * as _ from 'lodash';
import { dbs } from "../commons/globals";
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;


class AlarmController {

    getList = async ({limit = 50, offset = 0}, user: DecodedIdToken) => {
        const alarms = await dbs.Alarm.getList({ user_uid: user.uid, limit, offset });
        // const games = await gameCache.get();
        const games = await dbs.Game.findAll({});

        return {
            alarms: _.map(alarms, (alarm: any) => {
                const extra = JSON.parse(alarm.extra);
                if (extra.game_id) {
                    extra.game = _.find(games, (g: any) => g.uid === extra.game_id);
                }

                return {
                    id: alarm.id,
                    type: alarm.type,
                    extra,
                    created_at: alarm.created_at,
                    target: alarm.target,
                }
            })
        }
    }
}


export default new AlarmController()
