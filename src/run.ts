import APIServer from './servers/apiServer'
import {IServerOptions} from './commons/interfaces'
import cfgOption from '../config/opt';
import {App} from '@slack/bolt';
import slack from "../config/slack";

(async () => {
    const options: IServerOptions = {
        tcp: false,
        port: cfgOption.Server.http.port,
        static_path: [
            {path: '/', route: 'public'},
        ],
        rdb: true,
        mdb: true,

    }
    const apiServer = new APIServer();
    const appSlack = new App({
        signingSecret: slack.signingSecret,
        token: slack.token,
    });
    await apiServer.initialize2(options);
    await apiServer.start()

    await appSlack.start(3000);
})();
