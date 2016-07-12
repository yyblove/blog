var mongodb = require('./db');


function Comment(name, day, title, comment) {
    this.name = name;
    this.day = day;
    this.title = title;
    this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function (callback) {
    var name = this.name;
    var day = this.day;
    var title = this.title;
    var comment = this.comment;

    mongodb.open(function (err, db) {
        if (err) return callback(err);

        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.update({name: name, title: title, 'time.day': day},
                {$push: {comments: comment}}, function (err) {
                    mongodb.close();
                    console.log(err);
                    if (err)  return callback(err);
                    callback(null);
                });
        });
    });
};





















