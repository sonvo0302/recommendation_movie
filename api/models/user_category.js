const mongoose = require('mongoose');

const userCategorySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    user: { type: mongoose.Schema.Types.ObjectId, require: true, ref: 'User' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    number: { type: Number, default: 0 }
})

module.exports = mongoose.model('UserCategory', userCategorySchema);