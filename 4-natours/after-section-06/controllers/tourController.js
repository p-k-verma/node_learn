const Tour = require('./../models/tourModel')
// const APIFeatures = require('./../utils/apiFeatures');

//! we have written the logic detail in the catchAsync file
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')

const factory = require('./handlerFactory')


exports.deleteTour = factory.deleteOne(Tour)
//* earlier below was used to delete but we created the universal delete function or factory handler which handle the deletion
// exports.deleteTour = catchAsync( async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id)

//     if (!tour) {
//       return next(new AppError('No tour found with thaat ID', 404))
//     }


//     res.status(204).json({
//       status: 'success',
//       data: null
//     });
// });



exports.updateTour = factory.updateOne(Tour)
//* universal update function created
// exports.updateTour = catchAsync( async (req, res, next) => {

//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     })

//     if (!tour) {
//       return next(new AppError('No tour found with thaat ID', 404))
//     }


//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour
//       }
//     });
// });

exports.createTour = factory.createOne(Tour)
//* universal update function created
// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body)

//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour
//       }
//     });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' })
//* universal update function created
// exports.getTour = catchAsync( async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews')   // here we have populate in particluar getTour, we don't need to use populate in pre of middleware 

//   if (!tour) {
//     return next(new AppError('No tour found with thaat ID', 404))
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

exports.getAllTours = factory.getAll(Tour)
//* universal update function created
// exports.getAllTours = catchAsync( async (req, res, next) => {

//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// });




exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getTourStats = catchAsync( async (req, res, next)=> {

    const stats = await Tour.aggregate([
      // Stage 1:
      {
        //$match takes a document that specifies the query conditions,Filters the documents to pass only the documents that match the query
        //here we want the ratingaverage greater than or equal to 4.5
        $match: { ratingsAverage: { $gte : 4.5 } }
      },
      //Stage 2:
      {
        //The $group stage separates documents into groups according to a "group key". The output is one document for each unique group key.
        $group: {
          //id is must syntex, if null means everything in one group
          // _id: null,
          // _id: '$difficulty', //grouping on the basis of difficulty
          // _id: '$ratingsAverage', //grouping on the basis of ratingsAverage
          _id: {$toUpper: '$difficulty'}, //grouping on the basis of difficulty with uppercase
          //$avg is mongodb operator, and string we pass the data value or avg of which we want
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      //Stage 3:
      {
        //in shorting or second stage, we can't use initial name we have the access of last name which are higlited above in blue
        $sort: { avgPrice: 1 } //1 means in accending order
      },
      //Stage 4:
      {
        $match: { _id: { $ne : "EASY" } } //ne means not equal
      }

    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
})


exports.getMonthlyPlan = catchAsync( async (req, res, next)=> {

    const year = req.params.year * 1
    const plan = await Tour.aggregate([
      {
        //ek object me jo array hota h ushme array ko break kr k utne hi naye object bna deta h jitne array honge
        $unwind: '$startDates'
      },
      {
        $match: { 
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numToursStart: { $sum: 1 },
          tours: { $push: '$name' }
        }
      },
      {
        $addFields: { month: '$_id' }
      },
      {
        $project: {
          _id: 0 //id=0 means we don't want to show in api, if we place it as 1 then it will be shown in api
        }
      },
      {
        $sort: { numToursStart: -1 } // -1 is for descending
      },
      {
        $limit: 12
      }
    ])

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
})


// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');


  // here we converted the radius into radians becuse mongoDB needed the radius in radians
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});