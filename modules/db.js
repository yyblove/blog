var mongodb = require('mongodb');
var settings = require('../settings'),
    Db = mongodb.Db,
    Connection = mongodb.Server,
    Server = mongodb.Server;


module.exports = new Db(settings.db,
    new Server(settings.host, settings.port),
    {safe: true});