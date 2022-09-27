//crypto is the built in package, no need to addational download
const crypto = require('crypto')
const validator = require('validator');
const mongoose = require('mongoose');
//This package used for encrypting the password in node js
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    //below is for not showing the password in reponse to client
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!! not on the update
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  //initial phase we don't create it but whenever password gets updated, we have to update the below key, it helps to check the jwt token whether jwt is of old password or new password
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    //below is for not showing the password in reponse to client
    select: false
  }
});


userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified, ismodified is the in-built method
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12(unit of cpu internsive during this operation, generally use 12)
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field, because after encryption we don't want to again store the password in passwordconfirm
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', function(next){
  if (!this.isModified('password') || this.isNew ) return next()

  this.passwordChangedAt = Date.now() - 1000
  next()
})

// below is the query means that we want to alwAYS gives the active=true objects to all the find methods. so that inactive or so called deleted objects do not go to the response 
// /^find/ means run on every query sarts with find
userSchema.pre(/^find/, function(next){
  // This points to the current query
  this.find({ active: {$ne: false} });
  next()
})


//INSTANCE METHOD - This method is available on alll doucments of mentioned routes
//correctPassword is the instance function
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
  //basicallly the bcrypt has the encription not the decryption. so we encrypt the entered password and compare it with stored encrypt password
  // the compare is inbuilt of bcrypt
  return await bcrypt.compare(candidatePassword, userPassword)
} 
//INSTANCE METHOD - This method is available on alll doucments of mentioned routes
userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt( this.passwordChangedAt.getTime()/1000, 10 )
    // console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp
  }
  //FALSE means NOT changed
  return false 
}

//INSTANCE METHOD
userSchema.methods.createPasswordResetToken = function (){
  // below is use to create some random token by inbuilt crypto
  const resetToken = crypto.randomBytes(32).toString('hex')
  // below is encrypting the token so that hancker cant access it because we are going to save it in the database
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 //10 * 60 * 1000 is use for setting the expiration by 10 min after creation of token

  return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User