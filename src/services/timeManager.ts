import * as moment from "moment-timezone";
import * as _ from "lodash";
import blockManager from "./blockManager";
import {dbs} from "../commons/globals";

class TimeManager {

    async timeList(duration: number, businessTime: any[], date: any, room_number: string) {


        let closeTime = moment(businessTime[1], 'HH:mm').subtract(duration, 'm')
        let startTime = moment(businessTime[0], 'HH:mm');
        let timeList: any[] = [];

        //15분 기준으로 예약 가능 closeTime
        while (startTime <= closeTime) {
            let endTime = moment(startTime, 'HH:mm:ss').add(duration, 'm');

            timeList.push({
                "text": {
                    "type": "plain_text",
                    "text": `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`,
                    "emoji": true
                },
                "value": `${startTime.format('HH:mm')}-${endTime.format('HH:mm')}`
            })
            startTime.add(15, 'm').format('HH:mm:ss')

        }

        const checkTime = await this.checkDupTime(timeList, room_number, new Date(date))
        return checkTime.length > 0 ? checkTime : blockManager.noAbleTime();

    }

    async checkDupTime(originList: any[], room_number: string, selectedDate: Date) {

        const meetingList = await dbs.Meeting.hasMeetingOnDate(selectedDate, room_number)

        _.forEach(meetingList, (meeting: any) => {
            const startMoment = moment(meeting.start, 'HH:mm')
            const endMoment = moment(meeting.end, 'HH:mm')
            for (let i = originList.length - 1; i >= 0; i -= 1) {
                const startOriginMoment = moment(originList[i].value.split('-')[0], 'HH:mm')
                const endOriginMoment = moment(originList[i].value.split('-')[1], 'HH:mm')
                if (
                    startOriginMoment.isBetween(startMoment, endMoment, undefined, '[)') ||
                    endOriginMoment.isBetween(startMoment, endMoment, undefined, '(]')
                    || (startOriginMoment.isSameOrBefore(startMoment) &&
                        endMoment.isSameOrBefore(endOriginMoment))
                ) {
                    originList.splice(i, 1)
                }
            }


        })
        return originList;
    }
}


export default new TimeManager()