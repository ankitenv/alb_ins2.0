
/*
 * GET competition listing.
 */

var mysql = require('mysql'),
	crypto = require('crypto'),
	express = require('express'),
	moment = require('moment'),
	db = "mysql://root:@localhost/game_portal_db",
    Query=function(db_name){
		this.getPlayerIdQuery = "SELECT p.id FROM "+ db_name +".player p WHERE  p.user_id_fk = ?";
		this.getAvailableCompetitionQuery = " SELECT c.id, c.competition_name, c.date, c.competition_time "+
											"	FROM "+ db_name +".competition c "+
											"	JOIN "+ db_name +".competition_groups cg "+
											"	ON c.id=cg.competition_id_fk "+
											"	WHERE cg.group_id_fk "+
											"	in( "+
											"	   SELECT g.group_id_fk FROM "+ db_name +".group_player g WHERE g.player_id_fk =? "+
											"	) "+
											"	AND NOW()<= DATE_ADD(c.date, INTERVAL c.competition_time MINUTE)";
		this.getAvailableTestQuery = " SELECT t.id, t.test_name, t.date, t.time_allowed "+
											"	FROM "+ db_name +".test t "+
											"	JOIN "+ db_name +".test_groups tg "+
											"	ON t.id=tg.test_id_fk "+
											"	WHERE tg.group_id_fk "+
											"	in( "+
											"	   SELECT g.group_id_fk FROM "+ db_name +".group_player g WHERE g.player_id_fk =? "+
											"	) "+
											"	AND NOW()<= DATE_ADD(t.date, INTERVAL t.time_allowed MINUTE)";
		this.getPersonalGameQuery = " SELECT p.id, p.game_name, p.game_time, p.game_string, p.scores FROM "+ db_name +".personal_game p WHERE p.player_id_fk=?";
		
	};
	

 
exports.index = function(req, res){
	
	var user_id = parseInt(req.param("ud")),
		user_type = parseInt(req.param("ut")),
		db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		player_id;
	var client = mysql.createConnection(db);
	client.connect();	
	switch(user_type){
		case 3 : client.query(listQuery.getPlayerIdQuery,
					[user_id],
					function (err, results, fields) {
					var data = results[0];
					
						player_id = data.id;
						client.query(listQuery.getAvailableCompetitionQuery,
							[player_id],
							function (err, competitionList, fields) {
								var _competitions=[];
								for(var i=0; i<=competitionList.length-1;i++){
									var com=competitionList[i],_competiton={};
													
									_competiton["id"]=com.id;
									_competiton["competition_name"]=com.competition_name;
									_competiton["date"]=com.date;
									_competiton["players"]=[];
									
									var current_time					= 	moment(),
										start_time						= 	moment(com["date"]),
										end_time						= 	moment(com["date"]).add('m',com["competition_time"]);
									
									if(current_time<start_time){
										_competiton["status"]="not Started";
										_competiton["statusText"]="start in "+dateDiff(start_time,current_time);
									}
									if(start_time<current_time&& current_time<end_time){
										_competiton["status"]="Runnning";
										_competiton["statusText"]="started "+dateDiff(current_time,start_time)+" before and ends in "+dateDiff(end_time,current_time);
									}
									if(end_time<current_time){
										_competiton["status"]="Ended";
										_competiton["statusText"]="has been Ended "+dateDiff(current_time,end_time)+" before";
									
									}					
									if(start_time==current_time){
										_competiton["status"]="Just Started";
										_competiton["statusText"]="just Started";
									
									}
									if(current_time==end_time){
										_competiton["status"]="Just Ended";
										_competiton["statusText"]="is just Ended";
									
									}
									_competitions.push(_competiton);
								}
								client.query(listQuery.getAvailableTestQuery,
									[player_id],
									function (err, testList, fields) {
										console.log(testList);
										var _tests=[];
										for(var i=0; i<=testList.length-1;i++){
											var test=testList[i],_test={};
											_test["id"]=test.id;
											_test["test_name"]=test.test_name;
											_test["date"]=test.date,
											_test["players"]=[];
											
											var current_time					= 	moment(),
												start_time						= 	moment(test["date"]),
												end_time						= 	moment(test["date"]).add('m',test["time_allowed"]);
									
											if(current_time<start_time){
												_test["status"]="not Started";
												_test["statusText"]="start in "+dateDiff(start_time,current_time);
											}
											if(start_time<current_time && current_time<end_time){
												_test["status"]="Runnning";
												_test["statusText"]="started "+dateDiff(current_time,start_time)+" before and ends in "+dateDiff(end_time,current_time);
											}
											if(end_time<current_time){
												_test["status"]="Ended";
												_test["statusText"]="has been Ended "+dateDiff(current_time,end_time)+" before";
											
											}					
											if(start_time==current_time){
												_test["status"]="Just Started";
												_test["statusText"]="just Started";
											
											}
											if(current_time==end_time){
												_test["status"]="Just Ended";
												_test["statusText"]="is just Ended";
											
											}
											_tests.push(_test);
										}
										var player = {id : player_id};
										
										client.query(listQuery.getPersonalGameQuery,
											[player_id],
											function (err, personalGameList, fields) {
												client.end();
												var _personalGames=[];
												for(var i=0; i<=personalGameList.length-1;i++){
													var game=personalGameList[i],_game={},scores=game.scores.split('|');
													_game["id"]=game.id;
													_game["name"]=game.game_name;
													_game["time"]=game.game_time;
													for(var j=0; j<scores.length; j++) { scores[j] = parseInt(scores[j], 10); } 
													var Max=scores[0];
													for(var k=0; k<scores.length; k++) { if(scores[k]>Max)Max=scores[k]; } 
													_game["highestScore"]=Max;
													_personalGames.push(_game);
													
												}
												res.render("list",{ 
																	tests : _tests,
																	competitions : _competitions ,
																	personal_games : _personalGames,
																	player : player 
																});
											});
								 });
						 });
				 });
	}
};

exports.getPlayerId=function(req, res){
	var user_id = parseInt(req.param("u")),
		db_name = req.app.get('db_name'),
		listQuery = new Query(db_name),
		client = mysql.createConnection(db);
		client.connect();	
		client.query(listQuery.getPlayerIdQuery,
			[user_id],
			function (err, results, fields) {
				client.end();
				res.writeHead(200, {'content-type': 'text/json' });
				res.write( JSON.stringify(results) );
				res.end('\n');
		});
};

function getCurrentDate(){
	var date = new Date();
	return date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();		
}
function getData(results){
	var data;
	for (var i in results) {
		data = results[i];
	}
	console.log(data);
	return data;
}
function dateDiff(a,b){

	var result="",a=moment(a),b=moment(b);
	if(a.diff(b,'years')>0){
		result=a.diff(b,'years')+" years";
	}
	else if(a.diff(b,'months')>0){
		result=a.diff(b,'months')+" months";
	}
	else if(a.diff(b,'weeks')>0){
		result=a.diff(b,'weeks')+" weeks";
	}
	else if(a.diff(b,'days')>0){
		result=a.diff(b,'days')+" days";
	}
	else if(a.diff(b,'hours')>0){
		result=a.diff(b,'hours')+" hours";
	}
	else if(a.diff(b,'minutes')>0){
		result=+a.diff(b,'minutes')+" minutes";
	}
	else if(a.diff(b,'seconds')>0){
		result=+a.diff(b,'seconds')+" seconds";
	}
	return result;
}
