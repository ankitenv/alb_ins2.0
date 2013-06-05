var	urlData = getUrlVars();
	gls ={},
	gvar = {
		COUNTER : 0,
		CURR_LEVEL : -1,
		CURR_TARGET : -1,
		TOTAL_GAME_TARGETS : 0,
		TOTAL_LEVEL : 0,
		LIFE : 3,
		SCORE : 0,
		LIMIT_TIME_TARGET : false,
		LAST_TIME_TAKEN : 0,
		TIME_COUNTER : 0,
		TARGET_TIME : 0,
		CURR_TARGET_TIME : 0,
		GAME_TIME : 0,
		LAST_BTN_CLICK : [],
		HTML : {
			btn:".btn",
			display:"#display",
			target:"#target",
			reset:"#reset-button",
			submit:"#submit-result",
			level_id:"#hlevelID",
			level_name:"#levelName",
			level_target:"#levelTarget",
			score:"#score",
			status:"#status-msg",
			bgsound:"#bgsound",
			result_status:"#result-status",
			status_msg:"#status-msg",
			player_btn:"#player-button",
			player_container:"#player-div",
			time:"#time",
			gameStatus:"#hGameStatus",
			reload_btn:"#reload-btn",
			header:"#header",
			clock:"#self-clock"
		},
		URL : {
			gameLevelURL : 'getCompetitionLevel/?i='+urlData['i']+'&p='+urlData['p']+'&t=c',
			competitionInfoURL : 'getCompetitionInfo/?i='+urlData['i'],
			levelCardURL : function(id){
							return 'getLevelCards/?id='+id;
						},
			levelFunctionURL : function(id){
							return 'getLevelFunctions/?id='+id;
						},
			playerURL : function(id){
							return 'getPlayerInfo/?id='+id;
						},
			
		}
	},
	socket = new io.connect(window.CONFIG.URL);
	
//synching 
function sendPlayerInfotoServer(){
	data = {c:urlData["i"], p:urlData["p"]};
	socket.emit("addPlayertoCompetition", data);
}

var p=setInterval(function(){
					data = {c:urlData["i"]};
					socket.emit("getUpdatedCompetitionPlayer", data);
				},
				2000);
var b=setInterval(function(){
					$(gvar.HTML.player_container).html(playerList);
					gvar.TIME_COUNTER++;
				},
				1000);
//loading
function loadGameInfo(){
	$.ajax({
		url: gvar.URL.competitionInfoURL,
		type: "GET",
		dataType: 'json',
		async:false,
		success: function(data) {
			var obj=data[0];
			$(gvar.HTML.header).html(obj.competition_name);
			if(obj.limited_time_target==1){
				gvar.LIMIT_TIME_TARGET=true;
				gvar.GAME_TIME=parseInt(obj.competition_time);
			}
		},
		error  : function(){
			$(gvar.HTML.status).html('error'); 
		}
	});
}
function loadGameLevels(){
	$.ajax({
		url: gvar.URL.gameLevelURL,
		type: "GET",
		dataType: 'json',
		async:false,
		success: function(data) {
			for(var i=0;i<data.length;i++){
				var level={};
				level["id"]=data[i].id;
				level["level_name"]=data[i].level_name;
				level["total_targets"]=data[i].total_targets;
				level["target"]=[];
				gls[i]=level;
				level=null;
				loadGameLevelCards(data[i].id);
				loadGameLevelFunctions(data[i].id);
				gvar.TOTAL_GAME_TARGETS+=parseInt(data[i].total_targets);
				gvar.COUNTER++;
			}
			gvar.TOTAL_LEVEL=gls.size();
			sendPlayerInfotoServer();
			defineGameLevelTargets();
		},
		error  : function(){
			$(gvar.HTML.status).html('error'); 
		}
	});
	
}
function lifeUpdateTimeBasis(){
	gvar.LIFE--;
	if(gvar.LIFE==0){
		$(gvar.HTML.status).html("Sorry! Competition is Over..");
		socket.emit('setCompOverPlayers', {i:urlData['i'],p:urlData['p']});
		window.location.href=window.CONFIG.URL;
	}
	else{
		$("span.life:last").remove();
		$(gvar.HTML.status).html("You have "+gvar.LIFE+" "+getLifeSting()+" left..!");
	}
}
function getLifeSting(){
	if(gvar.LIFE===3 || gvar.LIFE===2 || gvar.LIFE===0){
		return gvar.LIFE+" Lives left";
	}
	else if(gvar.LIFE===1){
		return "1 Life left";
	}
}
function updateScore(){
	var time_used=0,target=parseInt($(gvar.HTML.target).html());
	if(gvar.LIMIT_TIME_TARGET){
		time_used=gvar.TARGET_TIME-gvar.CURR_TARGET_TIME;
		gvar.SCORE=parseInt(((target*target)/time_used)*1000)+gvar.SCORE;
	}
	else
	{
		time_used=gvar.TIME_COUNTER-gvar.LAST_TIME_TAKEN;
		gvar.LAST_TIME_TAKEN=gvar.TIME_COUNTER;
		gvar.SCORE=parseInt(((target*target)/time_used)*1000)+gvar.SCORE;
	}
}
function loadGameLevelCards(id){
	$.ajax({
		url: gvar.URL.levelCardURL(id),
		type: "GET",
		dataType: 'json',
		async:false,
		success: function(data) {
			var cards=[];
			for(var i=0;i<data.length;i++){
				cards.push(data[i].card_number);
			}
			gls[gvar.COUNTER].cards=cards;
		},
		error  : function(){
			$(gvar.HTML.status).html('error'); 
		}
	});
}
function loadPlayerInfo(id, comp_id){
	$.ajax({
		url: gvar.URL.playerURL(id),
		type: "GET",
		dataType: 'json',
		async:false,
		success: function(data) {
			addPlayertoSocket(data,comp_id);
		},
		error  : function(){
			$(gvar.HTML.status).html('error'); 
		}
	});
}
function loadGameLevelFunctions(id){
	$.ajax({
		url: gvar.URL.levelFunctionURL(id),
		type: "GET",
		dataType: 'json',
		async:false,
		success: function(data) {
			var functions=[];
			for(var i=0;i<data.length;i++){
				functions.push(data[i].game_funtion);
			}
			gls[gvar.COUNTER].functions = functions;
		},
		error  : function(){
			$(gvar.HTML.status).html('error'); 
		}
	});
}
function defineGameLevelTargets(){
	try{
		for(var j=0;j<=gvar.TOTAL_LEVEL-1;j++){
			var level_target=[];
			for(var i=1;i<=gls[j].total_targets;i++)
				level_target.push(i);
			gls[j]["target"]=level_target;
		}
		updateGame();
		$(gvar.HTML.status).html("");
		$(gvar.HTML.reload_btn).hide();
		if(gvar.LIMIT_TIME_TARGET){
			gvar.TARGET_TIME=(gvar.GAME_TIME * 60)/gvar.TOTAL_GAME_TARGETS;
			var interval=setInterval(function(){
				if(gvar.CURR_TARGET_TIME<gvar.TARGET_TIME){
					gvar.CURR_TARGET_TIME++;
				}
				else if(gvar.CURR_TARGET_TIME === gvar.TARGET_TIME){
					gvar.CURR_TARGET_TIME=0;
					lifeUpdateTimeBasis();
					//clearInterval(interval);
					updateGame();
				}
				$(gvar.HTML.clock).html(gvar.CURR_TARGET_TIME+"/"+gvar.TARGET_TIME);
			},1000);
		}
		
	}
	catch(err){
		$(gvar.HTML.status).html("Some Problem occurs. Please click Refresh button(at Top-Right-Corner) above to reload Competition.");
		$(gvar.HTML.reload_btn).show();
	}
	
}

//updating
function updateGame(){
	if(gvar.CURR_LEVEL===-1)
	{	
		gvar.CURR_LEVEL++,gvar.CURR_TARGET++;renderGame();levelChange();
	}
	else if(gvar.CURR_LEVEL<=gvar.TOTAL_LEVEL-1){
		var CURR_LEVEL_TARGETS=parseInt(gls[gvar.CURR_LEVEL]["total_targets"]);
		if(gvar.CURR_TARGET<CURR_LEVEL_TARGETS-1){
			gvar.CURR_TARGET++;
			renderGame();
		}
		else if(gvar.CURR_TARGET===(CURR_LEVEL_TARGETS-1)){
			gvar.CURR_LEVEL++;
			gvar.CURR_TARGET=0;
			renderGame();levelChange();
		}
	
		
	}
	
}
function renderGame(){
	var curr_level = gls[gvar.CURR_LEVEL];
	$(gvar.HTML.level_id).val(curr_level.id),
	$(gvar.HTML.level_name).html(curr_level.level_name),
	$(gvar.HTML.level_target).html(gvar.CURR_TARGET+1),
	$(gvar.HTML.target).html(curr_level.target[gvar.CURR_TARGET]),
	$(gvar.HTML.display).html(""),
	$(gvar.HTML.score).html(gvar.SCORE),
	$(gvar.HTML.btn).removeClass("used"),
	gvar.LAST_BTN_CLICK.length=0;
	if(curr_level.target[gvar.CURR_TARGET].length>7){
		$(gvar.HTML.target).addClass("length-8");
	}
	if(curr_level.target[gvar.CURR_TARGET].length>14){
		$(gvar.HTML.target).addClass("length-15");
	}
	if(curr_level.target[gvar.CURR_TARGET].length>19){
		$(gvar.HTML.target).addClass("length-20");
	}

}
function levelChange(){
	var operandsContent="",operatorContent="",curr_level = gls[gvar.CURR_LEVEL],cards=curr_level.cards.sort();
	$.each(cards,function(i,card){
		operandsContent += "<span class='btn "+randomCardColor()+"-"+card+"'>"+card+"</span>";
	});
	document.getElementById("operand-container").innerHTML=operandsContent;
	$.each(curr_level.functions,function(i,functions){
		switch(functions){
			case "+": operatorContent += "<span class='btn plus'>"+functions+"</span>";
					 break;
			case "-": operatorContent += "<span class='btn minus'>"+functions+"</span>";
					 break;
			case "*": operatorContent += "<span class='btn mul'>"+functions+"</span>";
					 break;
			case "/": operatorContent += "<span class='btn divide'>"+functions+"</span>";
					 break;
			case "!": operatorContent += "<span class='btn fact'>"+functions+"</span>";
					 break;
			case "^": operatorContent += "<span class='btn pow'>"+functions+"</span>";
					 break;
			default: operatorContent += "";
					 break;
					 
		}
	});
	document.getElementById("operator-container").innerHTML=operatorContent;
	
}

//expression makers
function updateExp(exp){
	if(exp!=='undefined' && exp!==''){
		if(exp.indexOf("!")>-1){
			exp=rpFactExp(exp);	
		}
		if(exp.indexOf("^")>-1){
			exp=findPowExp(exp);
		}
	}
	return exp;
}
function rpFactExp(expression){
	var possibleExp=['1!','2!','3!','4!','5!','6!','7!','8!','9!','10!','11!','12!'],
	    possibleFact=[1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600];
	for(var i=0;i < possibleExp.length-1;i++){
		var pattern=possibleExp[i];
		if(expression.indexOf(pattern)>-1){
			expression=expression.replace(pattern,possibleFact[i]);
			return expression.toString();
		}
	}

		
}
function bracketExp(expression){
	var start_index=expression.indexOf("(")+1,eval_exp="",end_index;
	if(start_index>0){
		for(var i=start_index;i<=expression.length-1;i++){
			if(expression[i]===')')
			{
				end_index=i-1;
				break;
			}	
			else{
				continue;
			}
		}
		
		eval_exp=expression.substring(0,start_index-1)+eval(expression.substring(start_index,end_index+1))+expression.substring(end_index+2,expression.length);
		if(eval_exp.indexOf("!")>-1){
			eval_exp=rpFactExp(eval_exp);	
		}
		if(eval_exp.indexOf("^")>-1){
			eval_exp=findPowExp(eval_exp);
		}
		
	}
	return eval_exp.toString();
}
function findPowExp(expression){
	var operators=['+','-','*','/','(',')'],
		numbers=['1','2','3','4','5','6','7','8','9'],
		powIndex=expression.indexOf('^'),
		pow_start,pow_end,number="",power="",num_start,num_end;
	for(var i = powIndex-1; i>=0; i--){
		if(in_array(expression[i], operators)){
			num_start=i+1;
			num_end=powIndex-1;
		}
		else if(i===0){
			num_start=0;
			num_end=powIndex;
			break;
		}
		else{
			continue;
		}
	}
	
	for(var j = powIndex+1; j<expression.length; j++){
		if(in_array(expression[j], operators)){
			pow_start=j-1;
			pow_end=powIndex+1;
		}
		else if(j===expression.length-1){
			pow_start=powIndex+1;
			pow_end=expression.length;
			break;
		}
		else{
			continue;
		}
	}
	number=parseInt(expression.substring(num_start,num_end)),power=parseInt(expression.substring(pow_start,pow_end));
	expression=expression.replace(expression.substring(num_start,pow_end),Math.pow(number,power));
	return expression.toString();
}
function validateExp(exp){
	var arrExp = exp.split(''),
		operand_array=[1,2,3,4,5,6,7,8,9,10,11,12],
		operator_array=['+','-','*','/','!','^'],
		bracket_array=['(',')'];
		n=arrExp.length-1;
	if(in_array(arrExp[n],operand_array) && in_array(arrExp[n-1],operand_array))
		return 1;
	else if(in_array(arrExp[n],operator_array) && in_array(arrExp[n-1],operator_array) && (arrExp[n-1]!==operator_array[4]))
		return 2;
	else if(in_array(arrExp[n],bracket_array) && in_array(arrExp[n-1],bracket_array))
		return 3;
	else if(in_array(arrExp[n-1],operator_array) && arrExp[n-1]!==bracket_array[1] && arrExp[n]==bracket_array[1])
		return 4;	
	else if(arrExp[n-1]==bracket_array[0] && in_array(arrExp[n],operator_array))
		return 5;
	else if(in_array(arrExp[0],operator_array))
		return 6;
}
function randomCardColor(){
	var colorArray = ['v','g','r','b'];
	return colorArray[Math.floor(Math.random() * colorArray.length)];
}

//notifications
function CorrectAnswer(){
	$(gvar.HTML.bgsound).append('<embed id="embed_player" src="sound/y.wav" autostart="true" hidden="true"></embed>');
	$(gvar.HTML.result_status).addClass("Ya");
	setTimeout(function() {
        $(gvar.HTML.bgsound).html("");
		$(gvar.HTML.result_status).removeClass("Ya");
    }, 2000);
}
function WrongAnswer(){
	$(gvar.HTML.bgsound).append('<embed id="embed_player" src="sound/n.wav" autostart="true" hidden="true"></embed>');
	$(gvar.HTML.result_status).addClass("Na");
	setTimeout(function() {
        $(gvar.HTML.bgsound).html("");
		$(gvar.HTML.result_status).removeClass("Na");
    }, 2000);
}
function Warning(){
	$(gvar.HTML.bgsound).append('<embed id="embed_player" src="sound/w.wav" autostart="true" hidden="true"></embed>');
	$(gvar.HTML.status_msg).addClass("W");
	setTimeout(function() {
        $(gvar.HTML.bgsound).html("");
		$(gvar.HTML.status_msg).removeClass("W").html("");
    }, 2000);
}
function CompleteGame(){
	$(gvar.HTML.result_status).addClass("Compl");
	$(gvar.HTML.result_status).html("Congrats you have finished the Competition!");
}

//utility functions
function in_array(element, array) {
    for(var i in array) {
        if(array[i] == element) return true;
    }
    return false;
}

$(document).ready(function(){
	$(gvar.HTML.status).html("Please wait while competition is loading......");
	socket.emit("checkPlayerPlayCompetition", {i:urlData['i'], p:urlData['p']});
	//button events listners
	$(gvar.HTML.btn).live("click",function(){
		$obj=$(this),$(gvar.HTML.status).html("");
		if(!$obj.hasClass("used")){
			var updatedDisplayText=$(gvar.HTML.display).html()+$obj.html();
			$(gvar.HTML.display).html(updatedDisplayText);
			var buttontext=$obj.html(),isTwoDigitNum = (buttontext.length == 2 && !isNaN(buttontext));
			if(!isTwoDigitNum){
				var result=validateExp($(gvar.HTML.display).html());
				if(result==1){
					$(gvar.HTML.status).html("You can't place a operand after a operand");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(gvar.HTML.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==2){
					$(gvar.HTML.status).html("You can't place a operator after a operator");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(gvar.HTML.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==3){
					$(gvar.HTML.status).html("You can't place a bracket after a bracket");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(gvar.HTML.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==4){
					$(gvar.HTML.status).html("You can't place a bracket after a operator without having a operand");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(gvar.HTML.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==5){
					$(gvar.HTML.status).html("You can't place a bracket before a operator without having a operand");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(gvar.HTML.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==6){
					$(gvar.HTML.status).html("You can't start a expression with operator");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(gvar.HTML.display).html(updatedDisplayText);
					Warning();
				
				}
				else{
					if(!$obj.parent().hasClass("operators") && !$obj.parent().hasClass("brackets"))
						$obj.addClass("used");
					var button_class=$obj.attr("class");
					simplified_class="."+button_class.split(" ").join(".");
					gvar.LAST_BTN_CLICK.push(simplified_class);
				}
				
			}
			
		}
		else{
			$(gvar.HTML.status).html("You have used this before..!");
		}
		
	});
	$(gvar.HTML.reset).click(function(){
		var expression=$(gvar.HTML.display).html();
		$(gvar.HTML.status).html("");
		if(expression.length>0 && gvar.LAST_BTN_CLICK.length>0){
			if(!isNaN(expression[expression.length-1]) && !isNaN(expression[expression.length-2])){
				expression=expression.substring(0, expression.length - 2);
			}
			else{
				expression=expression.substring(0, expression.length - 1);
			}
			$(gvar.HTML.display).html(expression);
			$(gvar.LAST_BTN_CLICK.pop()).removeClass("used");
		}
	});
	$(gvar.HTML.player_btn).click(function(){
		$(gvar.HTML.player_container).show();
		setTimeout(function() {
			$(gvar.HTML.player_container).hide();
		}, 5000);
	});
	$(gvar.HTML.submit).click(function(){
		var expression=$(gvar.HTML.display).html(),target=eval($("#target").html());
		$(gvar.HTML.status).html("");
		if(expression.indexOf("(")>-1){
			if(expression.indexOf("!")>-1){
				if(expression.indexOf("(")>expression.indexOf("!")){
					expression=rpFactExp(expression);
					expression=bracketExp(expression);
				}
				else if(expression.indexOf("(")<expression.indexOf("!")){
					expression=bracketExp(expression);
					expression=rpFactExp(expression);
				}	
			}
			else{
				expression=bracketExp(expression);
			}
		}
		if(expression.indexOf("!")>-1){
			expression=rpFactExp(expression);	
		}
		if(expression.indexOf("^")>-1){
			expression=findPowExp(expression);
		}
		var result=eval(expression);
		
		if(gvar.LIFE>0){
			if(target===result){
				updateScore();
				var score_data={c:urlData['i'], p:urlData['p'], s:gvar.SCORE};
				socket.emit("updateCompetitionPlayerScore",score_data);
				if(gvar.CURR_LEVEL===(gvar.TOTAL_LEVEL-1) && gvar.CURR_TARGET===(parseInt(gls[gvar.CURR_LEVEL]["total_targets"])-1)){
					CompleteGame();					
					socket.emit("setCompFinishedPlayers",{p:urlData['p'],i:urlData['i']});
				}
				else{
					CorrectAnswer();
					updateGame();
					gvar.CURR_TARGET_TIME=0;
				}
			}
			else{
				WrongAnswer();
				$("span.life:last").remove();
				gvar.LIFE--;
				if(gvar.LIFE===0){
					$(gvar.HTML.status).html("Sorry! Competition is Over..");
					socket.emit('setCompOverPlayers', {i:urlData['i'],p:urlData['p']});
					window.location.href=window.CONFIG.URL;
				}
				else{
					$(gvar.HTML.status).html("Wrong Answer ! You have "+gvar.LIFE+" "+getLifeSting()+" left..!");
					$(gvar.HTML.display).html("");
					gvar.LAST_BTN_CLICK.length=0;
					$(gvar.HTML.btn).removeClass("used");
					gvar.CURR_TARGET_TIME=0;
				}	
			}
		
		}
		else{
			$(gvar.HTML.status).html("Sorry! Competition is Over..");
			socket.emit('setCompOverPlayers', {i:urlData['i'],p:urlData['p']});
			window.location.href=window.CONFIG.URL;
		}
		
	});
	$("#reload-btn").click(function(){
		window.location.reload();
	});
});

