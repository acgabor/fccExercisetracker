const db = require('./db.js');
var Exercise = db.ExerciseModel;
var User = db.UserModel;
const moment = require('moment')

const router = require('express').Router()

router.get('/log',function(req,res){
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
  db.checkUserIDExistance(userId,function(err,username){
    if(username){
      Exercise.aggregate([
        { $match: { 
                  userId: userId,
                  date:{$gt:dateFrom,$lt:dateTo}
                  }

        },
        {$limit:5},
        { $group: {
                  _id: null,
                  count: {$sum: 1},
                  }
        },
        { $project: { userId: userId, count:1 , _id:0, username:username, description:'$description'}
        }
      ]).exec(function(err,users){
        console.log(err)
        res.json(users);
        })
    }else{
        res.send('User id does not exist in the database.');
    };
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

});


router.get('/users',function(req,res){
  User.find({}, {_id:1,username:1}, function(err, users) {
   res.json(users); 
  });
});

router.post('/add',function(req,res){
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

router.post('/new-user',function(req,res){
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

module.exports=router;
