var mongodb = require('./db');
markdown = require('markdown').markdown;

function Post(name, head, title, tags, post) {
    this.name = name;
    this.head = head;
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
        head: this.head,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        reprint_info: {},
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
                        // mongodb.close();
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
                mongodb.close();
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

            collection.findOne({
                "name": name,
                "title": title,
                "time.day": day
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }

                var reprint_from = "";
                if(doc.reprint_info.reprint_from){
                    reprint_from = doc.reprint_info.reprint_from;
                }

                if(reprint_from != ""){
                    console.log("-----reprint_from-----");
                    collection.update({
                        "name": reprint_from.name,
                        "title": reprint_from.title,
                        "time.day": reprint_from.day
                    }, {$pull:{"reprint_info.reprint_to":{
                        "name": name,
                        "day": day,
                        "title": title
                    }}}, function (err) {
                        console.log("-----reprint_from-----213123");
                        if (err) {
                            mongodb.close();
                            return callback(err);
                        }
                    });
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

Post.reprint = function (reprint_from, reprint_to, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection(TABLE.TB_POST, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name": reprint_from.name,
                "time.day": reprint_from.day,
                "title": reprint_from.title
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }


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
                    minutes: year + "-" + month + "-" + day + " " + hours + ":" + minutes
                };

                delete doc._id;
                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = doc.title.search(/[转载]/ > -1) ? doc.title : "[转载]" + doc.title;
                doc.comments = [];
                doc.reprint_info = {"reprint_from": reprint_from};
                doc.pv = 0;

                collection.update({
                    name: reprint_from.name,
                    "time.day": reprint_from.day,
                    title: reprint_from.title
                }, {
                    $push: {
                        "reprint_info.reprint_to": {
                            name: doc.name,
                            day: time.day,
                            title: doc.title
                        }
                    }
                }, function (err) {
                    if (err) {
                        mongodb.close();
                        return callback(err);
                    }
                });

                collection.insert(doc, {safe: true}, function (err, post) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    console.log(err);
                    console.log(post);
                    callback(null, post.ops[0]);
                });

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













