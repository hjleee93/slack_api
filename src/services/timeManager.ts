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

        let startIdx: number | undefined;
        let endIdx: number | undefined;

        _.forEach(meetingList, (meeting: any) => {
            _.forEach(originList, (list: any, i: number) => {

                if (list.value.split('-')[0] === moment(meeting.end, 'HH:mm').format('HH:mm')) {
                    endIdx = i;
                }
                else if (list.value.split('-')[1] === moment(meeting.start, 'HH:mm').format('HH:mm')) {
                    startIdx = i;
                }
                else if (moment(meeting.start, 'HH:mm').format('HH:mm') === '10:00') {
                    startIdx = 0;
                }
                else if (moment(meeting.end, 'HH:mm').format('HH:mm') === '19:00') {
                    endIdx = originList.length;
                }
                else if (!startIdx) {
                    startIdx = 0;
                }

            })

            if ((startIdx || startIdx === 0) && endIdx) {
                originList.splice(startIdx, endIdx - startIdx);
            }

            startIdx = undefined;
            endIdx = undefined;
        })


        return originList;
    }
}


export default new TimeManager()