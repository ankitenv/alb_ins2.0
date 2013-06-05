

var mysql = require('mysql'),
	crypto = require('crypto'),
	express = require('express'),
	db = "mysql://root:@localhost/game_portal_db",
    Query=function(db_name){
		this.getTestInfoQuery=" SELECT t.test_name, t.limited_time_target, t.time_allowed FROM "+ db_name +".test t WHERE t.id=?";
		this.getTestGameLevelQuery =" SELECT g.level_name, g.id, g.total_targets FROM "+ db_name +".game_level g WHERE g.id in ( "+
									"	SELECT t.game_level_id_fk FROM "+ db_name +".test_game_level t WHERE t.test_id_fk =? "+
									"	) and g.forCompetition=0 order by g.id";
		this.getTestCardsQuery = "SELECT  g.card_number FROM "+ db_name +".game_level_cards g WHERE g.game_level_id_fk = ? ORDER BY g.card_number";
		this.getTestFunctionsQuery = "SELECT g.game_funtion FROM "+ db_name +".game_level_function g WHERE g.game_level_id_fk = ?";
		this.getPlayerInfoQuery = "SELECT p.id, p.player_name, p.player_code, sc.id as class_id, "+
								"	sc.class_name, sg.id as grade_id, sg.grade_name, s.id as school_id, "+
								"	s.school_name, s.school_code FROM "+ db_name +".player p "+
								"	JOIN "+ db_name +".school_class sc ON p.player_class_id_fk = sc.id "+
								"	JOIN "+ db_name +".school_grades sg ON sc.grade_id_fk= sg.id "+
								"	JOIN "+ db_name +".school s ON s.id = sg.school_id_fk "+
								"	WHERE p.id=?";
		this.upadatePlayerScoreQuery = "UPDATE "+ db_name +".test_score c SET c.score=? WHERE c.test_id_fk=? and c.player_id_fk=?";
		this.checkPlayerScoreExists = "SELECT count(c.id) FROM "+ db_name +".test_score c WHERE c.test_id_fk=? and c.player_id_fk=?";
		this.insertPlayerScoreQuery = "INSERT INTO "+ db_name +".test_score (test_id_fk, player_id_fk, score) values (?, ?, ?)";
		this.selectPlayerScoreQuery = "SELECT c.score FROM "+ db_name +".test_score c  WHERE c.test_id_fk=? AND c.player_id_fk=?";
		this.getPlayerNameQuery = "SELECT p.player_name FROM "+ db_name +".player p WHERE p.id=?";
		
		
	};

 
exports.index = function(req, res){
	res.render("test");
};

exports.getTestInfo = function(req, res){
	var player_id = parseInt(req.param("p")),
		test_id = parseInt(req.param("i")),
		db_name = req.app.get('db_name'),
		listQuery = new Query(db_name);
		var client = mysql.createConnection(db);
		client.connect();
		client.query(listQuery.getTestInfoQuery,
			[test_id],
			function (err, testInfo, fields) {
				client.end();
				listQuery=null;
				res.writeHead(200, {'content-type': 'text/json' });
				res.write( JSON.stringify(testInfo) );
				res.end('\n');	
		});
}


exports.getTestLevel = function(req, res){
	var player_id = parseInt(req.param("p")),
		test_id = parseInt(req.param("i")),
		db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		client = mysql.createConnection(db);
		client.connect();	
		client.query(listQuery.getTestGameLevelQuery,
			[test_id],
			function (err, gameLevels, fields) {
				client.end();
				listQuery=null;
				res.writeHead(200, {'content-type': 'text/json' });
				res.write( JSON.stringify(gameLevels) );
				res.end('\n');	
		});
		
}
exports.TestgetPlayerName = function(req, res){
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
exports.getTestPlayerInfo = function(req, res){
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
exports.getTestLevelCards = function (req, res){
	var db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		client = mysql.createConnection(db);
		client.connect();	
	client.query(listQuery.getTestCardsQuery,
				[req.param("id")],
				function (err, levelCardData, fields) {
				client.end();
				listQuery=null;
				res.writeHead(200, {'content-type': 'text/json' });
				res.write( JSON.stringify(levelCardData) );
				res.end('\n');
	});
}
exports.getTestLevelFunctions = function (req, res){
	var db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		client = mysql.createConnection(db);
		client.connect();	
		client.query(listQuery.getTestFunctionsQuery,
				[req.param("id")],
				function (err, levelFunctionData, fields) {
					client.end();
					listQuery = null;
					res.writeHead(200, {'content-type': 'text/json' });
					res.write( JSON.stringify(levelFunctionData) );
					res.end('\n');
	});
}
exports.updateTestPlayerScore = function (req, res){
	var db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		player_id = req.param("p"),
		test_id = req.param("t"),
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

