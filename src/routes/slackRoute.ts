import {Request, Response, Router} from 'express';
import slackController from "../controllers/slackController";
import convert from "../controllers/_convert";

export default (router: Router) => {

    router.post('/slack/events', convert(slackController.events));
    router.post('/slack/actions', convert(slackController.actions));

    router.post('/slack/book', convert(slackController.book));

}
