
/*
 * GET home page.
 */
var mysql = require('mysql'),
	crypto = require('crypto'),
	express = require('express'),
	db = "mysql://root:@localhost/game_portal_db";

exports.index = function(req, res){
  res.render('login');
};
exports.post = function(req, res){
	var password=crypto.createHash("md5").update(req.body.password).digest("hex");
	client = mysql.createConnection(db);
	client.connect();
		client.query("SELECT u.id, u.user_type FROM "+req.app.get('db_name')+".user_info u WHERE u.email=? and  u.password=?",
				[req.body.usermail,password],
				function (err, results, fields) {
				client.end();
				var user;
					for (var i in results) {
						user = results[i];
					}
					if (user) {
						var redirect_url="/list?ud="+user.id+"&ut="+user.user_type;
						res.redirect(redirect_url);
						console.log("Welcome to GAME");
					}
					else {
						console.log('login failed');
					}
				}
    );
}

