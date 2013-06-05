

var mysql = require('mysql'),
	crypto = require('crypto'),
	express = require('express'),
	db = "mysql://root:@localhost/game_portal_db",
    Query=function(db_name){
		this.getGameInfoQuery = "SELECT p.game_name, p.game_time, p.limited_time_target FROM game_portal_db.personal_game p WHERE p.id = ?";
		this.getGameQuery = "SELECT p.id, p.player_id_fk, p.game_name, p.game_time, p.game_string, p.scores FROM "+ db_name +".personal_game p WHERE p.id=? and p.player_id_fk=?";
		this.getPlayerInfoQuery = "SELECT p.id, p.player_name, p.player_code, sc.id as class_id, "+
								"	sc.class_name, sg.id as grade_id, sg.grade_name, s.id as school_id, "+
								"	s.school_name, s.school_code FROM "+ db_name +".player p "+
								"	JOIN "+ db_name +".school_class sc ON p.player_class_id_fk = sc.id "+
								"	JOIN "+ db_name +".school_grades sg ON sc.grade_id_fk= sg.id "+
								"	JOIN "+ db_name +".school s ON s.id = sg.school_id_fk "+
								"	WHERE p.id=?";
		this.upadatePlayerScoreQuery = "UPDATE "+ db_name +".competition_score c SET c.score=? WHERE c.competition_id_fk=? and c.player_id_fk=?";
		this.checkPlayerScoreExists = "SELECT count(c.id) FROM "+ db_name +".competition_score c WHERE c.competition_id_fk=? and c.player_id_fk=?";
		this.insertPlayerScoreQuery = "INSERT INTO "+ db_name +".competition_score (competition_id_fk, player_id_fk, score) values (?, ?, ?)";
		this.selectPlayerScoreQuery = "SELECT c.score FROM "+ db_name +".competition_score c  WHERE c.competition_id_fk=? AND c.player_id_fk=?";
		this.getPlayerNameQuery = "SELECT p.player_name FROM "+ db_name +".player p WHERE p.id=?";
		
		
	};

 
exports.index = function(req, res){
	res.render("game");
};

exports.getGameInfo = function(req, res){
	var player_id = parseInt(req.param("p")),
		game_id = parseInt(req.param("i")),
		db_name = req.app.get('db_name'),
		listQuery = new Query(db_name);
		var client = mysql.createConnection(db);
		client.connect();
		client.query(listQuery.getGameInfoQuery,
			[game_id],
			function (err, testInfo, fields) {
				client.end();
				listQuery=null;
				res.writeHead(200, {'content-type': 'text/json' });
				res.write( JSON.stringify(testInfo) );
				res.end('\n');	
		});
}


exports.getGame = function(req, res){
	var player_id = parseInt(req.param("p")),
		game_id = parseInt(req.param("i")),
		db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		client = mysql.createConnection(db);
		client.connect();
		console.log("Player ID : "+player_id);
		client.query(listQuery.getGameQuery,
			[game_id ,player_id],
			function (err, gameResult, fields) {
				client.end();
				listQuery=null;
				res.writeHead(200, {'content-type': 'text/json' });
				res.write( JSON.stringify(gameResult) );
				res.end('\n');	
		});
		
}


exports.getPlayerName = function(req, res){
	var player_id = parseInt(req.param("id")),
		db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		client = mysql.createConnection(db);
		client.connect();
		client.query(listQuery.getPlayerNameQuery,
			[player_id],
			function (err, playerName, fields) {
				client.end();
				listQuery=null;
				res.writeHead(200, {'content-type': 'text/json' });
				res.write( JSON.stringify(playerName) );
				res.end('\n');	
		});
		
}

exports.getPlayerInfo = function(req, res){
	var player_id = parseInt(req.param("id")),
		db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		client = mysql.createConnection(db);
		client.connect();
		client.query(listQuery.getPlayerInfoQuery,
			[player_id],
			function (err, playerInfo, fields) {
				client.end();
				listQuery=null;
				res.writeHead(200, {'content-type': 'text/json' });
				res.write( JSON.stringify(playerInfo) );
				res.end('\n');	
		});
				
}

exports.getLevelCards = function (req, res){
	var db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		client = mysql.createConnection(db);
		client.connect();
	client.query(listQuery.getGameLevelCardsQuery,
				[req.param("id")],
				function (err, levelCardData, fields) {
				client.end();
				listQuery=null;
				res.writeHead(200, {'content-type': 'text/json' });
				res.write( JSON.stringify(levelCardData) );
				res.end('\n');
	});
}
exports.getLevelFunctions = function (req, res){
	var db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		client = mysql.createConnection(db);
		client.connect();
		
	client.query(listQuery.getGameLevelFunctionsQuery,
				[req.param("id")],
				function (err, levelFunctionData, fields) {
					client.end();
					listQuery = null;
					res.writeHead(200, {'content-type': 'text/json' });
					res.write( JSON.stringify(levelFunctionData) );
					res.end('\n');
	});
}
exports.updatePlayerScore = function (req, res){
	var db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		player_id = req.param("p"),
		comp_id = req.param("c"),
		client = mysql.createConnection(db);
		client.connect();
		
	client.query(listQuery.checkPlayerScoreExists,
				[req.param("pid"),req.param("pid")],
				function (err, levelFunctionData, fields) {
					client.end();
					listQuery = null;
					res.writeHead(200, {'content-type': 'text/json' });
					res.write( JSON.stringify(levelFunctionData) );
					res.end('\n');
	});
}
function getCurrentDate(){
	var date = new Date();
	return date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();		
}
function getData(results){
	var data;
	for (var i in results) {
		data = results[i];
	}
	return data;
}

