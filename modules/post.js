var mongodb = require('./db');
markdown = require('markdown').markdown;

function Post(name, title, tags, post) {
    this.name = name;
    this.title = title;
    this.tags = tags;
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
        tags: this.tags,
        post: this.post,
        comments: [],
        pv: 0
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

Post.getAll = function (name, callback) {
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

Post.getTen = function (name, page, callback) {

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
            console.log(name);

            collection.count(query, function (err, total) {
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({time: -1}).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }

                    if (docs) {
                        docs.forEach(function (doc) {
                            doc.post = markdown.toHTML(doc.post);
                        });
                    }
                    callback(null, docs, total);
                });
            });
        });
    });
};

Post.getOne = function (name, day, title, callback) {
    console.log(name + " -- " + title + "----" + day);
    mongodb.open(function (err, db) {
        if (err) return callback(err);

        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                name: name,
                title: title,
                "time.day": day
            }, function (err, doc) {

                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                if (doc) {
                    collection.update({
                        name: name,
                        title: title,
                        "time.day": day
                    }, {$inc: {pv: 1}}, function (err) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                    });
                    if (doc) {
                        doc.post = markdown.toHTML(doc.post);
                        if (doc.comments) {
                            doc.comments.forEach(function (comment) {
                                comment.content = markdown.toHTML(comment.content);
                            });
                        } else {
                            doc.comments = [];
                        }
                    }
                }
                callback(null, doc);
            });
        });
    });
};

Post.edit = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) return callback(err);

            collection.findOne({
                "name": name,
                "title": title,
                "time.day": day
            }, function (err, doc) {
                mongodb.close();
                if (err) return callback(err);
                callback(null, doc);
            });
        });
    });
};

Post.update = function (name, day, title, post, tags, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name": name,
                "title": title,
                "time.day": day
            }, {$set: {post: post, tags: tags}}, function (err) {
                mongodb.close();
                console.log(err);
                if (err) return callback(err);
                callback(null);
            });
        });
    });
};

Post.remove = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                "name": name,
                "title": title,
                "time.day": day
            }, {w: 1}, function (err) {
                mongodb.close();
                if (err)
                    return callback(err);
                callback(null);
            });
        });
    });
};

Post.getArchive = function (callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.find({}, {
                "name": 1,
                time: 1,
                title: 1
            }).sort({time: -1}).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }

                callback(null, docs);
            });
        });
    });
};

Post.getTags = function (callback) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);

        db.collection(TABLE.TB_POST, function (err, collection) {

            if (err) {
                mongodb.close();
                return callback(err);
            }

            // distinct 用来找出给定键的所有不同值
            collection.distinct('tags', function (err, docs) {
                mongodb.close();
                if (err) return callback(err);
                callback(null, docs);
            });
        });
    });
};

Post.getTag = function (tag, callback) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);

        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.find({tags: tag}, {name: 1, time: 1, title: 1})
                .sort({time: -1}).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

Post.search = function (keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);

        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            var pattern = new RegExp("^.*" + keyword + ".*$", "i");
            collection.find({title: pattern}, {name: 1, time: 1, title: 1})
                .sort({time: -1}).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

function open(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection(TABLE.TB_POST, callback);
    });
}













