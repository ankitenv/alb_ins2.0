window.CONFIG={
	URL:'http://localhost:3000',
	LOCAL_URL:'http://localhost:3000',
	SERVER:"localhost"
	
};
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function shuffle(o){ 
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}
function factorial(n)
{
	if (n <= 1) return 1;
	return n*factorial(n-1);
}

Object.prototype.size = function () {
  var len = this.length ? --this.length : -1;
    for (var k in this)
      len++;
  return len;
}
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
}
Array.prototype.max = function( array ){
    return Math.max.apply( Math, array );
};
Array.prototype.min = function( array ){
    return Math.min.apply( Math, array );
};

function unique(origArr) {
    var newArr = [],
        origLen = origArr.length,
        found,
        x, y;
 
    for ( x = 0; x < origLen; x++ ) {
        found = undefined;
        for ( y = 0; y < newArr.length; y++ ) {
            if ( origArr[x] === newArr[y] ) { 
              found = true;
              break;
            }
        }
        if ( !found) newArr.push( origArr[x] );    
    }
   return newArr;
}

function uniqueExpression(expArray,targetArray) {
    var newExpArr = [],
		newTgtArr = [],
        origLen = targetArray.length,
        found,
        x, y;
 
    for ( x = 0; x < origLen; x++ ) {
        found = undefined;
        for ( y = 0; y < newExpArr.length; y++ ) {
            if ( targetArray[x] === newTgtArr[y] ) { 
              found = true;
              break;
            }
        }
        if ( !found){
			newTgtArr.push( targetArray[x] );
			newExpArr.push( expArray[x] );
			
		}			
    }
   return newExpArr;
}

function countInString(searchFor,searchIn){

	var results=0;
	var a=searchIn.indexOf(searchFor);

	while(a!=-1){
	   searchIn=searchIn.slice(a*1+searchFor.length);
	   results++;
	   a=searchIn.indexOf(searchFor);
	}

	return results;

}
$(document).ready(function(){
	document.onkeydown = function (e) {
		//if(e.which === 16 || e.which === 17 || e.which === 73 || e.which === 123 || e.which === 116)
		//	return false;
	}
	
});
