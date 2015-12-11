'use strict';

/* Controllers */
var startOfToday = function(){
  return Date.now() - (Date.now() % (24*60*60*1000));
}

var day   = 24*60*60*1000;
var today = startOfToday(); // CHANGE TO startOfToday(); to get up to date info

var udadisiControllers = angular.module('udadisiControllers', ['ngRoute']);


//Main Controller
udadisiControllers.controller('MainCtrl', ['$scope', '$route', function ($scope, $route) {
  // $scope.setActivePage will be available to all children 
  // scopes of this controller

  $scope.Math = window.Math;

  $scope.setActivePage = function(name) {
    $scope.activePage = name.replace(/\//g, '').replace(':', '-');
  };

  $scope.generateSeries = function(){
    var series = []; 
    var day = new Date();
    for(var i=0; i < 10; i++){
      day.setDate(day.getDate() + 1);
      series.push({ date: day.yyyymmdd(), close: Math.random()*100 });
    }
    return series;
  };

  $scope.generateExampleTrends = function(){
    var trends = [{"term":"water-pump","occurrences":452, "series":[]},{"term":"solar","occurrences":442,"series":[]},{"term":"battery","occurrences":407,"series":[]}];
    trends.forEach(function(t){
      t.series = $scope.generateSeries();
    });
    return trends;
  };

}]);


//Home Controller
udadisiControllers.controller('HomeCtrl', ['$scope', '$route', '$log', '$window', 'Locations', 'Stats', 'LocationTrends', function($scope, $route, $log, $window, Locations, Stats, LocationTrends) { 
  $scope.setActivePage($route.current.originalPath);

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
    $window.location.href = '#/trends/'+$scope.query;
  };

}]);


//Location profile
udadisiControllers.controller('LocationsCtrl', ['$scope', '$route', '$routeParams', '$log', 'Stats', 'LocationTrends', function($scope, $route, $routeParams, $log, Stats, LocationTrends) { 
  $scope.setActivePage($route.current.originalPath);
  
  $scope.getTrends = function(location, fromDate, interval){ 
    LocationTrends.query({ location: location.name, limit: 5, from: fromDate, interval: interval }, 
      function(data) {
        $scope.dataAvailable = true;
        if (data.length == 0){
          $log.log("Series data empty, keeping existing values.");
          data = $scope.generateExampleTrends();
          $scope.dataAvailable = false;
        }
        else if (data[0].series == undefined) {
          $log.log("Object has no series, generating values.");
          data.forEach(function(entry){  
            entry.series = $scope.generateSeries();
          }); 
        }
        $scope.trends = data;
      },
      function(error){ 
        $log.log("No trends returned for "+location.name);
        $scope.trends = $scope.generateExampleTrends();
      });
  };

  $scope.getStats = function(location){
    Stats.get({ location: location.name },
      function(result){ location.trendscount = result.trendscount; },
      function(error){ $log.log("No stats returned for "+location.name); });
  };

  var n = $routeParams.location;
  if(n == "global") { n = "all"; }
  $scope.location = { name: n, trendscount: 0 }
  
  $scope.selectionStart = today-(1*day);
  $scope.spanEnd   = today-1;
  $scope.spanStart = today-(91*day);
  $scope.interval = 1;
  $scope.dataAvailable = true;
  $scope.getStats($scope.location);
  $scope.getTrends($scope.location, new Date($scope.selectionStart).yyyymmdd(), $scope.interval);
}]);


//Trend Profile
udadisiControllers.controller('TrendsCtrl', ['$scope', '$log', '$route', '$routeParams', 'Locations', 'RelatedTrends', function($scope, $log, $route, $routeParams, Locations, RelatedTrends) { 
  $scope.setActivePage($route.current.originalPath);

  //{name: "dhaka", prevalence: Math.random()*10, latitude: 23.7000, longitude: 90.3667 }, 
  $scope.locations = [
    {name: "all",     trend: { name: $routeParams.trend }, prevalence: Math.random()*10 }, 
    {name: "lima",    trend: { name: $routeParams.trend }, prevalence: Math.random()*10, latitude:-12.0433, longitude: -77.0283 }, 
    {name: "nairobi", trend: { name: $routeParams.trend }, prevalence: Math.random()*10, latitude: -1.2833, longitude: 36.8167}, 
    {name: "durban",  trend: { name: $routeParams.trend }, prevalence: Math.random()*10, latitude: -29.8833, longitude: 31.0500}];

  $scope.getRelatedTrends = function(location, trend, fromDate, interval) {
    RelatedTrends.query(
      { location: location.name, term: trend.name, limit: 5, from: fromDate, interval: interval }, 
      function(data){ 
        location.trend.word_counts = data[0].word_counts; 
        location.trend.sources = data[0].sources; 
        if ($scope.location === location){ $scope.relatedTrends = data[0].word_counts; }
      },
      function(error){ $log.log("No trends returned for "+trend.name); });
  };

  $scope.getSources = function(){
    $scope.sources = [{term: "All", series:[]}, {term: "Twitter", series:[]}, {term: "Blogs", series:[]}, {term: "News", series:[]}, {term: "Academia", series:[]}];
    $scope.sources.forEach(function(s){
      s.series = $scope.generateSeries();
    });
  };

  /*
  Locations.query({}, function(data){
    $scope.locations = [];
    $.each(data, function(idx, item){
      var location = {name: item.Name, trend: {}, prevalence: Math.random()*10 };
      $scope.locations.push(location);
    });
  }); */

  $scope.location = $scope.locations[0];
  $scope.trend = $scope.locations[0].trend;
  $scope.relatedTrends = [];

  $scope.selectionStart = today-(1*day);
  $scope.spanEnd   = today-1;
  $scope.spanStart = today-(91*day);
  $scope.interval = 1;
  
  $scope.locations.forEach(function(location){
    $scope.getRelatedTrends(location, $scope.trend, "", 0); //new Date($scope.selectionStart).yyyymmdd(), $scope.interval);
  });

  $scope.getSources();
}]);


//Trend Explorer
udadisiControllers.controller('ExplorerCtrl', ['$scope', '$route', '$log', 'LocationTrends', 'Locations', function($scope, $route, $log, LocationTrends, Locations) { 
  $scope.setActivePage($route.current.originalPath);

  //today = 1440111600000; // CHANGE TO startOfToday(); to get up to date info
  $scope.spanEnd   = today-1; //at 23:59:59
  $scope.spanStart = today-(91*day);
  
  $scope.selectionStart = today-(1*day);
  $scope.location = { name: "all" };
  $scope.interval = 1;

  $scope.getTrends = function(location, fromDate, interval){ 
    $log.log(location);
    LocationTrends.query({ location: location.name, limit: 10, from: fromDate, interval: interval }, function(data) {
      $scope.trends = data;
    }, function(error){
      $scope.trendsMessage = "No trends received from remote server, using examples: ";
      $scope.trends = [{"term":"water-pump","occurrences":452},{"term":"solar","occurrences":442},{"term":"battery","occurrences":407}]; 
    });
  };

  $scope.getTrends($scope.location, new Date($scope.selectionStart).yyyymmdd(), $scope.interval);

  $scope.locations = [{ name: "all" }, { name: "lima" }, { name: "nairobi" }, { name: "durban" }];
  Locations.query({}, function(data){
    $scope.locations = [];
    $.each(data, function(idx, item){  $scope.locations.push(item.Name);  });
  });

  $scope.currentView = 'wordcloud';

  $scope.resetPanels = function(){
    $('.trendPanel, #overlay').removeClass("active");
    $('.trendPanel').attr("style", "");
  };

  $scope.toggleView = function(view){
    $scope.resetPanels();
    $("#graph-container").removeClass("wordcloud-container");
    $("#graph-container").removeClass("scatterplot-container");
    $("#graph-container").removeClass("list-container");
    $("#graph-container").removeClass("block-container");
    $("#graph-container").addClass(view + "-container");
  };

}]);