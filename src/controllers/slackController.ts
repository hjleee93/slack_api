import slackManager from "../services/slackManager";

class slackController {

    events = async (params: any) => {
        const {token, challenge, type, event} = params;
        return await slackManager.events(params)
    }

    actions = async ({payload}: any) => {
        return await slackManager.actions(payload)
    }

    book = async (params: any) => {
        return await slackManager.slashCommand(params)

    }


}

export default new slackController;