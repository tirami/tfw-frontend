'use strict';

/* Controllers */
var startOfToday = function(){
  return Date.now() - (Date.now() % (24*60*60*1000));
}

var day   = 24*60*60*1000;
var today = startOfToday(); // CHANGE TO startOfToday(); to get up to date info

var udadisiControllers = angular.module('udadisiControllers', ['ngRoute']);

udadisiControllers.controller('HomeCtrl', ['$scope', '$log', '$window', 'Locations', 'Stats', 'LocationTrends', function($scope, $log, $window, Locations, Stats, LocationTrends) { 

  $scope.getTrends = function(location, fromDate, interval){ 
    LocationTrends.query({ location: location.name, limit: 5, from: fromDate, interval: interval }, 
      function(data) { location.trends = data; }, 
      function(error){ $log.log("No trends returned for "+location.name); });
  };

  $scope.getStats = function(location){
    Stats.get({ location: location.name }, 
      function(result){ location.trendscount = result.trendscount; },
      function(error){ $log.log("No stats returned for "+location.name); });
  };

  var exampleTrends = [{"term":"water-pump","occurrences":452},{"term":"solar","occurrences":442},{"term":"battery","occurrences":407}];
  $scope.locations = [{name:"all", trends:exampleTrends, trendscount: 100}, {name: "dhaka", trends:exampleTrends, trendscount: 100}, {name: "lima", trends:exampleTrends, trendscount: 100}, {name: "nairobi", trends:exampleTrends, trendscount: 100}];
  $scope.selectionStart = today-(1*day);
  $scope.interval = 1;
  $scope.globalLocation = undefined;

  Locations.query({}, function(data){
    $scope.locations = [];
    $.each(data, function(idx, item){
      var location = {name: item.Name, trends:[], trendscount: 0 };
      $scope.locations.push(location);
      if (location.name == "all"){ $scope.globalLocation = location; }
      $scope.getTrends(location, new Date($scope.selectionStart).yyyymmdd(), $scope.interval);
      $scope.getStats(location);
    });
  });
  
  $scope.query = "";
  $scope.search = function(){
    $window.location.href = '/app/#/trends/'+$scope.query;
  };

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
  $scope.spanStart = today-(31*day);
  
  $scope.selectionStart = today-(1*day);
  $scope.location = "all";
  $scope.interval = 1;

  $scope.getTrends = function(location, fromDate, interval){ LocationTrends.query({ location: location, limit: 10, from: fromDate, interval: interval }, function(data) {
      $scope.trends = data;
    }, function(error){
      $scope.trendsMessage = "No trends received from remote server, using examples: ";
      $scope.trends = [{"term":"water-pump","occurrences":452},{"term":"solar","occurrences":442},{"term":"battery","occurrences":407}]; 
    });
  };

  $scope.getTrends($scope.location, new Date($scope.selectionStart).yyyymmdd(), $scope.interval);

  $scope.showTextView = true;
  $scope.toggleView = function() { $scope.showTextView = $scope.showTextView === false ? true: false; };
}]);