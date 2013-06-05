
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mysql = require('mysql')
  , crypto = require('crypto')
  , moment = require('moment')
  
  // routes definition
  , main = require('./routes/main')
  , list = require('./routes/list')
  , login = require('./routes/index')
  , competition = require('./routes/competition')
  , test = require('./routes/test')
  , game = require('./routes/game')
  , db = "mysql://root:@localhost/game_portal_db";

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('db_name', "game_portal_db");
  
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  //app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});


app.configure('development', function(){
  app.use(express.errorHandler());
});


app.get('/', main.mainGET);
app.get('/login', login.index);
app.post('/login', login.post);
app.get('/list', list.index);
app.get('/getPlayerId', list.getPlayerId);
//competition routes
app.get('/competition', competition.index);
app.get('/getCompetitionLevel',competition.getCompetitionLevel);
app.get('/getLevelCards', competition.getLevelCards);
app.get('/getLevelFunctions', competition.getLevelFunctions);
app.get('/getPlayerInfo', competition.getPlayerInfo);
app.post('/updatePlayerScore', competition.updatePlayerScore);
app.get('/getPlayerName', competition.getPlayerName);
app.get('/getCompetitionInfo', competition.getCompetitionInfo);

//test routes
app.get('/test', test.index);
app.get('/getTestLevel',test.getTestLevel);
app.get('/getTestLevelCards', test.getTestLevelCards);
app.get('/getTestLevelFunctions', test.getTestLevelFunctions);
app.get('/getTestPlayerInfo', test.getTestPlayerInfo);
app.post('/updateTestPlayerScore', test.updateTestPlayerScore);
app.get('/TestgetPlayerName', test.TestgetPlayerName);
app.get('/getTestInfo', test.getTestInfo);

//game routes
app.get('/game', game.index);
app.get('/getGame',game.getGame);
app.get('/getGameInfo',game.getGameInfo);



var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

var competitions=[],
	dbCompetition=[],
	tests=[],
	dbTest=[];


io.sockets.on('connection', function (socket) {
	console.log("server connected on "+new Date());
	
	var getdbCompetition = setInterval( function() {
		var client = mysql.createConnection(db);
		client.connect();
		client.query("SELECT c.id, c.date, c.competition_time  FROM "+app.get('db_name')+".competition c WHERE NOW()<= DATE_ADD(c.date, INTERVAL c.competition_time MINUTE)",
			function (err, results, fields) {
				client.end();
				var comps = results;
				dbCompetition.length=0;
				if(comps){
					for(var i=0; i<=comps.length-1;i++){
						var com=comps[i],c={};
						c["id"]=com.id;
						c["date"]=com.date;
						c["competition_time"]=com.competition_time;
						dbCompetition.push(c);
					}
				}
			});
			
	},30000);
	
	var updateServerCompetition = setInterval( function() {
					for(var i=0; i<=dbCompetition.length-1;i++){
						var db_com				=	dbCompetition[i];
						if(!obj_in_array(db_com, competitions)){
							var _competiton					= {};
							_competiton["id"]				= db_com.id;
							_competiton["start_time"] 		= db_com.date;
							_competiton["total_time"] 		= db_com.competition_time;
							_competiton["players"]			= [],
							_competiton["finished_players"] = [],
							_competiton["over_players"] 	= [];
							competitions.push(_competiton);
							
						}
					}
					for(var i=0; i<=competitions.length-1;i++){
						var com								=	competitions[i],
							current_time					= 	moment(),
							start_time						= 	moment(com["start_time"]),
							end_time						= 	moment(com["start_time"]).add('m',com["total_time"]);
							if(current_time<start_time){
								com["status"]="not Started";
								com["statusText"]="start in "+dateDiff(start_time,current_time);
							}
							if(start_time<current_time&& current_time<end_time){
								com["status"]="Runnning";
								com["statusText"]="started "+dateDiff(current_time,start_time)+" before and ends in "+dateDiff(end_time,current_time);
							}
							if(end_time<current_time){
								com["status"]="Ended";
								com["statusText"]="has been Ended "+dateDiff(current_time,end_time)+" before";
							
							}					
							if(start_time==current_time){
								com["status"]="Just Started";
								com["statusText"]="just Started";
							
							}
							if(current_time==end_time){
								_competiton["status"]="Just Ended";
								_competiton["statusText"]="is just Ended";
							
							}
					}
				console.log("Competitions");		
				console.log(competitions);	
				socket.emit("competitionUpdates",{updates:competitions});
	
	}, 1000);
	
	var getdbTest = setInterval( function() {
		var client = mysql.createConnection(db);
		client.connect();
		client.query("SELECT t.id, t.date, t.time_allowed FROM "+app.get('db_name')+".test t WHERE NOW()<= DATE_ADD(t.date, INTERVAL t.time_allowed MINUTE)",
			function (err, results, fields) {
				client.end();
				var tests = results;
				dbTest.length=0;
				if(tests){
					for(var i=0; i<=tests.length-1;i++){
						var test=tests[i],t={};
						t["id"]=test.id;
						t["date"]=test.date;
						t["test_time"]=test.time_allowed;
						dbTest.push(t);
					}
				}
			});
			
	},30000);
	
	var updateServerTest = setInterval( function() {
					for(var i=0; i<=dbTest.length-1;i++){
						var db_test				=	dbTest[i];
						if(!obj_in_array(db_test, tests)){
							var t					= {};
							t["id"]					= db_test.id;
							t["start_time"] 		= db_test.date;
							t["total_time"] 		= db_test.test_time;
							t["players"]			= [],
							t["finished_players"] 	= [],
							t["over_players"] 		= [];
							tests.push(t);
							
						}
					}
					for(var i=0; i<=tests.length-1;i++){
						var test							=	tests[i],
							current_time					= 	moment(),
							start_time						= 	moment(test["start_time"]),
							end_time						= 	moment(test["start_time"]).add('m',test["total_time"]);
							if(current_time<start_time){
								test["status"]="not Started";
								test["statusText"]="start in "+dateDiff(start_time,current_time);
							}
							if(start_time<current_time&& current_time<end_time){
								test["status"]="Runnning";
								test["statusText"]="started "+dateDiff(current_time,start_time)+" before and ends in "+dateDiff(end_time,current_time);
							}
							if(end_time<current_time){
								test["status"]="Ended";
								test["statusText"]="has been Ended "+dateDiff(current_time,end_time)+" before";
							
							}					
							if(start_time==current_time){
								test["status"]="Just Started";
								test["statusText"]="just Started";
							
							}
							if(current_time==end_time){
								test["status"]="Just Ended";
								test["statusText"]="is just Ended";
							
							}
					}
				console.log("Tests");		
				console.log(tests);	
				socket.emit("testUpdates",{updates:tests});
	
	}, 1000);
	
	socket.on('addPlayertoCompetition' , function (data) {
		var ClientData = data,
			competition_id = ClientData.c,
			player_id = ClientData.p;
		for(var i=0;i<=competitions.length-1;i++){
			var obj = competitions[i];
				comp_id = obj["id"],
				players = obj["players"];
			if(parseInt(comp_id) === parseInt(competition_id)){
				if(in_array(player_id, players)){
					console.log("Player already connected playing competition");
				}
				else{
					console.log("add player to competition");
					players.push(parseInt(player_id));
					
				}
			}
		}
	});
	socket.on('setCompFinishedPlayers' , function (data) {
		var ClientData = data,
			competition_id = ClientData.i,
			player_id = ClientData.p;
		for(var i=0;i<=competitions.length-1;i++){
			var obj = competitions[i];
				comp_id = obj["id"],
				players = obj["players"],
				finishedPlayers = obj["finished_players"];
			if(parseInt(comp_id) === parseInt(competition_id)){
				if(in_array(player_id, players)){
					players.splice(players.indexOf(player_id), 1);
					finishedPlayers.push(parseInt(player_id));
				}
			}
		}
	});
	socket.on('setCompOverPlayers' , function (data) {
		var ClientData = data,
			competition_id = ClientData.i,
			player_id = ClientData.p;
		for(var i=0;i<=competitions.length-1;i++){
			var obj = competitions[i];
				comp_id = obj["id"],
				players = obj["players"],
				overPlayers = obj["over_players"];
			if(parseInt(comp_id) === parseInt(competition_id)){
				if(in_array(player_id, players)){
					players.splice(players.indexOf(player_id), 1);
					overPlayers.push(parseInt(player_id));
				}
			}
		}
	});
	socket.on('checkPlayerPlayCompetition' , function (data) {
		var ClientData = data,
			competition_id = ClientData.i,
			player_id = ClientData.p,
			result = 0;
		for(var i=0;i<=competitions.length-1;i++){
			var obj = competitions[i];
				comp_id = obj["id"],
				players = obj["players"],
				finishedPlayers = obj["finished_players"],
				overPlayers = obj["over_players"];
			if(parseInt(comp_id) === parseInt(competition_id)){
				if(in_array(player_id, finishedPlayers)){
					result=1;
				}
				else if(in_array(player_id, overPlayers)){
					result=2;
				}
				else if(in_array(player_id, players)){
					result=3;
				}
				else{
					result=4;
				}
				break;
			}
		}
		socket.emit('CompetitionPlayerPlayStauts',{result:result});
	});
	socket.on('getUpdatedCompetitionPlayer' , function (data) {
		var ClientData = data,
			competition_id = ClientData.c;
		for(var i=0;i<=competitions.length-1;i++){
			var obj = competitions[i];
				comp_id = obj["id"],
				players = obj["players"];
			if(parseInt(comp_id) === parseInt(competition_id)){
				socket.emit("updateCompetitionPlayerList",{p:players});
			}
		}	
	});
	socket.on("updateCompetitionPlayerScore",function(data){
		var ClientData=data,
			p=data.p,
			c=data.c,
			s=data.s;
		var client = mysql.createConnection(db);
		client.connect();
		client.query("SELECT count(c.id) as count FROM "+ app.get('db_name') +".competition_score c WHERE c.competition_id_fk=? and c.player_id_fk=?",
			[c, p],
			function (err, results, fields) {
				var obj = results[0];
					count = parseInt(obj.count);
				if(count>0){
					client.query("UPDATE "+ app.get('db_name') +".competition_score c SET c.score=? WHERE c.competition_id_fk=? and c.player_id_fk=?",
					[s, c, p],
					function (err, results, fields) {
						console.log("Player Score Updated on Server");
						client.end();
				
					});
				}
				else{
					client.query("INSERT INTO "+ app.get('db_name') +".competition_score (competition_id_fk, player_id_fk, score) values (?, ?, ?)",
					[c, p, s],
					function (err, results, fields) {
						console.log("Player Score Inserted on Server");
						client.end();
					});
				}
				
				
			});
	});
	
	
	socket.on('addPlayertoTest' , function (data) {
		var ClientData = data,
			test_id = ClientData.t,
			player_id = ClientData.p;
		for(var i=0;i<=tests.length-1;i++){
			var obj = tests[i];
				_test_id = obj["id"],
				players = obj["players"];
			if(parseInt(_test_id) === parseInt(test_id)){
				if(in_array(player_id, players)){
					console.log("Player already connected playing test");
				}
				else{
					console.log("add player to test");
					players.push(parseInt(player_id));
					
				}
			}
		}
	});
	socket.on('setTestFinishedPlayers' , function (data) {
		var ClientData = data,
			test_id = ClientData.i,
			player_id = ClientData.p;
		for(var i=0;i<=tests.length-1;i++){
			var obj = tests[i];
				_test_id = obj["id"],
				players = obj["players"],
				finishedPlayers = obj["finished_players"];
			if(parseInt(_test_id) === parseInt(test_id)){
				if(in_array(player_id, players)){
					players.splice(players.indexOf(player_id), 1);
					finishedPlayers.push(parseInt(player_id));
				}
			}
		}
	});
	socket.on('setTestOverPlayers' , function (data) {
		var ClientData = data,
			test_id = ClientData.i,
			player_id = ClientData.p;
		for(var i=0;i<=tests.length-1;i++){
			var obj = tests[i];
				_test_id = obj["id"],
				players = obj["players"],
				overPlayers = obj["over_players"];
			if(parseInt(_test_id) === parseInt(test_id)){
				if(in_array(player_id, players)){
					players.splice(players.indexOf(player_id), 1);
					overPlayers.push(parseInt(player_id));
				}
			}
		}
	});
	socket.on('checkPlayerPlayTest' , function (data) {
		var ClientData = data,
			test_id = ClientData.i,
			player_id = ClientData.p,
			result = 0;
		for(var i=0;i<=tests.length-1;i++){
			var obj = tests[i];
				_test_id = obj["id"],
				players = obj["players"],
				finishedPlayers = obj["finished_players"],
				overPlayers = obj["over_players"];
			if(parseInt(_test_id) === parseInt(test_id)){
				if(in_array(player_id, finishedPlayers)){
					result=1;
				}
				else if(in_array(player_id, overPlayers)){
					result=2;
				}
				else if(in_array(player_id, players)){
					result=3;
				}
				else{
					result=4;
				}
				break;
			}
		}
		socket.emit('TestPlayerPlayStauts',{result:result});
	});
	socket.on('getTestPlayerList' , function (data) {
			var ClientData = data,
			test_id = ClientData.c;
			for(var i=0;i<=tests.length-1;i++){
				var obj = tests[i];
				_test_id = obj["id"],
				 players = obj["players"];
				 if(parseInt(_test_id) === parseInt(test_id)){
					var pObj={p:players};
					socket.emit("updateTestPlayerList",pObj);
				}
			}	
	
	});
	socket.on("wowfunction",function(data){
		var ClientData=data,
			p=data.p,
			t=data.t,
			s=data.s;
			console.log(p+", "+t+", "+s);
		var client = mysql.createConnection(db);
		client.connect();
		client.query("SELECT count(t.id) as count FROM "+ app.get('db_name') +".test_score t WHERE t.test_id_fk=? and t.player_id_fk=?",
			[t, p],
			function (err, results, fields) {
				var obj = results[0];
					count = parseInt(obj.count);
				if(count>0){
					client.query("UPDATE "+ app.get('db_name') +".test_score t SET t.score=? WHERE t.test_id_fk=? and t.player_id_fk=?",
					[s, t, p],
					function (err, results, fields) {
						client.end();
						console.log("Player Score Updated on Server");
					});
				}
				else{
					client.query("INSERT INTO "+ app.get('db_name') +".test_score (test_id_fk, player_id_fk, score) values (?, ?, ?)",
					[t, p, s],
					function (err, results, fields) {
						client.end();
						console.log("Player Score Inserted on Server");
					});
				}
			});
	});
	socket.on('createPersonalGame',function(data){
		var game_name = data.name,
			game_time = data.time,
			game_string = data.game,
			limited_time_target = data.limited_time_target,
			pid = data.pid,
			socres="0";
			var client = mysql.createConnection(db);
			client.connect();
			client.query("INSERT INTO "+ app.get('db_name') +".personal_game(player_id_fk, game_name, game_time, game_string, scores, limited_time_target) VALUES (?,?,?,?,?,?)",
			[pid, game_name, game_time, game_string,socres,limited_time_target],
			function (err, results, fields) {
				client.end();
				socket.emit('createGameSuccess',{});
			});
	});
	socket.on('savePersonalGameScore',function(data){
		var id = data.id,
			score = data.score;
			var client = mysql.createConnection(db);
			client.connect();
			client.query("UPDATE "+ app.get('db_name') +".personal_game set scores=? WHERE id=?",
			[score, id],
			function (err, results, fields) {
				client.end();
				socket.emit('gameScoreSuccess',{});
			});
	});
	
	
	
	
	
	socket.on('disconnect', function (socket) {
		console.log("disconnect");
	});
	
});

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
function in_array(element, array) {
    for(var i in array) {
		var el=array[i];
		if(el == element) return true;
    }
    return false;
}
function obj_in_array(obj, array){
	var id=obj.id;
	if(id==='undefined' || array.length==0){
		return false;
	}
	else{
			
		for(var i=0;i<=array.length-1;i++){
			var obj=array[i];
			var _id=obj.id;
			if(_id===id)
				return true;
		}
		return false;
	}
	
}