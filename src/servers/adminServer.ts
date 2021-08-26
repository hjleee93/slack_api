import Server from "./server";
import {Router} from "express";
import adminRoute from '../routes/adminRoute';
import { IServerOptions } from '../commons/interfaces';

class AdminServer extends Server {
    initialize = async (options: IServerOptions) => {
        this.options = options;

        this.setExpress(options);
        await this.setRDB();
    }

    routes(app: Router) {
        super.routes(app);

        adminRoute(app);
    }
}


export default AdminServer;
