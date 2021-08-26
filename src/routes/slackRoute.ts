import {Request, Response, Router} from 'express';
import slackController from "../controllers/slackController";

export default (router: Router) => {

    router.post('/slack/events', slackController.event)
    router.post('/slack/actions', slackController.actions)

}
