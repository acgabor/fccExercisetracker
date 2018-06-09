const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const moment = require('moment')

const db = require('./db.js');
var Exercise = db.ExerciseModel;
var User = db.UserModel;

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI,{useMongoClient: true})

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => { 
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/log',function(req,res){
  var userId=req.query['userId'];
  var dateFrom=req.query['from'];
  var dateTo=req.query['to'];
  var limitNum=parseInt(req.query['limit']);
  
  if (!Number.isInteger(limitNum)){
    limitNum=0;
  }
  if (dateFrom){
    dateFrom=new Date(dateFrom);
  }else{
    dateFrom=new Date(0);
  }
  if (dateTo){
    dateTo=new Date(dateTo);
  }else{
    dateTo=new Date();
  }
  
  /*
  Exercise.find({
  
    "$expr": { 
       "$and": [
           { "$eq": ["$userId", "userId"]}
       ]
    }
    
  }).limit(limitNum).exec(function(err, users) {
   res.json(users); 
  });
  */
  db.checkUserIDExistance(userId,function(err,username){
    console.log(username)
    console.log(userId)
      if(username){
        Exercise.find({userId:userId,date:{$gt:dateFrom,$lt:dateTo}},{'description':1,'duration':1,'date':1,'_id':0}).limit(limitNum).exec(function(err, users) {
          if (users==undefined){
          users=[]
          }
          res.json({"_id":userId,"username":username,"count":users.length,"log":users})
        });
      }else{
          res.send('User id does not exist in the database.');
      };
  });

  /*
  Exercise.find({userid:userId,date:{$gt:dateFrom,$lt:dateTo}}).limit(limitNum).exec(function(err, users) {
   res.json(users); 
  });
  */
});


app.get('/api/exercise/users',function(req,res){
  User.find({}, {_id:1,username:1}, function(err, users) {
   res.json(users); 
  });
});

app.post('/api/exercise/add',function(req,res){
  var userId=req.body['userId'];
  var excDate=req.body['date'];
   
    db.checkUserIDExistance(userId,function(err,username){
      if(username){
        var exercise=new Exercise({'userId':userId,"username":username,'description':req.body['description'],'duration':req.body['duration'],'date':excDate})
        exercise.save(function(err,exc){
          if (err) res.json(err);
          db.removeAboveExercise(req.body['userId'],function(err,data){
            res.json({"_id":exc['userId'],"username":exc['username'],"description":exc['description'],"duration":exc['duration'],"date":moment(exc['date']).format('YYYY-MM-DD')});
          });
        });
      }else{
        res.send('User id does not exist in the database.');
      };
    });
});

app.post('/api/exercise/new-user',function(req,res){
    var username=req.body['username']
    var user=new User({'username':username})
    
    db.checkUserExistance(username,function(err,isExist){
      if(isExist){
        res.send('User name already exists in the database');
      }else{
        user.save(function(err,savedUser){
          if (err) res.json(err);
          db.removeAboveUser(function(err,data){
            res.json({"_id":savedUser['_id'],"username":savedUser['username']});
          });
        });
      };
    });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
