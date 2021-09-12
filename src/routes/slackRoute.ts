import {Request, Response, Router} from 'express';
import slackController from "../controllers/slackController";
import convert from "../controllers/_convert";

export default (router: Router) => {

    router.post('/slack/events', slackController.event);
    router.post('/slack/actions', slackController.actions);

}
