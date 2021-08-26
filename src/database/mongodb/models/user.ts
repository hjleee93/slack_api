import Collection from '../collection';
import { Db } from 'mongodb';


class UserCollection extends Collection {
    initialize () {
        this.name = 'user2';
        this.attributes = {
            uid:            { type: String, index: true, unique: true },
            activated:      { type: Boolean },
            banned:         { type: Boolean },
            name:           { type: String },
            channel_id:     { type: String },
            picture:        { type: String },
            provider:       { type: String },
            email:          { type: String },
            email_verified: { type: Boolean },
            fcm_token:      { type: String },
            is_developer:   { type: Boolean },
            last_log_in:    { type: Date },
            profile: {
                level:          { type: Number },
                exp:            { type: Number },
                state_msg:      { type: String },
                description:    { type: String },
                url_banner:     { type: String },
            },
            deleted_at:     { type: Date },
        }
    }

    async afterSync(): Promise<any> {
    }
}


export default new UserCollection()
