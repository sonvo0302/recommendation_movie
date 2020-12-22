const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const auth = require('../middleware/auth');
const Film = require('../models/film');
const Rating = require('../models/rating');
const Category = require('../models/category');
const Director = require('../models/director');
const Image = require('../models/image');
const UserCategory = require('../models/user_category')
const FilmsController = require('../controllers/film');
const db = mongoose.connection;
const Comment = require('../models/comment');
const Film_User_History = require('../models/film_user_history');
const { resolveSoa } = require('dns');
const category = require('../models/category');
const director = require('../models/director');
const { estimatedDocumentCount } = require('../models/film');
const { clearCache } = require('ejs');
const { group } = require('console');
const film = require('../models/film');

const uploadPath = path.join('public', Film.coverImageBasePath);

const imageMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'images/gif'
];
const upload = multer({
    // dest: uploadPath,
    // fileFilter: (req, file, callback) => {
    //     callback(null, imageMimeTypes.includes(file.mimetype))
    // }
});

router.get('/search', async (req, res, next) => {
    const regex = new RegExp(req.query.name, 'i');
    Film.find({ name: regex })
        .then((result) => {
            res.status(201).json(result);
        })
        .catch((err) => {
            res.status(500).json({
                error: err
            });
        });
});
//router.get('/filmMostWatched', (req, res) => res.render('films/filmMostWatched'));
//router.get('/latestFilm', (req, res) => res.render('films/latestFilm'));
router.get('/lastest', auth, async (req, res, next) => {
    const regex = new RegExp(req.query.text_search, 'i');
    const limit = parseInt(req.query.limit, 10);
    const page = parseInt(req.query.page, 10);
    Film.find({ name: regex })
        .select('name publishDate description cast imageUrl director categories linkTrailer create_at _id viewFilm')
        .sort({ publishDate: 'desc' })
        .limit(limit)
        .skip((page - 1) * limit)
        .then((docs) => {
            const respond = {
                count: docs.length,
                films: docs.map((doc) => {
                    return {
                        _id: doc._id,
                        viewFilm: doc.viewFilm,
                        name: doc.name,
                        categories: doc.categories,
                        publishDate: doc.publishDate,
                        description: doc.description,
                        create_at: doc.create_at,
                        cast: doc.cast,
                        imageUrl: doc.imageUrl,
                        director: doc.director,
                        linkTrailer: doc.linkTrailer,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:4000/film/' + doc._id
                        }
                    };
                })
            };

            res.status(200).json(respond);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.get('/most_watched', async (req, res, next) => {
    const regex = new RegExp(req.query.text_search, 'i');
    const limit = parseInt(req.query.limit, 10);
    const page = parseInt(req.query.page, 10);

    Film.find({ name: regex })
        .select('name publishDate description cast imageUrl director categories linkTrailer create_at _id viewFilm')
        .sort({ viewFilm: 'desc' })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec()
        .then((docs) => {
            const respond = {
                count: docs.length,
                films: docs.map((doc) => {
                    return {
                        _id: doc._id,
                        viewFilm: doc.viewFilm,
                        name: doc.name,
                        categories: doc.categories,
                        publishDate: doc.publishDate,
                        description: doc.description,
                        create_at: doc.create_at,
                        cast: doc.cast,
                        imageUrl: doc.imageUrl,
                        director: doc.director,
                        linkTrailer: doc.linkTrailer,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:4000/film/' + doc._id
                        }
                    };
                })
            };

            res.status(200).json(respond);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});
router.get('/', async (req, res, next) => {
    const regex = new RegExp(req.query.text_search, 'i');
    Film.find({ name: regex })
        .select('name publishDate description cast imageUrl director categories linkTrailer create_at _id viewFilm')
        .limit(10)
        .exec()
        .then((docs) => {
            const respond = {
                count: docs.length,
                films: docs.map((doc) => {
                    return {
                        _id: doc._id,
                        name: doc.name,
                        viewFilm: doc.viewFilm,
                        categories: doc.categories,
                        publishDate: doc.publishDate,
                        description: doc.description,
                        create_at: doc.create_at,
                        cast: doc.cast,
                        imageUrl: doc.imageUrl,
                        director: doc.director,
                        linkTrailer: doc.linkTrailer,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:4000/film/' + doc._id
                        }
                    };
                })
            };

            res.status(200).json(respond);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.post('/new', upload.single('coverImageName'), async (req, res, next) => {
    // const fileName = req.file != null ? req.file.filename : null
    const film_search = await Film.findOne({ name: req.body.name });
    const film_search_category = await Film.findOne({ categories: { $elemMatch: { category: req.body.categoryId } } });
    if (film_search) {
        let film;
        film = await Film.findOne(film_search._id);
        const categoryId = req.body.categoryId;
        const category = await film.Save_Category(categoryId);
        //film.save()
        res.status(200).json({
            message: 'Update Successful',
            category: category,
            film: film
        });
    } else {
        try {
            let image = new Image({
                _id: new mongoose.Types.ObjectId(),
                imageData: req.file.buffer.toString('base64')
            });

            console.log('IMAGE : ' + image._id);
            const film = new Film({
                _id: new mongoose.Types.ObjectId(),
                name: req.body.name,
                imageUrl: 'http://localhost:4000/image/' + image._id,
                //imgType:req.body.coverImageName.type,
                //rating :req.body.rating,
                publishDate: req.body.publishDate,
                description: req.body.description,
                linkTrailer: req.body.linkTrailer,
                cast: req.body.cast,
                director: req.body.directorId
            });

            await image.save();
            await film.save();
            const categoryId = req.body.categoryId;
            const category = film.Save_Category(categoryId);
            res.status(200).json({
                message: 'Success',
                film: film,
                category: category
            });
        } catch (err) {
            res.status(500).json({
                error: err,
                message: 'Add film fail'
            });
        }
    }
});

// router.get('/f/:filmId', auth, async (req, res, next) => {
//     Film
//         .findById(req.params.filmId)
//         .populate('categories')
//         .exec(function (err, films) {

//             Category.populate(films.categories, { path: 'category' }, function (err, doc) {
//                 res.json(doc);
//             });
//         });
// })

router.get('/recommend', auth, async (req, res) => {
    const userId = req.query.user_id;
    const category = await UserCategory.find({ user: userId }).sort({ number: -1 }).limit(3);
})

router.get('/trending', auth, async (req, res) => {
    try {
        const date = new Date();
        const limit = parseInt(req.query.limit, 10);
        const page = parseInt(req.query.page, 10);
        const prevDate = new Date();
        prevDate.setDate(date.getDate() - 7);
        const films = await Film_User_History.aggregate([{
            $match: {
                create_at: {
                    $gte: prevDate,
                    $lte: date
                }
            }
        },
        {
            $group: {
                _id: "$film",
                // film: {$film: }
            }
        }, {
            $lookup: {
                from: 'films',
                localField: '_id',
                foreignField: '_id',
                as: 'film',
            }
        }

        ]).exec();

        let result = films.sort((a, b) => b.film[0].viewFilm - a.film[0].viewFilm).slice(0, 8);
        res.status(200).json(result.map(data => data.film[0]));
    } catch (err) {
        res.status(500).json({ message: err })
    }
})

router.get('/:filmId', auth, async (req, res, next) => {
    try {
        const id = req.params.filmId;
        const film = await Film.findById(id);
        const rating = await Rating.find({ film: film.id }).exec();
        const comment = await Comment.find({ film: film.id }).exec();
        const loginId = req.user._id;
        const film_user_histories = await Film_User_History.find({ film: film.id, user: loginId }).exec();

        if (film_user_histories.length == '') {
            const film_user_history = new Film_User_History({
                _id: new mongoose.Types.ObjectId(),
                user: loginId,
                film: req.params.filmId,
                create_at: Date.now().toString(),
            });


            await film_user_history.save();
            const film_user_history1 = await Film_User_History.find({ film: film.id }).exec();

            Film.findById(id, (errorFind, film) => {
                if (errorFind) throw errorFind;

                const condition = { _id: id };
                const dataForUpdate = { viewFilm: film_user_history1.length };
                Film.findOneAndUpdate(condition, dataForUpdate, { new: true })
                    .populate('categories')
                    .exec(function (err, films) {
                        Category.populate(films.categories, { path: 'category' }, async function (err, doc) {
                            var total = 0;
                            for (var i = 0; i < rating.length; i++) {
                                total += rating[i].numberofrating;
                            }
                            var avg = 0;
                            if (rating.length == '') {
                                avg = 0;
                            } else {
                                avg = total / rating.length;
                            }

                            doc.map(async (category) => {
                                let data = await UserCategory.findOne({ user: loginId, category: category.category._id });
                                console.log(data)
                                if (data) {
                                    const condition = { _id: data._id }

                                    UserCategory.findByIdAndUpdate(condition, { number: data.number + 1 }, { new: true }).exec();

                                } else {
                                    let user = new UserCategory({
                                        _id: mongoose.Types.ObjectId(),
                                        user: loginId,
                                        category: category.category._id,
                                        number: 1
                                    });
                                    user.save();

                                }

                            })

                            res.status(200).json({
                                ratingAverage: avg,
                                categories: doc,
                                films: films
                            });
                        });
                    });
                if (errorFind) {
                    return res.status(401).json({
                        msg: 'Something Went Wrong',
                        success: false
                    });
                }
            });
        } else {
            const film_user_history1 = await Film_User_History.find({ film: film.id }).exec();
            Film.findById(id, (errorFind, film) => {
                if (errorFind) throw errorFind;

                const condition = { _id: id };
                const dataForUpdate = { viewFilm: film_user_history1.length, create_at: Date.now().toString() };
                Film.findOneAndUpdate(condition, dataForUpdate, { new: true })
                    .populate('categories')
                    .exec(function (err, films) {
                        Category.populate(films.categories, { path: 'category' }, function (err, doc) {
                            var total = 0;
                            for (var i = 0; i < rating.length; i++) {
                                total += rating[i].numberofrating;
                            }
                            var avg = 0;
                            if (rating.length == '') {
                                avg = 0;
                            } else {
                                avg = total / rating.length;
                            }

                            res.status(200).json({
                                message: 'Successfull',
                                ratingAverage: avg,
                                categories: doc,
                                films: films
                            });
                        });
                    });
                if (errorFind) {
                    return res.status(401).json({
                        msg: 'Something Went Wrong',
                        success: false
                    });
                }
            });
        }
    } catch (err) {
        res.status(500).json({
            message: err
        });
    }
});

router.put('/edit/:filmId', upload.single('coverImageName'), async (req, res, next) => {
    let film;
    film = await Film.findById(req.params.filmId);
    const rating = await Rating.find({ film: film.id }).exec();
    const comment = await Comment.find({ film: film.id }).exec();
    let image = new Image({
        _id: new mongoose.Types.ObjectId(),
        imageData: req.file.buffer.toString('base64')
    });

    (film.name = req.body.name),
        (film.imageUrl = 'http://localhost:4000/image/' + image._id),
        (film.publishDate = req.body.publishDate),
        (film.description = req.body.description),
        (film.linkTrailer = req.body.linkTrailer),
        (film.cast = req.body.cast),
        (film.director = req.body.directorId);

    film
        .save()
        .then((result) => {
            if (result) {
                var total = 0;
                for (var i = 0; i < rating.length; i++) {
                    total += rating[i].numberofrating;
                }
                var avg = 0;
                if (rating.length == '') {
                    avg = 0;
                } else {
                    avg = total / rating.length;
                }
                res.status(200).json({
                    message: 'Update film successfully',
                    createdFilm: {
                        name: result.name,
                        publishDate: result.publishDate,
                        description: result.description,
                        create_at: result.create_at,
                        cast: result.cast,
                        imageUrl: result.imageUrl,
                        director: result.director,
                        category: result.category,
                        linkTrailer: result.linkTrailer,
                        rating: rating,
                        comment: comment,
                        ratingAverage: avg,
                        _id: result._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/film/' + result._id
                        }
                    }
                });
            }
        })
        .catch((err) => {
            res.status(500).json({
                error: err
            });
        });
    const categoryId = req.body.categoryId;
    const category = film.Save_Category(categoryId);
});

router.delete('/delete/:filmId', (req, res, next) => {
    const id = req.params.filmId;
    Film.remove({ _id: id })
        .exec()
        .then((result) => {
            res.status(200).json({
                message: 'Film Deleted',
                request: {
                    type: 'POST',
                    url: 'http://localhost:4000/film/',
                    body: {
                        name: 'String',
                        rating: 'Number',
                        description: 'String',
                        publishDate: 'Date',
                        cast: 'String',
                        imageUrl: 'String',
                        director: 'directorId',
                        category: 'categoryId',
                        releaseDate: 'Datetime',
                        linkTrailer: 'String'
                    }
                }
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});
module.exports = router;