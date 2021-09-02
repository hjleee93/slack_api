import * as moment from "moment-timezone";
import * as _ from "lodash";
import blockManager from "./blockManager";
import {dbs} from "../commons/globals";

class TimeManager {

    async timeList(duration: number, businessTime: any[], date: any, room_number: string) {

        let endTime = moment(businessTime[1], 'HH:mm').subtract(duration, 'm')
        let tempTime = moment(businessTime[0], 'HH:mm');
        let timeList: any[] = [businessTime[0]];

        //15분 기준으로 예약 가능
        while (tempTime < endTime) {
            timeList.push(tempTime.add(15, 'm').format('HH:mm'))
        }

        const result: any = _.map(timeList, (time: any, idx: number) => {
            return {
                "text": {
                    "type": "plain_text",
                    "text": `${time} - ${moment(time, 'HH:mm').add(duration, 'm').format('HH:mm')}`,
                    "emoji": true
                },
                "value": `${time}-${moment(time, 'HH:mm').add(duration, 'm').format('HH:mm')}`
            }
        })
        return (await this.checkDupTime(result, room_number, new Date(date)))



    }

    async checkDupTime(originList: any[], roomNumber: string, selectedDate: Date) {

        const result = await dbs.Meeting.hasMeetingOnDate(selectedDate, roomNumber)

        let startIdx: number;
        let endIdx: number;

        _.some(result, (meeting: any) => {
            _.some(originList, (list: any, i: number) => {
                if (list.value.split('-')[0] === meeting.start) {
                    startIdx = i;
                } else if (list.value.split('-')[0] === meeting.end) {
                    endIdx = i;
                    return true;
                } else if (list.value.split('-')[1] === meeting.end) {
                    endIdx = originList.length;
                    return true;
                }
            })
            originList.splice(startIdx, endIdx - startIdx);
        })


        return originList;
    }
}


export default new TimeManager()