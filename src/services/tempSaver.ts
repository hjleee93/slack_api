import blockManager from "./blockManager";
import * as _ from 'lodash';
import * as moment from "moment-timezone";
import {dbs} from "../commons/globals";

class TempSaver {
    private obj: any = {};

    createData(user_id: string) {
        this.obj = {
            [user_id]:
                {
                    room_number: blockManager.meetingRoomArr[0],
                    title: '',
                    description: '',
                    date: moment().format('yyyy-MM-DD'),
                    duration: 30,
                    start: '',
                    end: '',
                    members: []

                }
        }
        return this.obj;
    }

    getTempForm(user_id: any){
        const result = this.obj[user_id]
        return result;
    }

    async createEditData(data: any, user_id: string) {
        const memberList = await dbs.Participant.findAllUser(data.id)

        const members = _.map(memberList, (list: any) => {
            return {
                user_id: list.user_id,
                user_name: list.user_name
            }
        })

        this.obj[user_id] =
            {
                room_number: data.room_number,
                title: data.title,
                description: data.description,
                date: data.date,
                duration: moment.duration(moment(data.end, 'HH:mm').diff(moment(data.start, 'HH:mm'))).asMinutes(),
                start: data.start,
                end: data.end,
                members: members
            }

        return this.obj;
    }

    deleteForm(user_id: any) {
        delete this.obj[user_id]
    }

    meetingForm(user_id: any) {
        return this.obj[user_id];
    }

    updateDate(user_id: any, date: any) {
        this.obj[user_id].date = date
        return this.obj[user_id]

    }

    updateTitle(user_id: any, title: string) {
        this.obj[user_id].title = title
    }

    updateRoom(user_id: any, room_number: string) {
        this.obj[user_id].room_number = room_number;
        return this.obj[user_id];
    }

    updateDesc(user_id: any, description: string) {
        this.obj[user_id].description = description
    }

    updateMembers(user_id: any, members: any[]) {
        this.obj[user_id].members = members

    }

    updateTime(user_id: any, time: string) {
        this.obj[user_id].start = time.split('-')[0];
        this.obj[user_id].end = time.split('-')[1];
    }

    updateDuration(user_id: any, duration: number) {
        this.obj[user_id].duration = duration

        return this.obj[user_id];

    }
}


export default new TempSaver()