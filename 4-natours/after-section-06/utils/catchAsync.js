//basically what happen is in tourcontroller, we have the async function in which we have write catch block of evry async evryting everytime.
//so there was the code repetition. so we did that we wrap the async in catchAsync function in which we have written one time catch block, if any error comes it throws the error in central error handling system
//so this we have prevented the ctach block repeation in sync call
module.exports = fn => {
    return (req, res, next)=> {
        fn(req, res,next).catch(next)
    }
}