'use strict';

/* Services */
var udadisiServices = angular.module('udadisiServices', ['ngResource']);

udadisiServices.factory('Trends', ['$resource',
  function($resource){
    return $resource('http://localhost:8080/v1/trends/:trend', {}, {
      query: {method:'GET', params:{limit:10}, isArray:true}
    });
  }]);