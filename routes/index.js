var express = require('express');
var router = express.Router();
var cryto = require('crypto');

User = require('../modules/user');
Post = require('../modules/post');
Comment = require('../modules/comment');
var fs = require('fs');
var multer = require('multer');

var storage = multer.diskStorage({
    // 文件路径
    destination: function (req, file, callback) {

        callback(null, './public/images');
        // 生成目标文件夹
        // var destDir = '/home/yyb/work/blog/public/images';
        // 判断文件夹是否存在
        // fs.stat(destDir, function(err){
        //     if (err) {
        //         mkdirp(destDir, function(err){
        //             if (err) {
        //                 return callback(err);
        //             }
        //         });
        //     }
        // });
        // callback(null, destDir);
    },

    // 文件名
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

/* GET home page. */
router.get('/', function (req, res, next) {
    var page = req.query.p ? parseInt(req.query.p) : 1;

    Post.getTen(null, page, function (err, posts, total) {
        if (err) {
            posts = [];
        }

        res.render('index', {
            title: "主页",
            posts: posts,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 10 + posts.length) == total,
            user: req.session.user,
            success: req.flash("success").toString(),
            error: req.flash("error").toString()
        });
    });

    // Post.getAll(null, function (err, posts) {
    //     if (err)
    //         posts = [];
    //
    //     res.render('index', {
    //         title: '主页',
    //         user: req.session.user,
    //         posts: posts,
    //         success: req.flash("success").toString(),
    //         error: req.flash("error").toString()
    //     });
    // });
});

router.get('/login', checkNotLogin);
router.get('/login', function (req, res, next) {
    res.render('login', ret("登录", req));
});

router.get('/login', checkNotLogin);
router.post('/login', function (req, res, next) {
    var name = req.body.name;
    var md5 = cryto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    User.get(name, function (err, user) {
        if (err || user == null) {
            req.flash('error', '用户不存在');
            return res.redirect('/login');
        }
        if (password != user.password) {
            req.flash('error', '密码错误');
            return res.redirect("/login");
        }

        req.flash("success", "登录成功！");
        req.session.user = user;
        res.redirect("/");
    });
});

router.get('/reg', checkNotLogin);
router.get('/reg', function (req, res, next) {
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash("success").toString(),
        error: req.flash("error").toString()
    });
});

router.post('/reg', checkNotLogin);
router.post('/reg', function (req, res, next) {

    var name = req.body.name;
    var password = req.body.password;
    var password_re = req.body['password-repeat'];

    if (password != password_re) {
        req.flash('error', '两次输入的密码不一样');
        return res.redirect('/reg');
    }

    var md5 = cryto.createHash('md5');
    password = md5.update(password).digest('hex');

    var newUser = new User({
        name: name,
        password: password,
        email: req.body.email
    });

    User.get(newUser.name, function (err, User) {
        if (err) {
            req.flash('error', "用户已存在");
            return res.redirect('/reg');
        }

        newUser.save(function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }

            req.session.user = user;
            req.flash('success', '注册成功');
            res.redirect('/');
        });
    });
});

router.get('/post', checkLogin);
router.get('/post', function (req, res, next) {
    res.render('post', ret('发表', req));
});

router.post('/post', checkLogin);
router.post('/post', function (req, res) {
    var currentUser = req.session.user;
    var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
    var post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
    post.save(function (err) {
        if (err) {
            req.flash("error", err);
            return res.redirect('/');
        }
        req.flash('success', '发表成功');
        return res.redirect('/');
    })
});

router.get('/logout', checkLogin);
router.get('/logout', function (req, res, next) {
    delete req.session.user;
    req.flash('success', "登出成功！！！");
    res.redirect("/");
});

router.get('/upload', checkLogin);
router.get('/upload', function (req, res, next) {
    res.render('upload', ret('文件上传', req));
});

router.post('/upload', checkLogin);
router.post('/upload', multer({storage: storage}).array('photos', 12), function (req, res) {
    req.flash('success', '上传文件成功');
    res.redirect('/upload');
});

router.get('/u/:name', function (req, res) {
    User.get(req.params.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户名不存在');
            return res.redirect('/');
        }

        var page = req.query.p ? parseInt(req.query.p) : 1;

        Post.getTen(req.params.name, page, function (err, posts, total) {
            if (err) {
                req.flash("error", err);
                return res.redirect('/');
            }

            res.render('user', {
                title: user.name,
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                user: req.session.user,
                success: req.flash("success").toString(),
                error: req.flash("error").toString()
            });
        });


        // Post.getAll(user.name, function (err, posts) {
        //     if (err) {
        //         req.flash('error', err);
        //         return res.redirect('/');
        //     }
        //     res.render('user', {
        //         title: req.params.name,
        //         posts: posts,
        //         user: req.session.user,
        //         success: req.flash('success').toString(),
        //         error: req.flash('error').toString()
        //     });
        // });
    });
});

router.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('article', {
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function (req, res) {
    Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        res.render('edit', {
            title: '编辑',
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;

    var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
    console.log(tags);
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post.trim(), tags, function (err) {
        var url = "/u/" + req.params.name + "/" + req.params.day + "/" + req.params.title;
        if (err) {
            req.flash("error", err);
            return res.redirect(url);
        }
        req.flash('success', '修改成功！');

        console.log("url -- >>" + url);

        res.redirect(encodeURI(url));
    });
});

router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
        if (err) {
            req.flash("error", err);
            return res.redirect('back');
        }
        req.flash('success', '修改成功！');
        res.redirect('/');
    });
});

router.post('/u/:name/:day/:title', checkLogin);
router.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth();
    var day = date.getDate();
    var hours = date.getHours();
    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();

    var time = year + "-" + month + "-" + day + " " + hours + ":" + minutes;
    var md5 = cryto.createHash('md5');
    console.log(req);
    var email_md5 = md5.update(req.body.email.toLowerCase()).digest('hex');
    var head = 'http://gravatar.duoshuo.com/avatar/' + email_md5 + '?s=48';
    var comment = {
        name: req.body.name,
        head: head,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };

    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
        if (err) {
            req.flash("error", err);
            return res.redirect("/");
        }
        req.flash("success", '留言成功');
        res.redirect("back");
    });

});

router.post('/archive', checkLogin);
router.get('/archive', function (req, res) {
    Post.getArchive(function (err, posts) {
        if (err) {
            req.flash('error', err);
            return res.redirect("/");
        }

        res.render('archive', {
            title: '存档',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/tags', function (req, res) {
    Post.getTags(function (err, posts) {
        if (err) {
            req.flash(ERROR, err);
            return res.redirect('/');
        }

        res.render('tags', {
            title: ' 标签',
            posts: posts,
            user: req.session.user,
            success: req.flash(SUCCESS).toString(),
            error: req.flash(ERROR).toString()
        });
    });
});
router.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
        if (err) {
            req.flash(ERROR, err);
            return res.redirect('/');
        }

        res.render('tag', {
            title: ' TAG' + req.params.tag,
            posts: posts,
            user: req.session.user,
            success: req.flash(SUCCESS).toString(),
            error: req.flash(ERROR).toString()
        });
    });
});

router.get('/search', function (req, res) {
    Post.search(req.query.keyword, function (err, posts) {
        if (err) {
            req.flash(ERROR, err);
            return res.redirect('/');
        }

        res.render('search', {
            title: "SEARCH: " + req.query.keyword,
            posts: posts,
            user: req.session.user,
            success: req.flash(SUCCESS).toString(),
            error: req.flash(ERROR).toString()
        });

    });
});

router.get('/links', function (req, res) {
    res.render('links', {
        title: '友情链接',
        user: req.session.user,
        success: req.flash(SUCCESS).toString(),
        error: req.flash(ERROR).toString()
    });
});

router.get('/reprint/:name/:day/:title', checkLogin);
router.get('/reprint/:name/:day/:title', function (req, res) {
    Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash(ERROR, err);
            return res.redirect('back');
        }

        var currentUser = req.session.user,
            reprint_from = {
                name: post.name,
                day: post.time.day,
                title: post.title
            },
            reprint_to = {
                name : currentUser.name,
                head: currentUser.head
            };
        Post.reprint(reprint_from, reprint_to, function (err, post) {
            if (err) {
                req.flash(ERROR, err);
                return res.redirect('back');
            }

            req.flash(SUCCESS, '转载成功！');
            var url = '/u/' + post.name + '/' + post.time.day + '/' + post.title;
            url = encodeURI(url);
            res.redirect(url);
        });
    });
});

function ret(name, req) {
    return {
        title: name,
        user: req.session.user,
        success: req.flash("success").toString(),
        error: req.flash('error').toString()
    }
}

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录');
        res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录');
        res.redirect('back');
    }
    next();
}


module.exports = router;
