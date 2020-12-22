const express = require('express')
const Admin = require('../models/admin')
const router = express.Router()
const mongoose = require('mongoose')
const auth = require('../middleware/auth-admin')
const bcrypt = require('bcryptjs')



// Register function ----------------------------------------------------------------
router.post('/register', async (req, res) => {
    try {
        const { name, username, password, password2 } = req.body;

        if (!name || !username || !password || !password2) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }
        if (password != password2) {
            return res.status(400).json({ msg: 'Passwords do not match' });
        }
        if (password.length < 8) {
            return res.status(400).json({ msg: 'Password must be at least 8 characters' });
        }

        const admins = await Admin.findOne({ username: username })
        if (admins) {
            return res.status(401).json({ message: 'Register failed! Username exists ' })
        }

        const admin = new Admin(req.body)
        await admin.save()
        const token = await admin.generateAuthToken()
        res.status(200).json({
            message: 'Register Successful',
            admin: admin,
            token: token
        })
    } catch (err) {
        res.status(400).json({
            message: 'Register failed!',
            error: err
        })

    }
})


// Login function ----------------------------------------------------------------
router.post('/login', async (req, res) => {
    //Login a registered admin
    const { username, password } = req.body
    const admins = await Admin.findOne({ username: username })
    if (!username || !password) {
        return res.status(401).json({ message: 'Please enter all fields' })
    }
    if (!admins) {
        return res.status(401).json({ error: 'Login failed! username does not exist ' })
    }
    try {
        const admin = await Admin.findByCredentials(username, password)
        if (!admin) {
            res.status(401).json({ message: 'Check Credentials Failed' })
        }

        //user.resetToken = null
        const token = await admin.generateAuthToken()
        res.status(200).json({
            message: 'Login Successful',
            token: token,
            admin: admin,

        })

    } catch (err) {
        res.status(500).json({
            message: 'Login failed! Password Invalid',
            error: err
        })
    }


})


// logout function ----------------------------------------------------------------

router.post('/logout', auth, async (req, res) => {
    // Log admin out of all devices
    try {
        req.admin.tokens.splice(0, req.admin.tokens.length)
        await req.admin.save()
        res.status(200).json({ message: 'logout successfull' })
    } catch (error) {
        res.status(500).json({ error: err })
    }
})


// update info for admin  ----------------------------------------------------------------
// router.put('/update/:id', auth, async (req, res) => {
//     const id = req.params.id;
//     Admin.findById(id, function (err, admin) {
//         bcrypt.compare(req.body.currentPassword, admin.password,(err,isMatch)=>{
//             if (isMatch) {
//                 bcrypt.hash(req.body.new_password, 8, (err, hash) => {
//                     if (err) throw err;
//                     const hasedPassword = hash;
//                     const condition = { _id: id };
//                     const dataForUpdate = { name: req.body.name, username: req.body.username, password: hasedPassword };
//                     Admin.findOneAndUpdate(condition, dataForUpdate, { new: true })
//                         .exec()
//                         .then(result => {
//                             if (result) {
//                                 res.status(200).json({
//                                     admin: result,
//                                     request: {
//                                         type: 'GET',
//                                         url: 'http://localhost:4000/admin/' + result._id
//                                     }
//                                 });
//                             } else {
//                                 res.status(404).json({ message: 'There was a problem updating admin' });
//                             }
//                         })
//                 })
//         } else {
//             let condition = { _id: id }; // 
//             let dataForUpdate = { name: req.body.name, username: req.body.username };
//             Admin.findOneAndUpdate(condition, dataForUpdate, { new: true })
//                 .exec()
//                 .then(result => {
//                     if (result) {
//                         res.status(200).json({
//                             message:'Current Password Incorrect, No update password',
//                             admin: result,
//                             request: {
//                                 type: 'GET',
//                                 url: 'http://localhost:4000/admin/' + result._id
//                             }
//                         });
//                     } else {
//                         res.status(404).json({ message: 'There was a problem updating admin' });
//                     }
//                 })
//         }
//         })
//     })
// });

module.exports = router