import Server from './server';
import { IMessageQueueOptions, IServerOptions } from '../commons/interfaces';
import mq from '../controllers/messageQueues/publishMQ'


class PublishingServer extends Server {
    protected afterStart = async () => {
        const options: IMessageQueueOptions = {
            groupId: 'pub-server',
            autoCommit: true,
            // addTopics: mq.addTopics(),
            addGateways: mq.addGateway(),
            eachMessage: mq.eachMessage.bind(mq),
        }
        await this.setMessageQueue(options)
    }
}


export default PublishingServer
