import * as _ from 'lodash';
import * as ws from 'ws';


export function SendPacket(ws: ws, head: string, body: object = {}) {
    if( ws && ws.readyState === 1 ) {
        ws.send(JSON.stringify({
            head,
            body
        }))
    }
}


export function Broadcast(members: object, ws: ws, head: string, body: object = {}) {
    _.forEach(members, (_ws: ws) => {
        SendPacket(_ws, head, body);
    })
}
