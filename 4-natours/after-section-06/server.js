const mongoose = require('mongoose')
//environment variable are outside the scope of express so it is placed inside the server.js not in the app.js
// console.log(app.get('env'));  it gives the enviroment which we are working like development or production
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');

//below is to connect the link between the node and mongo
mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useCreateIndex: true
}).then(() =>{
  console.log("DB connection successful");
})


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
