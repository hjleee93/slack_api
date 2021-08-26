import { RouterLike } from 'express-ws';
import TcpController from '../controllers/tcp/tcpController';


export default (router: RouterLike) => {
    router.ws(`/tcp/:pathname`,         TcpController.connected);
    router.ws(`/tcp/:pathname/:num`,    TcpController.connected);
}
