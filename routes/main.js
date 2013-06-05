
/*
 * GET main page.
 */
var express = require('express');
exports.mainGET = function(req, res){
  res.render('main');
};
