var mongodb = require('./db');
markdown = require('markdown').markdown;

function Post(name, title, post) {
    this.name = name;
    this.title = title;
    this.post = post;
}
module.exports = Post;

Post.prototype.save = function (callback) {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth();
    var day = date.getDate();
    var hours = date.getHours();
    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();

    var time = {
        date: date,
        year: year,
        month: year + "-" + month,
        day: year + "-" + month + "-" + day,
        minute: year + "-" + month + "-" + day + " " + hours + ":" + minutes
    };

    var post = {
        name: this.name,
        time: time,
        title: this.title,
        post: this.post
    };

    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.insert(post, {safe: true}, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });

};

Post.get = function (name, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            var query = {};
            if (name) {
                query.name = name;
            }
            collection.find(query).sort({time: -1}).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                docs.forEach(function (doc) {
                   doc.post = markdown.toHTML(doc.post);
                });
                callback(null, docs);
            });
        });
    });
};
