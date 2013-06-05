var params=getUrlVars(),
	gameObj={},
	socket = new io.connect(window.CONFIG.URL),
	pid=0,
	htmlObj={
		"pop":"#pop",
		"overlay":"#overlay",
		"btn_createGame":"#btnCrGame",
		"btn_cancelGame":"#btnCancelGame",
		"btn_createLevel":"#btnCreateLevel",
		"btn_saveGame":"#btnSaveGame",
		"btn_cancelLevel":"#btnCancelLevel",
		"btn_saveLevel":"#btnAddLevel",
		"btn_deleteLevel":".del-btn",
		"list_div":"#divList",
		"game_div":"#divCreateGame",
		"level_div":"#divCreateLevel",
		"CheckBox":".create-game .radio",
		"CardCheckBox":".card-cont .radio",
		"FunctionCheckBox":".fun-cont .radio",
		"game_name":"#txtGameName",
		"game_time":"#txtGameTime",
		"levelName":"#txtLevelName",
		"levelTarget":"#txtLevelTargets",
		"levelContainer":".level-cont ul",
		"levels":".level-cont li",
		"hidden_PlayerID":"#hPlayerID",
		"limit_target_time":"#limitTargetTime"
	};
	
$(document).ready(function(){
	loadPlayerId();
	var levelsCount=0;
	if(params["ut"]!=3){
		$(htmlObj.pop).show().html("App is Currently open for Players Only");
		$(htmlObj.overlay).show();
	}
	else{
		$(htmlObj.pop).hide();
		$(htmlObj.overlay).hide();
	}
	$(htmlObj.btn_createGame).click(function(){
		$(htmlObj.list_div).hide();
		$(htmlObj.game_div).show();
	});
	$(htmlObj.btn_cancelGame).click(function(){
		$(htmlObj.list_div).show();
		$(htmlObj.game_div).hide();
		resetGameForm();
	});
	$(htmlObj.btn_createLevel).click(function(){
		$(htmlObj.game_div).hide();
		$(htmlObj.level_div).show();
	});
	$(htmlObj.btn_cancelLevel).click(function(){
		$(htmlObj.game_div).show();
		$(htmlObj.level_div).hide();
		resetLevelForm();
	});
	$(htmlObj.CheckBox).click(function(){
		if($(this).hasClass("check")){
			$(this).removeClass("check");
		}
		else{
			$(this).addClass("check");
		}
	});
	$(htmlObj.btn_saveLevel).click(function(){
		var levelExists=false,
			levelName=$(htmlObj.levelName).val();
		for(var i=0;i<=gameObj.size()-1;i++){
			var obj=gameObj[i],level_name=obj.level_name;
			if(level_name===levelName){
				levelExists=true;
				break;
			}
		}
		if(levelExists){
			alert("Level with Name '"+levelName+"' already exists in Game. Create Level with different name");
		}
		else{
			var levelObj={},
				levelTarget=parseInt($(htmlObj.levelTarget).val()),
				cardCount=0,
				funCount=0,
				haveFactorial=false,
				validate=true;
			levelObj.level_name=levelName;
			levelObj.total_targets=levelTarget;
			levelObj.cards=[];
			levelObj.functions=[];
			$(htmlObj.CardCheckBox).each(function(){
				if($(this).hasClass("check")){
					var Card=parseInt($(this).next().children().eq(0).html());
					levelObj.cards.push(Card);
					cardCount++;
				}
			});
			$(htmlObj.FunctionCheckBox).each(function(){
				if($(this).hasClass("check")){
					levelObj.functions.push($(this).next().children().eq(0).html());
					funCount++;
				}
			});
			
			if($(htmlObj.CardCheckBox).eq(0).hasClass("check")){
				haveFactorial=true;
			}
			if($(htmlObj.levelName).val()==""){
				validate=false;
				alert("Level Name Should be Compulsory.");
			}
			if($(htmlObj.levelTarget).val()==""){
				validate=false;
				alert("Level Target Should be Compulsory.");
			}
			if(isNaN($(htmlObj.levelTarget).val())){
				validate=false;
				alert("Level Target Should be a Number.");
			}
			if (cardCount < 2) {
				validate=false;
				alert("Minimum two Operands needs to be Selected.");
			}
			if (funCount < 1) {
				validate=false;
				alert("Minimum one Operator needs to be Selected.");
			}	
			if(!haveFactorial && funCount>cardCount){
				validate=false;
				alert("Number of Functions should be less than number of Cards.");
			}
			if(haveFactorial && funCount>cardCount){
				validate=false;
				alert("Number of Functions in Levels should be less than or equal to Cards.");
			}
			
			if(validate){
				gameObj[levelsCount]=levelObj;
				var levelHtml="<li id='level"+levelsCount+"'>\
									<div class='level-name'>"+levelName+"</div>\
									<div class='bot-cont'>\
										<span><b>"+cardCount+"</b> Cards</span>\
										<span><b>"+funCount+"</b> Functions</span>\
									</div>\
									<div class='right-cont'>\
										<span class='big'>"+levelTarget+"</span>\
										<span>Targets</span>\
									</div>\
									<input id='"+levelsCount+"' type='button' value='X' class='button right-btn del-btn'>\
								</li>";
				$(htmlObj.levelContainer).append(levelHtml);
				$(htmlObj.game_div).show();
				$(htmlObj.level_div).hide();
				resetLevelForm();
				levelsCount++;
				
			}
			
		}

	});
	$(htmlObj.btn_deleteLevel).bind("click",function(){
		var count=$(this).attr('id'),htmlID="#level"+count;
		delete gameObj[count];
		$(htmlID).remove();
	});
	$(htmlObj.btn_saveGame).click(function(){
		var validate=true;
		
		if($(htmlObj.game_name).val()==""){
			validate=false;
			alert("Your Game Name is Compulsory");
		}
		if($(htmlObj.game_time).val()==""){
			validate=false;
			alert("Your Game Time is Compulsory");
		}
		if(isNaN($(htmlObj.game_time).val())){
			validate=false;
			alert("Your Game Time should be a Number");
		}
		if($(htmlObj.levels).length<1){
			validate=false;
			alert("Add some levels to your game");
		}
		if(validate){
			gameObj.name=$(htmlObj.game_name).val();
			gameObj.time=parseInt($(htmlObj.game_time).val());
			var limited_time_target=0;
			if($(htmlObj.limit_target_time).hasClass("check")){
				limited_time_target=1;
			}
			var Obj={"name":gameObj.name,"time":gameObj.time,"game":JSON.stringify(gameObj),pid:pid,"limited_time_target":limited_time_target};
			socket.emit('createPersonalGame',Obj);
			resetGameForm();
		}		
	});
});
socket.on('createGameSuccess',function(){
	alert("Your Game Successfully Saved on Server");
	window.location.reload();
});

function resetLevelForm(){
	$(htmlObj.levelName).val('');
	$(htmlObj.levelTarget).val('');
	$(htmlObj.CardCheckBox).removeClass('check');
	$(htmlObj.FunctionCheckBox).removeClass('check');
}
function resetGameForm(){
	$(htmlObj.game_name).val('');
	$(htmlObj.game_time).val('');
	$(htmlObj.levelContainer).html('');
}
function openComp(id){
	var elID="#"+id,$el=$(elID),status=$el.find("span.status").html();
	if(status=="Runnning"){
		var player_id=$(htmlObj.hidden_PlayerID).val();
		$(location).attr('href',window.CONFIG.URL+'/competition?i='+id+'&p='+player_id+'&t=c');
	}
	else if(status=="not Started"){
		alert("Competition has not Started Yet. Please Wait...");
	}
	else if(status=="Ended"){
		alert("Competition has been Ended.");
	}
	else if(status=="Just Started"){
		alert("Competition has been Just Started.");
	}
	else if(status=="Just Ended"){
		alert("Competition has been just Ended.");
	}
	
}
function openTest(id){
	var elID="#"+id,$el=$(elID),status=$el.find("span.status").html();
	if(status=="Runnning"){
		var player_id=$(htmlObj.hidden_PlayerID).val();
		$(location).attr('href',window.CONFIG.URL+'/test?i='+id+'&p='+player_id+'&t=t');
	}
	else if(status=="not Started"){
		alert("Test has not Started Yet. Please Wait...");
	}
	else if(status=="Ended"){
		alert("Test has been Ended.");
	}
	else if(status=="Just Started"){
		alert("Test has been Just Started.");
	}
	else if(status=="Just Ended"){
		alert("Test has been just Ended.");
	}
	
}

function OpenGame(id){
	var player_id=$(htmlObj.hidden_PlayerID).val();
	$(location).attr('href',window.CONFIG.URL+'/game?i='+id+'&p='+player_id+'&t=g');
	
}

function in_array(element, array) {
    for(var i in array) {
		var obj=array[i];
		var id=obj["id"];
        if(id == element) return true;
    }
    return false;
}

function getStatus(element, array) {
    for(var i in array) {
		var obj=array[i];
		var id=obj["id"];
        if(id == element){
			return obj["status"];
		}
    }
}

function getStatusText(element, array) {
    for(var i in array) {
		var obj=array[i];
		var id=obj["id"];
        if(id == element){
			return obj["statusText"];
		}
    }
    return false;
}
$(document).ready(function(){
	/*$('#com-container').slimScroll({
        height: '167px'
    });
	$('#test-container').slimScroll({
        height: '167px'
    });*/
});
function loadPlayerId(){
	$.ajax({
		url: '/getPlayerId',
		type: "GET",
		dataType: 'json',
		async:false,
		data:{'u':params['ud']},
		success: function(data) {
			var obj=data[0];
			pid=obj["id"];
		},
		error  : function(){
			$(htmlObj.status).html('error'); 
		}
	});
	
}