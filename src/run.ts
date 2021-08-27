import APIServer from './servers/apiServer'
import { IServerOptions } from './commons/interfaces'
import cfgOption from '../config/opt';


(async () => {
    const options: IServerOptions = {
        tcp: false,
        port: cfgOption.Server.http.port,
        static_path: [
            { path: '/', route: 'public' },
        ],
        firebase: false,
        rdb: true,
        mdb: false,
        swagger: false,
        graphql: false,
    }
    const apiServer = new APIServer();
    await apiServer.initialize2(options);
    await apiServer.start()
})();
