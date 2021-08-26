import { Router } from 'express'
import Server from './server'
import adminRoute from '../routes/adminRoute'
import contentRoute from '../routes/contentRoute';
import userRoute from '../routes/userRoute';
import gameRoute from "../routes/gameRoute";
import launcherRoute from '../routes/launcherRoute';
import supportRoute from '../routes/supportRoute';
import tcpRoute from '../routes/tcpRoute';
import { IMessageQueueOptions, IServerOptions } from '../commons/interfaces';
import mq from '../controllers/messageQueues/apiMQ';
import redirectRoute from '../routes/redirectRoute';


class ApiServer extends Server {

    initialize = async (options: IServerOptions) => {
        this.options = options;

        this.setFirebase();
        this.setExpress(options);
        await this.setRDB();
        await this.setMDB();

        // this.setEJS();
        this.setSwagger();
        this.setGraphQL();
    }

    routes(app: Router) {
        super.routes(app);

        adminRoute(app);
        userRoute(app);
        contentRoute(app);
        gameRoute(app);
        launcherRoute(app);
        supportRoute(app);

        redirectRoute(app);

        // tcpRoute(app);

        // scheduleService.start()
        // ExchangeManager.start()
    }

    protected afterStart = async (): Promise<void> => {
        const options: IMessageQueueOptions = {
            groupId: 'api-server',
            autoCommit: true,
            // addTopics: mq.addTopics(),
            addGateways: mq.addGateway(),
            eachMessage: mq.eachMessage.bind(mq),
        }
        await this.setMessageQueue(options);
    }
}


export default ApiServer;

