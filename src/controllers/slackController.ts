import slackManager from "../services/slackManager";

class slackController {

    events = async (params: any) => {
        const { token, challenge, type, event } = params;
        return await slackManager.events(params)
    }

    actions = async ({payload}: any) => {
       await slackManager.actions(payload)
    }


}

export default new slackController;