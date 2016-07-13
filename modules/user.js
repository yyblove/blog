var mongodb = require('./db');
var crypto  = require('crypto');

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

// 存储用户信息
User.prototype.save = function (callback) {
    var md5 = crypto.createHash('md5');
    var email_md5 = md5.update(this.email.toLowerCase()).digest('hex');
    var head = 'http://www.gravatar.com/avatar/' + email_md5 + '?s=48';
    
    // 要存入数据库的用户文档
    var user = {
        name: this.name,
        password: this.password,
        email: this.email,
        head: head
    };

    // 打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection(TABLE.TB_USER, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            // 将用户数据插入 users 集合
            collection.insert(user, {safe: true}, function (err, user) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, user[0]);
            });
        });
    });
};

User.get = function (name, callback) {
    mongodb.open(function (err, db) {
        if (err)
            return callback(err);

        db.collection(TABLE.TB_USER, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({name: name}, function (err, user) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                console.log(user);
                callback(null, user);
            })

        });

    });

};