'use strict';

/* Controllers */

var udadisiControllers = angular.module('udadisiControllers', ['ngRoute']);

udadisiControllers.controller('HomeCtrl', ['$scope', 'Trends', function($scope, Trends) {
  $scope.trends = Trends.query('all');
}]);

udadisiControllers.controller('LocationsCtrl', ['$scope', '$routeParams',
  function($scope, $routeParams) { $scope.location = $routeParams.location; 
}]);

udadisiControllers.controller('TrendsCtrl', ['$scope', '$routeParams', 
  function($scope, $routeParams) { $scope.trend = $routeParams.trend; 
}]);

udadisiControllers.controller('ExplorerCtrl', [function() {
}]);