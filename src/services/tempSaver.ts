import blockManager from "./blockManager";
import * as _ from 'lodash';
import * as moment from "moment-timezone";
import {dbs} from "../commons/globals";

class TempSaver {
    private obj:any = {};

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
    async createEditDate(data: any, user_id: string) {
        const memberList = await dbs.Participant.findAllUser(data.id)

        const members = _.map(memberList, (list:any)=>{
            return list.user_id
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
        // this.obj.filter((form: any, index: number) => {
        //     if (form.id === user_id) {
        //         this.obj.splice(index, 1);
        //     }
        // })
        //
        delete this.obj[user_id]
    }

    meetingForm(user_id: any) {
        // const form = this.obj.filter((form: any) => {
        //     if (form.id === user_id) {
        //         return form;
        //     }
        // })
        //
        //
        // console.log(form)
        return this.obj[user_id];
    }

    updateDate(user_id: any, date: any) {
       const form = this.obj.filter((form: any) => {
            if (form.id === user_id) {
                form.date = date;
                return form
            }
        })
        return form[0]

    }

    updateTitle(user_id: any, title: string) {
        this.obj.filter((form: any) => {
            if (form.id === user_id) {
                form.title = title;
            }
        })
    }

    updateRoom(user_id: any, room_number: string) {
        const form =    this.obj.some((form: any) => {
            if (form.id === user_id) {
                form.room_number = room_number;
                return form;
            }
        })
        return form;
    }

    updateDesc(user_id: any, desc: string) {
        this.obj.filter((form: any) => {
            if (form.id === user_id) {
                form.description = desc;
            }
        })
    }

    updateMembers(user_id: any, members: any[]) {
        this.obj.filter((form: any) => {
            if (form.id === user_id) {
                form.members = members;
            }
        })
    }

    updateTime(user_id: any, time: string) {
        this.obj.filter((form: any) => {
            if (form.id === user_id) {
                form.start = time.split('-')[0];
                form.end = time.split('-')[1];
            }
        })
    }

    updateDuration(user_id: any, duration: number) {
        const form = this.obj.filter((form: any) => {
            if (form.id === user_id) {
                form.duration = duration
                return form;
            }
        })
        return form[0];

    }
}


export default new TempSaver()