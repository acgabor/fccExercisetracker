const mongoose=require('mongoose');

var ExerciseSchema=new mongoose.Schema({
  userId: {type:String,required:true},
  username: {type:String,required:true},
  description: {type:String,required:true},
  duration: {type:Number,required:true},
  date:  { type: Date, default: Date.now }
})
var UserSchema=new mongoose.Schema({
  username: {type:String,required:true}
})
var Exercise=mongoose.model('Exercise',ExerciseSchema)
var User=mongoose.model('ExerciseUser',UserSchema)

var removeAboveUser = function(done) {  
  User.find({}).sort({"_id":-1}).limit(10).exec(function(err,data){
    var lastID=data[data.length-1]['_id'];
    User.remove({_id:{$lt:lastID}},function(err,data){
      if(err) done(err);
      Exercise.remove({userId:{$lt:lastID}},function(err,data){
        if(err) done(err);
        done(null,data);
      })
    });
  });
};

var removeAboveExercise = function(userID,done) {  
  Exercise.find({"userId":userID}).sort({"_id":-1}).limit(10).exec(function(err,data){
    var lastID=data[data.length-1]['_id'];
    Exercise.remove({_id:{$lt:lastID},"userId":userID},function(err,data){
      if(err) done(err);
      done(null,data);
    });
  });
};

var checkUserExistance = function(username,done){
  User.find({"username":username},function (err,data){
    if(err) done(err,false);
    console.log(data)
    if (data.length>0){
      done(null,true);
    }else{
      done(null,false);
    }
  })
};

var checkUserIDExistance = function(userId,done){
  User.find({"_id":userId},function (err,data){
    if(err) done(err,false);
    console.log(data)
    if (data.length>0){
      done(null,data[0]['username']);
    }else{
      done(null,false);
    }
  })
};

exports.ExerciseModel = Exercise;
exports.UserModel = User;
exports.removeAboveUser = removeAboveUser;
exports.removeAboveExercise = removeAboveExercise;
exports.checkUserExistance=checkUserExistance;
exports.checkUserIDExistance=checkUserIDExistance;