const Tour = require('./../models/tourModel')


//find() is not the array method, its mangoose and it return the promise
//if we dont pass anything in find it will give all the value from the database
//if we pass anything as object form it will give the data of key value
exports.getAllTours = async (req, res) => {
  try {
    //BUILD QUERY
    //1A) FILTERING
    const queryObj = {...req.query}
    const excludedFields = ['page','sort','limit','fields']
    excludedFields.forEach((el)=> delete queryObj[el])

    // const query = Tour.find(queryObj)

    //!1B) Advanced FILTERING
    //http://localhost:3000/api/v1/tours?duration[gte]=5&difficulty=easy
    //above we want the duration less than or equal to 5 and difficulty equal to easy
    //gte, gt, lte, lt is greater than equal to, greater than, less than equal to, less than
    //in mongoose for advance filtering, we use above with $
    let queryStr = JSON.stringify(queryObj);
    //below we are replacing the exact word in bracket with $match
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

    let query = Tour.find(JSON.parse(queryStr))

    //!2) Sorting
    //http://localhost:3000/api/v1/tours?sort=price for acending order
    //http://localhost:3000/api/v1/tours?sort=-price pass "-" for decending order

    //when sorting have tie eg two product have same price then we pass other thing as tie breaker
    //http://localhost:3000/api/v1/tours?sort=price,ratingsAverage
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ')
      query = query.sort(sortBy)
    } else {
      //it is the default sorting
      query = query.sort('-createdAt')
    }


    //!3) Field Limiting
    //http://localhost:3000/api/v1/tours?fields=name,duration,difficulty,price
    //it is like restricting the data which we want in the response like only share the price and difficulty
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ')
      query = query.select(fields)
    } else {
      //'-__v' means we are excluding the '__v' from the response means everything except __v
      query = query.select('-__v')
    }


    //!4) Pagination
    // eg page=3&limit=10, basically we provide the article to skip according to page and limit to show next
    // query = query.skip(20).limit(10)

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit)


    //below is for handling the error of asking no page more than data in database
    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) {
        throw new Error('This page does not exist')
      }
    }


    //EXECUTE QUERY
    const tours = await query

    //! old method for finding data with the query
    // const tours = await Tour.find({
    //   duration : 5,
    //   difficulty : 'easy'
    // })


    //!mongoose method for finding data with the query(chaining method)
    // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')


    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error
    })
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