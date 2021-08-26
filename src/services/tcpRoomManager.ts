import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { zWS } from '../controllers/tcp/wsController';
import { Broadcast, SendPacket } from './packetService';


interface IRoom {
    id: string
    members: { [key: string]: zWS }
}
// interface IRooms {
//     [Key: string]: IRoom
// }
// interface IRoomsByGameId {
//     [Key: number]: IRooms
// }
interface IGame {
    [Key: string]: {
        [Key: string]: {
            [Key: string]: IRoom
        }
    }
}

class RoomManager {
    private games: IGame = {};

    getState = () => {
        const games: IGame = {};
        const names = Object.keys(this.games);
        _.forEach(names, (name: string) => {
            const game = this.games[name];
            games[name] = games[name] || {};

            // 방 인원별
            const nums = Object.keys(game);
            _.forEach(nums, (num: string) => {
                const rooms = game[num];
                games[name][num] = games[name][num] = {};
            })
        })
    }

    enter = (ws: zWS) => {
        let {
            uid: user_uid,
            gameData: {
                game_id,
                num,
                room_id,
            }
        } = ws;

        // 이미 들어가 있는 방이 있으면 에러
        if ( room_id ) {
            return SendPacket(ws, 'error');
        }

        // 게임별 방 목록
        const game_rooms = this.games[game_id] = this.games[game_id] || {};

        // 방 인원수별 방 목록
        const rooms = game_rooms[num] = game_rooms[num] || {};

        // 빈 방 찾기
        let room = _.find(rooms, (room: IRoom) => {
            return Object.keys(room.members).length < _.toNumber(num)
        });

        // 빈 방 없으면
        if ( !room ) {
            room_id = uuid();
            room = rooms[room_id] = {
                id: room_id,
                members: {}
            }
        }

        // 입장
        // 방 정보 설정
        room.members[user_uid] = ws;
        ws.gameData.room_id = room.id;

        // 다른 유저에게 알림
        _.forEach(room.members, (_ws: zWS) => {
            if ( _ws !== ws ) {
                SendPacket(_ws, 'enter', { uid: user_uid });
            }
        });

        // 입장한 유저에게 기존 정보 알림
        const members = Object.keys(room.members);
        SendPacket(ws, 'enter_ok', { members });

        // 풀방?
        if ( Object.keys(room.members).length === _.toNumber(num) ) {
            const members = Object.keys(room.members);
            Broadcast(room.members, ws, 'full', { members });
        }
    }

    leave = (ws: zWS) => {
        let {
            uid: user_uid,
            gameData: {
                game_id,
                num,
                room_id,
            }
        } = ws;

        // 들어가 있는 방이 없으면 에러
        if ( !room_id ) {
            return SendPacket(ws, 'error');
        }

        const room = this.getCurrentRoom(game_id, num, room_id);
        if ( !room ) {
            SendPacket(ws, 'error', {message: 'invalid_room_id'});
        }

        // 나가기
        this.leaveCurrentRoom(game_id, num, room_id, user_uid);
    }

    play = (ws: zWS, packetData: any) => {
        let {
            uid: user_uid,
            gameData: {
                game_id,
                num,
                room_id,
            }
        } = ws;

        if ( !room_id ) {
            return SendPacket(ws, 'error', {message: '넌 방에 없음'});
        }

        const room = this.getCurrentRoom(game_id, num, room_id);

        // 데이터 저장
        this.save(ws, packetData);

        //
        switch (game_id) {
            case 'minesweeper':
            case 'drawing':
            default:
                this.defaultRouter(room, ws, packetData);
        }
    }


    //////////////////////////////////
    // private functions
    private save(ws: zWS, packetData: any) {
        const {
            gameData: {
                save_data,
            }
        } = ws;
        const { type, data, saves } = packetData;

        _.forEach(saves, (save: any) => {
            const { type, key } = save;

            if( type === '.save' ) {
                save_data[key] = data[key];
            }
            else if( type === '.push' ) {
                save_data[key].push(data[key]);
            }
            else if( type === '.pop' ) {
                save_data[key].pop();
            }
        })
    }

    private getCurrentRoom(game_id: string, num: string, room_id: string) {
        // 게임별 방 목록
        const game_rooms = this.games[game_id] = this.games[game_id] || {};

        // 방 인원수 별 방 목록
        const rooms = game_rooms[num] = game_rooms[num] || {};

        return rooms[room_id];
    }

    private leaveCurrentRoom(game_id: string, num: string, room_id: string, user_uid: string) {
        const game_rooms = this.games[game_id];
        const rooms = game_rooms[num]
        const room = rooms[room_id];

        delete room.members[user_uid];

        if( Object.keys(room.members).length < 1 ) {
            delete this.games[game_id][num][room_id];
        }

        if( Object.keys(rooms).length < 1 ) {
            delete this.games[game_id][num];
        }

        if( Object.keys(game_rooms).length < 1 ) {
            delete this.games[game_id];
        }
    }

    private defaultRouter(room: IRoom, ws: zWS, packetData: any) {
        // 다른 유저에게 입장 알림
        _.forEach(room.members, (_ws: zWS) => {
            if( _ws !== ws ) {
                SendPacket(_ws, 'play', {
                    from: ws.uid,
                    data: packetData
                });
            }
        })
    }
}


export default new RoomManager()
