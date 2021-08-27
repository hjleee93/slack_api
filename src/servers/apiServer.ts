import { Router } from 'express'
import Server from './server'
import slackRoute from '../routes/slackRoute'
import { IMessageQueueOptions, IServerOptions } from '../commons/interfaces';


class ApiServer extends Server {

    initialize = async (options: IServerOptions) => {
        this.options = options;

        this.setExpress(options);
        await this.setRDB();

    }

    routes(app: Router) {
        super.routes(app);

        slackRoute(app);
    }


}


export default ApiServer;

