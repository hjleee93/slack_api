import Server from "./server";
import {Router} from "express";
import userRoute from '../routes/userRoute';
import studioRoute from '../routes/studioRoute';
import { IServerOptions } from '../commons/interfaces';
import { dbs } from '../commons/globals';
import { IZempieClaims } from '../controllers/_interfaces';
import admin from 'firebase-admin';
import { updateZempieClaims } from '../commons/utils';


class StudioServer extends Server {
    initialize = async (options: IServerOptions) => {
        this.options = options;

        this.setExpress(options);
        this.setFirebase();
        await this.setRDB();
        await this.setMDB();

        // await this.setDeveloper();
    }

    routes(app: Router) {
        super.routes(app);

        // adminRoute(app);
        userRoute(app);
        studioRoute(app);
        // contentRoute(app);
        // gameRoute(app);
    }

    async setDeveloper() {
        const developers = await dbs.User.findAll({ is_developer: true });
        for ( let i = 0; i < developers.length; i++ ) {
            const user = developers[i];
            const userClaim = await dbs.UserClaim.getZempieClaim(user.id, user.uid);
            const claim: IZempieClaims = JSON.parse(userClaim.data);
            claim.zempie.is_developer = true;
            userClaim.data = claim;
            await userClaim.save();
            try {
                await admin.auth().setCustomUserClaims(userClaim.user_uid, claim);
                console.log(claim);
            }
            catch (e) {
                console.error(e.message);
            }

        }
    }
}


export default StudioServer;
