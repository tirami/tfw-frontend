'use strict';

/* Controllers */

var udadisiControllers = angular.module('udadisiControllers', ['ngRoute']);

udadisiControllers.controller('HomeCtrl', ['$scope', '$log', 'Trends', function($scope, $log, Trends) { 
  $scope.getTrends = function(location){ Trends.query({ location: location }, function(data) {
      $scope.trends = data;
    }, function(error){
      //$log.log(error);
      $scope.trendsMessage = "No trends received from remote server, using examples: "
      $scope.trends = [{"term":"solar","occurrences":442},{"term":"battery","occurrences":407}]; 
    }); 
  };
  $scope.getTrends('all');
}]);

udadisiControllers.controller('LocationsCtrl', ['$scope', '$routeParams',
  function($scope, $routeParams) { $scope.location = $routeParams.location; 
}]);

udadisiControllers.controller('TrendsCtrl', ['$scope', '$routeParams', 
  function($scope, $routeParams) { $scope.trend = $routeParams.trend; 
}]);

udadisiControllers.controller('ExplorerCtrl', ['$scope', '$routeParams', 
  function($scope, $routeParams) { //stuff
}]);