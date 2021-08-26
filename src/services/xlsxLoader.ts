import * as XLSX from 'xlsx';
import * as path from 'path';

const filename = path.join(__dirname, './badwords.xlsx');


class XlsxLoader {
    private doc = [];
    private colNames: any = {};
    private xlsx: any;
    private sheets: any;

    constructor() {
        // this.readFile(filename);
    }

    readFile(filename: any) {
        // this.doc = [];
        const colNames: any = {};
        const sheets: any = {};
        const xlsx = XLSX.readFile(filename);
        // self.sheets = self.xlsx.Sheets;
        xlsx.SheetNames.forEach((sheetName: string) => {
            const result = [];
            const sheet = xlsx.Sheets[sheetName];
            if (!sheet['!ref']) {
                return;
            }
            const range = XLSX.utils.decode_range(sheet['!ref']);
            for( let r = range.s.r; r <= range.e.r; r++ ) {
                const row = [];
                for( let c = range.s.c; c <= range.e.c; c++ ) {
                    const cell = sheet[XLSX.utils.encode_cell({r:r, c:c})];
                    if( typeof cell !== 'undefined' ) {
                        if( r === 0 ) {
                            colNames[cell.w] = c;
                        }
                        else {
                            row.push(cell.w.trim());
                        }
                    }
                    // else {
                    //     row.push(void 0);
                    // }
                }
                if( r !== 0 ) {
                    result.push(row);
                }
            }
            // self.doc.push(result);
            // this.sheets = this.sheets || {};
            sheets[sheetName] = result;
        });

        return {
            sheetNames: xlsx.SheetNames,
            sheets,
            colNames
        };
    }

    // getCell(sheetName: string, edu: string, company: string, round: string, turn: string) {
    //     return new Promise((resolve, reject) => {
    //         try {
    //             const ret: any = [];
    //             this.sheets[sheetName].forEach((row: any) => {
    //                 if( row[this.colNames['Education']] === edu &&
    //                     row[this.colNames['Company']] === company &&
    //                     row[this.colNames['Round']] === round &&
    //                     row[this.colNames['Turn']] === turn ) {
    //                     ret.push(row);
    //                 }
    //             });
    //
    //             return resolve(ret);
    //         }
    //         catch(e) {
    //             reject(e.message || e);
    //         }
    //     });
    // }
}


export default new XlsxLoader()
