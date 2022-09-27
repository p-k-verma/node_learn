const mongoose = require('mongoose')
const slugify = require('slugify')

const tourSchema = new mongoose.Schema({
    name : {
      type: String,
      required: [true, 'A tour must have a name'], //it is built-in validator, its have error handling else text 
      unique: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'], //it is built-in validator
      minlength: [10, 'A tour name must have more or equal then 10 characters'] //it is built-in validator
    },
    slug: String ,
    duration : {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize : {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty : {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum:{  //below is the full form of in-built validation for strings not for number
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below or equal to 5.0']
    },
    ratingQuantity : {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount : {     //!here we are making the custom validator
      type: Number,
      validate: {
        //this only points to current doc on NEW document creation,so it don't work on updating the value
        validator: function(val){
          return val < this.price
        },
        message: 'Discount price ({VALUE}) should be below the regular price'
      },
    },
    summary : {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description : {
      type: String,
      trim: true
    },
    imageCover : {
      type: String,
      required: [true, 'A tour must have a image cover']
    },
    //in images, we are saying we need array of string
    images : [String],
    createdAt : {
      type: Date,
      default: Date.now(),
      //below means that we want the data but not want to show in api in any condition or can say by default block
      select: false
    },
    startDates : [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON is mongoDB special data format for geolocation
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [ Number ], // Here we are expecting coordinates as an array of numbers
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [ Number ],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: Array
  }, {
    //here we are defining the virtual to be part of output but not part of database
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  })


//! virtual
//when we want some data don't to be persist in database then we use virtual. basically the all the conversion calculation is done here
tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7
})



//mongoose middleware, it is used to perform certain operation before(prev function) and after(next function) saving the data to database.
//DOCUMENT MIDDLEWARE of Mongoose, runs before .save() and .create() not on update(). we are processing the document
tourSchema.pre('save', function(next){
  //this keyword point towards the currently saved objects
  this.slug = slugify(this.name, { lower: true })
  next()
})
//* we can have as many pre and post middleware
//post have the access of next along with document that have been saved, there we don't have this keyword
tourSchema.post('save', function(doc, next){
  // console.log("this is the post middleware");
  next()
})

//QUERY MIDDLEWARE, we do the query thing before and after
tourSchema.pre('find', function(next){
  this.find({ secretTour: { $ne: true } })
  next()
})
//post query with regex ie any query function starting with find
tourSchema.post(/^find/, function(docs,next){
  // console.log(docs);
  next();
})
//AGGREATION MIDDLEWARE, it allows to add hooks before and after the aggregation
tourSchema.pre('aggregate', function(next){
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
  next()
})


const Tour = mongoose.model('Tour', tourSchema)

// const testTour = new Tour({
//   name: "The forest hiker",
//   rating: 4.7,
//   price: 497
// })

//now to add the data in the database
// testTour.save().then(doc => console.log(doc)).catch(err => console.log("error:", err))

module.exports = Tour
