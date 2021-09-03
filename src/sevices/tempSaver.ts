import blockManager from "./blockManager";
import * as moment from "moment-timezone";

class TempSaver {
    private obj: any [] = [];

    createData(user_id: string) {
        this.obj.push(
            {
                id: user_id,
                roomNumber: blockManager.meetingRoomArr[0],
                title: '',
                description: '',
                date: moment().format('yyyy-MM-DD'),
                duration: 30,
                start: '',
                end: '',
                members: []

            })
        return this.obj;
    }

    deleteForm(user_id: any) {
        this.obj.filter((form: any, index: number) => {
            if (form.id === user_id) {
                this.obj.splice(index, 1);
            }
        })
        console.log(this.obj)
    }

    meetingForm(user_id: any) {
        const form = this.obj.filter((form: any) => {
            if (form.id === user_id) {
                return form;
            }
        })
        return form[0];
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

    updateRoom(user_id: any, roomNumber: string) {
        this.obj.filter((form: any) => {
            if (form.id === user_id) {
                form.roomNumber = roomNumber;
            }
        })
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