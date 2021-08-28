class viewController {

    private availTime: any[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

    setStartTime(timeList?: any[]) {
        const blocks:any[]= [];
        const startTime = this.startTime(timeList || this.availTime)


        for (let i = 0; i < startTime.length; i++) {
            blocks.push({
                "text": {
                    "type": "plain_text",
                    "text": `${startTime[i]}:00`,
                    "emoji": true
                },
                "value": `${startTime[i]}`
            })
        }

        return blocks
    }

    startTime(timeList: any[]) {
        return this.availTime.filter(x => !timeList.includes(x.toString()));
    }


}


export default new viewController;