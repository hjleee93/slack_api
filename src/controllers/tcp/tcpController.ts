import WSController, { zWS } from './wsController';
import tcpRoomManager from '../../services/tcpRoomManager';
import { SendPacket } from '../../services/packetService';
import { logger } from '../../commons/logger';


class TcpController extends WSController {
    protected onClosed = (ws: zWS): void => {
        tcpRoomManager.leave(ws);
    }

    protected onConnected = (ws: zWS): void => {
        logger.debug(`[zWS] connected pathname:`, ws.gameData?.game_id);
        SendPacket(ws, 'open_ok', { uid: ws.uid });
    }

    protected onMessage = (ws: zWS, message: string): void => {
        logger.debug(message);
        const packet = JSON.parse(message);
        switch ( packet.head ) {
            case 'enter':
                tcpRoomManager.enter(ws);
                break;

            case 'leave':
                tcpRoomManager.leave(ws);
                break;

            default:
                tcpRoomManager.play(ws, packet.body);
        }
    }

}


export default new TcpController()
