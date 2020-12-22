const mongoose = require('mongoose');
const path = require('path');
const image = require('./image');

const coverImageBasePath = 'uploads/filmCovers';

const filmSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	name: { type: String, require: true },
	imageUrl: { type: String, require: true },
	publishDate: { type: Date, require: true },
	create_at: { type: Date, require: true, default: Date.now },
	description: { type: String, require: true },
	categories: [
		{ category: { type: mongoose.Schema.Types.ObjectId, require: true, ref: 'Category' } }
	],
	director: { type: mongoose.Schema.Types.ObjectId, require: true, ref: 'Director' },
	linkTrailer: { type: String, require: true },
	cast: { type: String, require: true },
	viewFilm: { type: Number, default: 0 }
	// img: {
	//   type: Buffer,
	//   required: true
	// },
	// imgType: {
	//   type: String,
	//   required: true
	// }
});

filmSchema.methods.Save_Category = async function(category) {
	// Generate an auth token for the user
	const film = this;
	film.categories = film.categories.concat({ category });
	await film.save();
	return category;
};

// filmSchema.methods.saveImage = async function(imageUrl) {
// 	this.imageUrl = imageUrl;
// 	await film.save();
// 	return imageUrl;
// };

module.exports = mongoose.model('Film', filmSchema);
module.exports.coverImageBasePath = coverImageBasePath;
