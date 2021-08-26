import * as _ from 'lodash';
import { SrvMQ } from './_srvMQ';
import { caches, dbs } from '../../commons/globals';
import { Sequelize } from 'sequelize';


class ContentMQ extends SrvMQ {

}


export default new ContentMQ()
