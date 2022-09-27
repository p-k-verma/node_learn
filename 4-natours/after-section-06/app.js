const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES

//* below is for set the security HTTP Headers
app.use(helmet()) // helmet should be placed at the top of beginning

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// below is used for limiting the request from the same IP, it is middleware by using 3rd party package
const limiter = rateLimit({
  max: 100, // this is no of hit allowed
  windowMs: 60 * 60 * 1000, // this is the time period
  message: 'Too many requests from this IP, please try again in an hour!'
})
app.use('/api', limiter) // we have applied this limiter to api only

//Body parser, reading data from body into req.body
app.use(express.json({ limit : '10kb' }));  // here 10 kb means max 10kb data can come in body


//* Data sanitization against NoSQL query injection
app.use(mongoSanitize()) // it will lookout all the query and params and filter out all the params and query having the dollar sign


//* Data sanitization against XSS
app.use(xss()) // it will convert all the hacker html and javascript symbol into special code so that it dont run in our code

//* It prevent the parameter pollution, it clear the quey string having tha mailicous or duplicate string and convert to one by using the last one
app.use(hpp({
  whitelist: [ 'duration','ratingsAverage','ratingQuantity','maxGroupSize','difficulty','price' ] // whitelist is the property which is allowed the duplicacy
})) // hpp means http paramter pollution

//below is for serving static file from folder.
//this is for serving the static file like html, image, etc, here we define the path so express go for the path if it doesn't find out the regular route path then it go for the static path to search and to according to the name it show the thing like for overview.html for html file, /img/pin.png for the ping image
app.use(express.static(`${__dirname}/public`));

// Test middleware
//! the order of execution of the middleware is the order of code
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//!we nee the create handler function for all the routes that are not cached by our routes, it is below the tour and router becuse we want to check after it
//we added all here because it shoul work on all like get,post,put,patch etc. * means everything
app.all('*', (req, res, next)=> {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl} on the server!`
  // })
  //* above is for nomal error handling without global handling

  //* below is for throwing error to global error handling if any error comes, global error is written below but we have written class based in utilis folder
  // const err = new Error(`can't find ${req.originalUrl} on the server!`)
  // err.status = 'fail'
  // err.statusCode = 404
  // next(err) //!if we pass anything in the next in middleware, it will skip all middleware and only execute the gloal error which is written below
  next(new AppError(`can't find ${req.originalUrl} on the server!`, 404)) 
})


//below is the Global error handling middleware of express
app.use(globalErrorHandler) 
module.exports = app;
