const mongoose = require('mongoose')
const slugify = require('slugify')
// const User = require('./userModel')  needed for data embedding

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
      max: [5, 'Rating must be below or equal to 5.0'],
      set: val => Math.round( val * 10 ) / 10              // set gets a callback function which runs on evrytime when ratingsaverage change . here we used to round off the number
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
    // guides: Array             it was the embadding example
    // below is for child referencing code
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User"
      }
    ],
  }, {
    //here we are defining the virtual to be part of output but not part of database
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  })


//! Index in mongoDB
// when we have data of 1 billion and want the detail of sam in it, if we use findOne then mongo go to every field one by one and check it. so this quey becomes time consuming.
// so we created the index of name ie a separate copy of name created in the database which point towards the their full data and then we run the query over the name index
// tourSchema.index({ price: 1 }) //this is normal indexig of only one field indexing created  1 means accending and -1 means decending
tourSchema.index({ price: 1, ratingsAverage: -1 }) // it is compound indexing
tourSchema.index({ slug: 1 }) // it is compound indexing
tourSchema.index({ startLocation: "2dsphere" })  // index of geospetial data needs to be 2D sphere so "2dsphere"




//! virtual
//when we want some data don't to be persist in database then we use virtual. basically the all the conversion calculation is done here
tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7
})

//! Virtual Populate
// for child referencing code but as time passes, the reviews grows exponentially then it will become problometic, so we use the virtual populate for child referencing as it populates virtually
// "reviews" ish naam se bnega tour k ander
tourSchema.virtual('reviews',{
  ref: 'Review',  //It contains the name of the model from which we want to populate the document ie reviewModel
  foreignField: 'tour',  //It is any field of the above model collection.
  localField: '_id' // id means ki current tour model ki id kis kis review me dali h ushko utha le aur ish me dikha de
})

//mongoose middleware, it is used to perform certain operation before(prev function) and after(next function) saving the data to database.
//DOCUMENT MIDDLEWARE of Mongoose, runs before .save() and .create() not on update(). we are processing the document
tourSchema.pre('save', function(next){
  //this keyword point towards the currently saved objects
  this.slug = slugify(this.name, { lower: true })
  next()
})

// * here we have done the data modelling by embadding, it has the disadvantage that the when the guide changes the role and then we have check its role
// tourSchema.pre('save', async function(next){
  // const guidesPromises = this.guides.map( async id => await User.findById(id))
  // guidesPromises is going to be array full of promises and we have to resolve all at once
  // this.guides = await Promise.all(guidesPromises)
  // next()
// })

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


tourSchema.pre(/^find/, function(next){

  this.populate({    // populates means fill up the a field called guides in our model, it has ref so means push in it but only in the query not in the database, if we put in particluar controller then it will work only in it not in getAlTors case. so we put it in the pre middleware so it work in all the case
    path: 'guides',       // keep in mind that the populate behind the secne runs the query and mignt have sone performance issue
    select: "-__v -passwordChangedAt"  // __v and passwordChangedAt passed as negative means we don't want these in the response
                                      // if we simply add something without -ve sign then it means ki we want to show that particluar thing
  }) 

  next()
})


//post query with regex ie any query function starting with find
tourSchema.post(/^find/, function(docs,next){
  // console.log(docs);
  next();
})




//AGGREATION MIDDLEWARE, it allows to add hooks before and after the aggregation
// tourSchema.pre('aggregate', function(next){
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
//   next()
// })


const Tour = mongoose.model('Tour', tourSchema)

// const testTour = new Tour({
//   name: "The forest hiker",
//   rating: 4.7,
//   price: 497
// })

//now to add the data in the database
// testTour.save().then(doc => console.log(doc)).catch(err => console.log("error:", err))

module.exports = Tour
