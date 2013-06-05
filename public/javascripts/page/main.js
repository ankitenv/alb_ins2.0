$(document).ready(function(){
	if(navigator.userAgent.indexOf("MSIE")>-1){
		$("#main-warning").show();
		$("#btnStart").hide();
	}
	else
	{
		$("#main-warning").hide();
		$("#btnStart").show();
	}
	$("#btnStart").click(function(){
		window.close();
		var testWindow = window.open (window.CONFIG.URL+"/login", "mywindow", "menubar=0, toolbar=0, location=0, directories=0, status=0, scrollbars=0, resizable=0, dependent=0,width="+window.outerWidth+",height="+window.outerWidth);
		
	});
	
	var socket = new io.connect(window.CONFIG.URL);
});