const express = require("express");
const Router = express.Router();
const mongoose = require('mongoose');
const userManager = require('../models/user')
const userInfo = require('../models/user_info');
const auth = require('../middleware/auth-admin')
// list usẻ function ----------------------------------------------------------------
Router.get('/list', auth, async (req, res,) => {
    {
        await userManager.find()
            .select('username email password _id')
            .exec()
            .then(docs => {
                const respond = {
                    count: docs.length,
                    users: docs.map(doc => {
                        return {
                            email: doc.email,
                            password: doc.password,
                            username: doc.username,
                            _id: doc._id,
                            request: {
                                type: 'GET',
                                url: 'http://localhost:4000/userManager/' + doc._id
                            }
                        }
                    })
                }
                res.status(200).json(respond)
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                });
            });
    }
})



// get user ID  ----------------------------------------------------------------
Router.get('/userInfo', auth, (req, res) => {
    const id = req.query.user_id;
    userInfo.findOne({ user: id }) //  findById : la lay id
        .select('name dateofbirth mobile_phone gender create_at _id')
        .exec()
        .then(docs => {
            if (docs) {
                res.status(200).json({ message: 'success', userInfo: docs });
            } else {
                res.status(404).json({ message: "err" })
            }

        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
})

//----------------------------------------------------------------------

// delete user function ----------------------------------------------------------------
Router.delete('/delete', auth, (req, res) => {
    try {
        const id = req.query.user_id;
        userManager.findByIdAndRemove(id, function (err, user) {
            if (err) return res.status(500).json({ error: err })
            else {
                userInfo.findOneAndRemove({ user: id }, function (errInfo, userinfo) {
                    if (errInfo) throw errInfo
                    else res.status(200).json({ message: 'Deleted successfully' })
                })
            }
        })
    } catch (err) {
        res.status(500).json({ message: err })
    }
})

module.exports = Router;