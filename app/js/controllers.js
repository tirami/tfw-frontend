'use strict';

/* Controllers */
var startOfToday = function(){
  return Date.now() - (Date.now() % (24*60*60*1000));
}

var day   = 24*60*60*1000;
var today = startOfToday(); // CHANGE TO startOfToday(); to get up to date info

var udadisiControllers = angular.module('udadisiControllers', ['ngRoute']);

udadisiControllers.controller('HomeCtrl', ['$scope', '$log', 'LocationTrends', function($scope, $log, LocationTrends) { 
  
  $scope.selectionStart = today-(1*day);
  $scope.interval = 1;
  $scope.locations = {"all":[], "dhaka":[], "lima":[], "nairobi":[]};

  $scope.getTrends = function(location, fromDate, interval){ 
    LocationTrends.query({ location: location, limit: 5, from: fromDate, interval: interval }, function(data) {
      $scope.locations[location] = data;
    }, function(error){
      $scope.trendsMessage       = "No trends received from remote server, using examples: ";
      $scope.locations[location] = [{"term":"water-pump","occurrences":452},{"term":"solar","occurrences":442},{"term":"battery","occurrences":407}]; 
    });
  };
  
  $.each($scope.locations, function(location,valueObj){
    $scope.getTrends(location, new Date($scope.selectionStart).yyyymmdd(), $scope.interval);
  });

}]);

udadisiControllers.controller('LocationsCtrl', ['$scope', '$routeParams',
  function($scope, $routeParams) { $scope.location = $routeParams.location; 
}]);

udadisiControllers.controller('TrendsCtrl', ['$scope', '$routeParams', 
  function($scope, $routeParams) { $scope.trend = $routeParams.trend; 
}]);

udadisiControllers.controller('ExplorerCtrl', ['$scope', '$log', 'LocationTrends', function($scope, $log, LocationTrends) { 
  //today = 1440111600000; // CHANGE TO startOfToday(); to get up to date info
  $scope.spanEnd   = today-1; //at 23:59:59
  $scope.spanStart = today-(7*day); //week before
  
  $scope.selectionStart = today-(1*day);
  $scope.location = "all";
  $scope.interval = 1;

  $scope.getTrends = function(location, fromDate, interval){ LocationTrends.query({ location: location, limit: 10, from: fromDate, interval: interval }, function(data) {
      $scope.trends = data;
    }, function(error){
      $scope.trendsMessage = "No trends received from remote server, using examples: ";
      $scope.trends = [{"term":"solar","occurrences":442},{"term":"battery","occurrences":407}]; 
    });
  };

  $scope.getTrends($scope.location, new Date($scope.selectionStart).yyyymmdd(), $scope.interval);
}]);