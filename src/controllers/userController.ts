import axios from "axios";
import qs from "qs";

import slackConfig from '../../config/slack';

class userController {

    async getUserInfo(user_id: string) {
        return await axios.get('https://slack.com/api/users.info', {
            headers: {Authorization:`Bearer ${slackConfig.token}`},
            params: {
                user: user_id
            }
        })

    }
}


export default new userController;