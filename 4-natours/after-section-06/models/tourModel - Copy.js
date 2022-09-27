const mongoose = require('mongoose')
//! schema defines the structure of the data we are expecting or defines the shape of the documents within that collection.
//or we can say it is the blueprint of the data

const tourSchema = new mongoose.Schema({
    name : {
      type: String,
      //here we are defining the error, ie first is required or not and second is the error msg to show when not provided,so it is called validators
      required: [true, 'A tour must have a name'],
      unique: true
    },
    rating: {
      type: Number,
      default: 4.5
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    }
  })
  

//! To use our schema, we need to convert Schema into a Model we can work with.
// common pratice is to use capital first letter of modal
// in model we pass the tour name along with the schema
const Tour = mongoose.model('Tour', tourSchema)

// const testTour = new Tour({
//   name: "The forest hiker",
//   rating: 4.7,
//   price: 497
// })

//now to add the data in the database
// testTour.save().then(doc => console.log(doc)).catch(err => console.log("error:", err))

module.exports = Tour
