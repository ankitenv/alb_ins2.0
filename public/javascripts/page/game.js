var	urlData = getUrlVars();
	gameURL = 'getGame/?i='+urlData['i']+'&p='+urlData['p']+'&t=c',
	gls ={},
	counter = 0,
	CURR_LEVEL = -1,
	CURR_TARGET = -1,
	TOTAL_GAME_TARGETS =0,
	TOTAL_LEVEL =0,
	GAME_TIME = 0,
	SEC=0,
	GAME_TIME_READABLE = 0,
	SCORE_STRING ="",
	LIFE = 3,
	score = 0,
	LIMIT_TIME_TARGET=false,
	TARGET_TIME=0,
	CURR_TARGET_TIME=0,
	GAME_TIME=0;
	lastClickedBtn=[],
	GAME_NAME="",
	htmlObj={
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
		myClock:"#self-clock"
	},
	socket = new io.connect(window.CONFIG.URL);
	
	
socket.on("gameScoreSuccess",function(){
	alert("Your Score Saved Successfully");
});
//loading
function loadGameInfo(){
	var url="getGameInfo/?i="+urlData["i"];
	$.ajax({
		url: url,
		type: "GET",
		dataType: 'json',
		async:false,
		success: function(data) {
			var obj=data[0];
			$(htmlObj.header).html(obj.game_name);
			if(obj.limited_time_target==1){
				LIMIT_TIME_TARGET=true;
				GAME_TIME=parseInt(obj.game_time);
			}
		},
		error  : function(){
			$(htmlObj.status).html('error'); 
		}
	});
}
function loadGame(){
	$.ajax({
		url: gameURL,
		type: "GET",
		dataType: 'json',
		async:false,
		success: function(data) {
			SCORE_STRING=data[0].scores;
			var Obj=JSON.parse(data[0].game_string),j=0;
			for(var i=0;i<=Obj.size()-1;i++){
				var elem=Obj[i];
				if(typeof elem ==="object"){
					gls[j]=elem;
					TOTAL_GAME_TARGETS+=elem.total_targets;
					j++;
				}
			}
			GAME_NAME=Obj["name"];
			GAME_TIME=parseInt(Obj["time"]);
			TOTAL_LEVEL=gls.size();
			defineGameLevelTargets();
			//GAME_TIME=2;
			var timeInterval=setInterval(function(){
				if(GAME_TIME>0){
					if(SEC===0){
						--GAME_TIME;
						SEC=60;
					}
					--SEC;
					GAME_TIME_READABLE=GAME_TIME+" mins and "+SEC+" sec remains...";
					$(htmlObj.time).html(GAME_TIME_READABLE);
				}
				else if(GAME_TIME==0 && SEC>0){
					--SEC;
					GAME_TIME_READABLE=GAME_TIME+" mins and "+SEC+" sec remains...";
					$(htmlObj.time).html(GAME_TIME_READABLE);
				}
				else{
					var SCOREDATA=SCORE_STRING+"|"+score;
					socket.emit("savePersonalGameScore",{id:urlData['i'],score:SCOREDATA});
					$(htmlObj.result_status).addClass("War").html("Sorry your time finish..!");
					clearInterval(timeInterval);
				}
			},1000);
		},
		error  : function(){
			$(htmlObj.status).html('error'); 
		}
	});
	
}
function lifeUpdateTimeBasis(){
	if(LIFE==0){
		$(htmlObj.status).html("Sorry! Game is Over..");
		window.location.href=window.CONFIG.URL;
	}
	else{
		LIFE--;
		$("span.life:last").remove();
		$(htmlObj.status).html("You have "+LIFE+" life's left..!");
	}
}
function updateScore(){
	if(LIMIT_TIME_TARGET){
		var target=parseInt($(htmlObj.target).html()),
		time_used=TARGET_TIME-CURR_TARGET_TIME;
		score=parseInt(((target*target)/time_used)*1000)+score;
	}
	else
	{
		score++;
	}
	
}
function loadGameLevelCards(id){
	var levelCardURL='getTestLevelCards/?id='+id;
	$.ajax({
		url: levelCardURL,
		type: "GET",
		dataType: 'json',
		async:false,
		success: function(data) {
			var cards=[];
			for(var i=0;i<data.length;i++){
				cards.push(data[i].card_number);
			}
			gls[counter].cards=cards;
		},
		error  : function(){
			$(htmlObj.status).html('error'); 
		}
	});
}
function loadPlayerInfo(id, comp_id){
	var playerURL='getPlayerInfo/?id='+id;
	$.ajax({
		url: playerURL,
		type: "GET",
		dataType: 'json',
		async:false,
		success: function(data) {
			addPlayertoSocket(data,comp_id);
		},
		error  : function(){
			$(htmlObj.status).html('error'); 
		}
	});
}
function defineGameLevelTargets(){
	try{
		for(var j=0;j<=TOTAL_LEVEL-1;j++){
			var level_target=[];
			for(var i=1;i<=gls[j].total_targets;i++)
				level_target.push(i);
			gls[j]["target"]=level_target;
		}
		updateGame();
		$(htmlObj.status).html("");
		$(htmlObj.reload_btn).hide();
		if(LIMIT_TIME_TARGET){
			TARGET_TIME=parseInt((GAME_TIME * 60)/TOTAL_GAME_TARGETS);
			var interval=setInterval(function(){
				if(CURR_TARGET_TIME<TARGET_TIME){
					CURR_TARGET_TIME++;
				}
				else if(CURR_TARGET_TIME === TARGET_TIME){
					CURR_TARGET_TIME=0;
					lifeUpdateTimeBasis();
					//clearInterval(interval);
					updateGame();
				}
				$(htmlObj.myClock).html(CURR_TARGET_TIME+"/"+TARGET_TIME);
			},1000);
		}
		
	}
	catch(err){
		$(htmlObj.status).html("Some Problem occurs. Please click Refresh button(at Top-Right-Corner) above to reload Competition.");
		$(htmlObj.reload_btn).show();
	}
	
}




//updating
function updateGame(){
	if(CURR_LEVEL===-1)
	{	
		CURR_LEVEL++,CURR_TARGET++;renderGame();levelChange();
	}
	else if(CURR_LEVEL<=TOTAL_LEVEL-1){
		var CURR_LEVEL_TARGETS=parseInt(gls[CURR_LEVEL]["total_targets"]);
		if(CURR_TARGET<CURR_LEVEL_TARGETS-1){
			CURR_TARGET++;
			renderGame();
		}
		else if(CURR_TARGET===(CURR_LEVEL_TARGETS-1)){
			CURR_LEVEL++;
			CURR_TARGET=0;
			renderGame();levelChange();
		}
	
		
	}
	
}
function renderGame(){
	var curr_level = gls[CURR_LEVEL];
	$(htmlObj.level_id).val(curr_level.id),
	$(htmlObj.level_name).html(curr_level.level_name),
	$(htmlObj.level_target).html(CURR_TARGET+1),
	$(htmlObj.target).html(curr_level.target[CURR_TARGET]),
	$(htmlObj.display).html(""),
	$(htmlObj.score).html(score),
	$(htmlObj.btn).removeClass("used"),
	lastClickedBtn.length=0;
	if(curr_level.target[CURR_TARGET].length>7){
		$(htmlObj.target).addClass("length-8");
	}
	if(curr_level.target[CURR_TARGET].length>14){
		$(htmlObj.target).addClass("length-15");
	}
	if(curr_level.target[CURR_TARGET].length>19){
		$(htmlObj.target).addClass("length-20");
	}

}
function levelChange(){
	
	var operandsContent="",operatorContent="",curr_level = gls[CURR_LEVEL],cards=curr_level.cards.sort();
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
	$(htmlObj.bgsound).append('<embed id="embed_player" src="sound/y.wav" autostart="true" hidden="true"></embed>');
	$(htmlObj.result_status).addClass("Ya");
	setTimeout(function() {
        $(htmlObj.bgsound).html("");
		$(htmlObj.result_status).removeClass("Ya");
    }, 2000);
}
function WrongAnswer(){
	$(htmlObj.bgsound).append('<embed id="embed_player" src="sound/n.wav" autostart="true" hidden="true"></embed>');
	$(htmlObj.result_status).addClass("Na");
	setTimeout(function() {
        $(htmlObj.bgsound).html("");
		$(htmlObj.result_status).removeClass("Na");
    }, 2000);
}
function Warning(){
	$(htmlObj.bgsound).append('<embed id="embed_player" src="sound/w.wav" autostart="true" hidden="true"></embed>');
	$(htmlObj.status_msg).addClass("W");
	setTimeout(function() {
        $(htmlObj.bgsound).html("");
		$(htmlObj.status_msg).removeClass("W").html("");
    }, 2000);
}
function CompleteGame(){
	var SCOREDATA=SCORE_STRING+"|"+score;
	socket.emit("savePersonalGameScore",{id:urlData['i'],score:SCOREDATA});
	$(htmlObj.result_status).addClass("Compl").html("Congrats you have finished the Game!");
}

//utility functions
function in_array(element, array) {
    for(var i in array) {
        if(array[i] == element) return true;
    }
    return false;
}

$(document).ready(function(){
	loadGameInfo()
	loadGame();
	//button events listners
	$(htmlObj.btn).live("click",function(){
		$obj=$(this),$(htmlObj.status).html("");
		if(!$obj.hasClass("used")){
			var updatedDisplayText=$(htmlObj.display).html()+$obj.html();
			$(htmlObj.display).html(updatedDisplayText);
			var buttontext=$obj.html(),isTwoDigitNum = (buttontext.length == 2 && !isNaN(buttontext));
			if(!isTwoDigitNum){
				var result=validateExp($(htmlObj.display).html());
				if(result==1){
					$(htmlObj.status).html("You can't place a operand after a operand");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(htmlObj.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==2){
					$(htmlObj.status).html("You can't place a operator after a operator");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(htmlObj.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==3){
					$(htmlObj.status).html("You can't place a bracket after a bracket");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(htmlObj.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==4){
					$(htmlObj.status).html("You can't place a bracket after a operator without having a operand");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(htmlObj.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==5){
					$(htmlObj.status).html("You can't place a bracket before a operator without having a operand");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(htmlObj.display).html(updatedDisplayText);
					Warning();
				
				}
				else if(result==6){
					$(htmlObj.status).html("You can't start a expression with operator");
					updatedDisplayText=updatedDisplayText.substring(0, updatedDisplayText.length - 1);
					$(htmlObj.display).html(updatedDisplayText);
					Warning();
				
				}
				else{
					if(!$obj.parent().hasClass("operators") && !$obj.parent().hasClass("brackets"))
						$obj.addClass("used");
					var button_class=$obj.attr("class");
					simplified_class="."+button_class.split(" ").join(".");
					lastClickedBtn.push(simplified_class);
				}
				
			}
			
		}
		else{
			$(htmlObj.status).html("You have used this before..!");
		}
		
	});
	$(htmlObj.reset).click(function(){
		var expression=$(htmlObj.display).html();
		$(htmlObj.status).html("");
		if(expression.length>0 && lastClickedBtn.length>0){
			if(!isNaN(expression[expression.length-1]) && !isNaN(expression[expression.length-2])){
				expression=expression.substring(0, expression.length - 2);
			}
			else{
				expression=expression.substring(0, expression.length - 1);
			}
			$(htmlObj.display).html(expression);
			$(lastClickedBtn.pop()).removeClass("used");
		}
	});
	$(htmlObj.submit).click(function(){
		var expression=$(htmlObj.display).html(),target=eval($("#target").html());
		$(htmlObj.status).html("");
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
		
		if(LIFE>0){
			if(target===result){
				updateScore();
				if(CURR_LEVEL===(TOTAL_LEVEL-1) && CURR_TARGET===(parseInt(gls[CURR_LEVEL]["total_targets"])-1)){
					CompleteGame();					
				}
				else{
					CorrectAnswer();
					updateGame();
					CURR_TARGET_TIME=0;
				}
			}
			else{
				WrongAnswer();
				$("span.life:last").remove();
				LIFE--;
				if(LIFE===0){
					$(htmlObj.status).html("Sorry! Game Over..");
					window.location.href=window.CONFIG.URL;
				}
				else{
					$(htmlObj.status).html("Wrong Answer ! You have "+LIFE+" life left..!");
					$(htmlObj.display).html("");
					lastClickedBtn.length=0;
					$(htmlObj.btn).removeClass("used");
					CURR_TARGET_TIME=0;
				}	
			}
		
		}
		else{
			$(htmlObj.status).html("Sorry! Your Game is Over..");
			window.location.href=window.CONFIG.URL;
		}
		
	});
	$("#reload-btn").click(function(){
		window.location.reload();
	});
});
