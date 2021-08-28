"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const slackController_1 = require("../controllers/slackController");
exports.default = (router) => {
    router.post('/slack/events', slackController_1.default.event);
    router.post('/slack/actions', slackController_1.default.actions);
};
//# sourceMappingURL=slackRoute.js.map