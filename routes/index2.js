var express = require('express');
var session = require('express-session');
var router = express.Router();
var mongoose=require('mongoose');
var nodemailer = require('nodemailer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',{user:req.user});
});
router.get('/forum',function(req,res){
	addquestion.find({},function(err,ques){
		renderResult(res,ques,req);
	});
});

function renderResult(res,ques,req) {
  res.render('forum', {question:ques,user:req.user},
    function(err, result) {
      if (!err) {res.end(result);}
      else {res.end('Oops ! An error occurred.');
        console.log(err);}
});
}
//for logout
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
//for forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot', {
    user: req.user
  });
});
// router.get('/login',function(req,res){
// 	res.render('login',{user:req.user});
// });
// router.get('/profile',function(req,res){
// 	res.render('profile');
// });
// router.get('/User',function(req,res){
// 	res.render('User');
// });
// router.get('/signin',function(req,res){
// 	res.render('signin');
// });
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user, error) {
    if (err) return done(err);
    if (!user){
    	req.flash('error','sorry incorrect password ');
    	return done(null, false, { messages: 'Incorrect username.' });
    }
    user.comparePassword(password, function(err, isMatch, error) {
      if (isMatch) {
        return done(null, user);
      } else {
      	req.flash('error','sorry incorrect password ');
        return done(null, false, { messages: 'Incorrect password.' });
      }
    });
  });
}));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
var userSchema= new mongoose.Schema({
	 username:{type:String ,require:true,unique:true},
	 email:{type:String ,require:true,unique:true},
	 password:{type:String ,require:true},
	 resetPasswordToken: String,
  	 resetPasswordExpires: Date
});
userSchema.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});
userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};
var forumquestion=new mongoose.Schema({
	qid:{type:String,require:true,index:{unique:true}},
	question:{type:String,require:true},
	description:{type:String},
	tags:{type:[String],index:true},
	date:{type:Date,default:Date.now},
	answer:{type:[String],index:true}
});
var forumans=new mongoose.Schema({
	aid:{type:String,require:true, index:{unique:true}},
	answer:{type:String,require:true},
	comment:{type:[String], index:true},
	like:{type:Number},
	dislike:{type:Number},
	date:{type:Date,default:Date.now}
});
var forumcom=new mongoose.Schema({
	cid:{type:String,require:true,index:{unique:true}},
	comment:{type:String,require:true},
	like:{type:Number},
	dislike:{type:Number},
	date:{type:Date,default:Date.now}
});
var User=mongoose.model('User',userSchema);

var addquestion=mongoose.model('addquestion',forumquestion);
var addanswer=mongoose.model('addanswer',forumans);
var addcomment=mongoose.model('addcomment',forumcom);
//for User
// router.post('/newuser',function(req,res){
// 	new User({
// 	 username:req.body.username,
// 	 firstname:req.body.firstname,
// 	 lastname:req.body.lastname,
// 	 password:req.body.password
// 	}).save(function(err,up){
// 		if(err)
// 			res.send("error");
// 		else{
			
// 		 res.render('index',{myvar:1});}
// 	});
// });
//for static variable 
var uniqueID = (function() {
   var id ;
   addquestion.count({},function(err,c)
		{
			id=c;
			console.log('Count is '+id);
		});
     return function() { return ++id; };  
})();  

router.post('/addquestion',function(req,res){
		var qids="q"+uniqueID();
		new addquestion({
		qid:qids,
	question:req.body.question,
	description:req.body.description,
	tags:req.body.tags
	
	}).save(function(err,qdocs){
		if(err){res.json(err);
			res.send("plz try other user name");}
		else 
		{
	//		res.location('forum');	
			return res.redirect('/forum',{user:req.user});
		}
	});
});
// router.post('/user',function(req, res){
// 	User.find({$and:[{username : req.body.username},{password : req.body.password}]}, function(err, docs){
// 		if(docs.length){
// 			console.log(docs);
// 			res.send("successfully signin!! :)");
// 		}
// 		else{
// 			res.json(err);
// 			res.send("incorrect id and password");
// 		}
// 	});
// });

// router.post('/user', function(req, res){
//   	User.find({$and:[{username : req.body.username},{password : req.body.password}]}, function (err, docs){
//         if (docs.length){
//             console.log(docs);
//             res.send("Signed in Successfully !");
//         }else{
//         	res.json(err);
//             res.send("Incorrect user id or password !");
//             }    
//     });
// });
// router.post('/login', function(req, res){
//   	User.find({$and:[{username : req.body.username},{password : req.body.password}]},'username', function (err, docs){
//         if (docs.length){ console.log(docs);
//             //res.send("Signed in Successfully !");
//             res.render('profile',{myvar:1});
            
//         }else{
//         	res.send("wrong pwd or username");
//         	//return handleError(err);
//             }    
//     });
// });
// router.post('/user',function(req,res){
// User.findOne({ 'name.last': 'Ghost' }, 'name occupation', function (err, person) {
//   if (err) return handleError(err);
//   console.log('%s %s is a %s.', person.name.first, person.name.last, person.occupation) // Space Ghost is a talk show host.
// });
// })
//FOR User//
router.post('/User', function(req, res) {
  var user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    });

  user.save(function(err) {
    req.logIn(user, function(err) {
      res.redirect('/');
    });
  });
});
// FOR LOGIN//
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err); 
    if (!user) {
    	req.flash('info','sorry');	
      return res.redirect('/')
    }
    req.logIn(user, function(err, info) {
      if (err) return next(err);
      req.flash('info','Hiii '+ user.username +' login successfully');
      return res.redirect('/',{user:req.user});	
    });
  })(req, res, next);
});
//for sending mail
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000*60; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      //var smtpTransport = nodemailer.createTransport('SMTP', {
        var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'shubhampatwa526@gmail.com',
          pass: '7869327537'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'shubampatwa@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});
//to reset password
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
});
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var transportor = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'shubhampatwa526@gmail.com',
          pass: '7869327537'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'shubhampatwa526@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transportor.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});
module.exports = router;
