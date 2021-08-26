import Server from './server';
import { IMessageQueueOptions } from '../commons/interfaces';
import mq from '../controllers/messageQueues/logMQ';

class LogServer extends Server {
    protected afterStart = async () => {
        const options: IMessageQueueOptions = {
            groupId: 'log-server',
            autoCommit: false,
            // addTopics: mq.addTopics(),
            addGateways: mq.addGateway(),
            eachMessage: mq.eachMessage.bind(mq),
        }
        await this.setMessageQueue(options);
    }
}


export default LogServer
