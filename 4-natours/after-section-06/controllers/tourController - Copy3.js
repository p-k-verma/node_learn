const Tour = require('./../models/tourModel')
const APIFeatures = require('./../utils/apiFeatures');

exports.getAllTours = async (req, res) => {
  try {
    // EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};


//findbyId gives the promise and it is built in method of mongoose to give single product which matches the id
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error
    })
  }
};

//keep in mind that create return the promise
exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body)
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });

  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error
    })
  }

  
};


//findByIdAndUpdate is mongoose query and it's a promise 
//it takes two thing, one is id and other is updating value
//new: true, will return the updated document
//runValidators: true, checks the validation
exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error
    })
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id)
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error
    })
  }
};

//this is the alias example
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  // console.log("yha tak apuch gya");
  next();
};


exports.getTourStats = async (req, res)=> {
  try {
    const stats = Tour.aggregate([
      
    ])
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error
    })
  }
}


//aggreation is use to calculate the statics of the collection data in various steps or stages, aggreation pipeline is mongoDB feature
//the array in aggregate is the stages
exports.getTourStats = async (req, res)=> {
  try {
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

  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error
    })
  }
}


exports.getMonthlyPlan = async (req, res)=> {
  try {
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

  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error
    })
  }
}