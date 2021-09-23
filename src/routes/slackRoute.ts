import {Request, Response, Router} from 'express';
import slackController from "../controllers/slackController";
import convert from "../controllers/_convert";

export default (router: Router) => {

    router.post('/slack/events', convert(slackController.events));
    router.post('/slack/actions', convert(slackController.actions));

    router.post('/slack/meeting_list', convert(slackController.meeting_list));
    router.post('/slack/my_meetings', convert(slackController.my_meetings));
    router.post('/slack/today_meetings', convert(slackController.today_meetings));
    router.post('/slack/meeting_booking', convert(slackController.meeting_booking));
}

