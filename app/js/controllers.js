'use strict';

/* Controllers */
var startOfToday = function(){
  return Date.now() - (Date.now() % (24*60*60*1000));
}

var calculateVelocity = function(series){
  var count = 0;
  series.forEach(function(e){
    count = count + e;
  });
  var avg = count/series.length;
  return series[series.length-1] / avg;
};

var day   = 24*60*60*1000;
var today = startOfToday(); // CHANGE TO startOfToday(); to get up to date info

var udadisiControllers = angular.module('udadisiControllers', ['ngRoute']);


//Main Controller
udadisiControllers.controller('MainCtrl', ['$scope', '$route', 'Locations', function ($scope, $route, Locations) {
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
      series.push({ date: day.toTimeString(), close: Math.random()*100 });
    }
    return series;
  };

  $scope.generateExampleTrends = function(){
    var trends = [{"term":"water-pump","occurrences":452, "velocity": 2.4, "series":[]},
    {"term":"solar","occurrences":442, "velocity": 0.3, "series":[]},
    {"term":"battery","occurrences":407, "velocity": 5.4, "series":[]}];

    trends.forEach(function(t){
      t.series = $scope.generateSeries();
    });

    return trends;
  };

  $scope.locations = [{ name: "all" }];
  Locations.query({}, function(data){
    $scope.locations = data;
  });
  
  
    $scope.toggleMenu = function(view, clickEvent){     
     if ($(".open")[0]){
         $('ul.pure-menu-list').slideUp();
         $(clickEvent.target).removeClass("open");
     } else {
         $('ul.pure-menu-list').slideDown();
         $(clickEvent.target).addClass("open");
     }
     };


}]);


//Home Controller
udadisiControllers.controller('HomeCtrl', ['$scope', '$route', '$log', '$window', 'Stats', 'LocationTrends', function($scope, $route, $log, $window, Stats, LocationTrends) { 
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

  $scope.search = function(){
    $window.location.href = '#/trends/'+$scope.query;
  };

  $scope.selectionStart = today-(1*day);
  $scope.interval = 1;
  $scope.globalLocation = undefined;
  $scope.query = "";
  
  $.each($scope.locations, function(idx, item){
    if (item.name == "all"){ $scope.globalLocation = item; }
    $scope.getTrends(item, new Date($scope.selectionStart).toTimeString(), $scope.interval);
    $scope.getStats(item);
  });

}]);


//Location profile
udadisiControllers.controller('LocationsCtrl', ['$scope', '$route', '$routeParams', '$log', 'Stats', 'LocationTrends', function($scope, $route, $routeParams, $log, Stats, LocationTrends) { 
  $scope.setActivePage($route.current.originalPath);

  $scope.getTrends = function(location, fromDate, toDate, interval){ 
    LocationTrends.query({ location: location.name, limit: 10, from: fromDate, to: toDate, interval: interval }, 
      function(data) {
        $scope.dataAvailable = true;
        if (data.length == 0){
          $log.log("Series data empty, keeping existing values.");
          data = $scope.generateExampleTrends();
          $scope.dataAvailable = false;
        } else if (data[0].series == undefined) {
          $log.log("Object has no series, generating values.");
          data.forEach(function(entry){  
            entry.series = $scope.generateSeries();
          });
        }
        data.forEach(function(entry){  
          entry.topval = entry.velocity * entry.occurrences;
        });
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

  if ($routeParams.selectionStart && $routeParams.selectionEnd){
    $scope.selectionStart = new Date(parseInt($routeParams.selectionStart));
    $scope.selectionEnd = new Date(parseInt($routeParams.selectionEnd));
  } else {
    $scope.selectionStart = today-(1*day);
    $scope.selectionEnd = today-1;
  }

  $scope.spanEnd   = today-1;
  $scope.spanStart = today-(91*day);

  $scope.interval = 2;
  $scope.dataAvailable = true;
  $scope.getStats($scope.location);
  $scope.getTrends($scope.location, new Date($scope.selectionStart).toTimeString(), new Date($scope.selectionEnd).toTimeString(), $scope.interval);
}]);


//Trend Profile
udadisiControllers.controller('TrendsCtrl', ['$scope', '$log', '$route', '$routeParams', 'RelatedTrends', function($scope, $log, $route, $routeParams, RelatedTrends) { 
  $scope.setActivePage($route.current.originalPath);

  $scope.sources = [{term: "All", series:[]}, {term: "Twitter", series:[]}, {term: "Blogs", series:[]}, {term: "News", series:[]}, {term: "Academia", series:[]}];

  $scope.getRelatedTrends = function(location, fromDate, toDate, interval) {
    RelatedTrends.query({ location: location.name, term: $scope.trend, limit: 5, from: fromDate, interval: interval }, 
      function(data){
        if ((data === undefined) || (data.series === undefined) || (data.series.length === 0)){           
          var src = [{term: "All", series:[]}, {term: "Twitter", series:[]}, {term: "Blogs", series:[]}, {term: "News", series:[]}, {term: "Academia", series:[]}]; 
          data = { velocity: 0, series: [Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10] };
          src.forEach(function(s){ s.series = data.series });
          data.occurrences = data.series.reduce(function(a, b){return a+b;});
          $scope.sources = src;
          $scope.trendData = data;
          $scope.dataAvailable = false; 
        } else {
          data.occurrences = data.series.reduce(function(a, b){return a+b;});
          $scope.trendData = data;
          $scope.relatedTrends = data.related;
          var src = [{term: "Twitter", series:[]}];
          src[0].series = data.series;
          $scope.sources = src;
          $scope.dataAvailable = true;
        }
      },
      function(error){ $log.log("Error returning trend data for "+$scope.trend); });
  };

  if ($routeParams.location === undefined){ $scope.location = { name: "all" }; } 
  else { $scope.location = { name: $routeParams.location }; }

  $scope.trendData = { term: $routeParams.trend, velocity:0 };
  $scope.trend = $routeParams.trend;
  $scope.relatedTrends = [];

  if ($routeParams.selectionStart && $routeParams.selectionEnd){
    $scope.selectionStart = new Date(parseInt($routeParams.selectionStart));
    $scope.selectionEnd = new Date(parseInt($routeParams.selectionEnd));
  } else {
    $scope.selectionStart = today-(1*day);
    $scope.selectionEnd = today-1;
  }

  $scope.spanEnd   = today-1;
  $scope.spanStart = today-(91*day);
  $scope.interval = 4;

  $scope.dataAvailable = true;
  
  $scope.locations.forEach(function(location){
    $scope.getRelatedTrends(location, new Date($scope.selectionStart).toTimeString(), new Date($scope.selectionEnd).toTimeString(), $scope.interval); //, $scope.interval);
  });
  
  $scope.toggleView = function(view, clickEvent){
    $("#graphTabs button").removeClass("active");
    $(clickEvent.target).addClass("active");
    $("#trend-graphs").removeClass("history-tab-open");
    $("#trend-graphs").removeClass("sources-tab-open");
    $("#trend-graphs").removeClass("related-tab-open");
    $("#trend-graphs").addClass(view + "-tab-open");
  };


  $scope.toggleSources = function(view, clickEvent){
    $("#sourcesTabs button").removeClass("active");
    $(clickEvent.target).addClass("active");
    $("#trendSources").removeClass("all-tab-open");
    $("#trendSources").removeClass("twitter-tab-open");
    $("#trendSources").removeClass("academic-tab-open");
    $("#trendSources").removeClass("news-tab-open");
    $("#trendSources").removeClass("blog-tab-open");
    $("#trendSources").addClass(view + "-tab-open");
  };  

  $scope.pageSize = 10;
  $scope.pageIdx = 0;
  $scope.foob = function(page){
    $scope.pageIdx = (page-1)*$scope.pageSize;
  };
  
}]);


//Trend Explorer
udadisiControllers.controller('ExplorerCtrl', ['$scope', '$route', '$log', '$routeParams', 'LocationTrends', function($scope, $route, $log, $routeParams, LocationTrends) { 

  $scope.setActivePage($route.current.originalPath);
  $scope.currentView = 'wordcloud';

  $scope.dataAvailable = true;

  $scope.spanEnd   = today-1; //at 23:59:59
  $scope.spanStart = today-(91*day);
  
  if ($routeParams.selectionStart && $routeParams.selectionEnd){
    $scope.selectionStart = new Date(parseInt($routeParams.selectionStart));
    $scope.selectionEnd = new Date(parseInt($routeParams.selectionEnd));
  } else {
    $scope.selectionStart = today-(1*day);
    $scope.selectionEnd = today-1;
  }

  $scope.location = { name: "all" };
  $scope.interval = 4;

  $scope.setLocation = function(name) {
    $scope.location = { name: name }
    $scope.$apply();
  };

  $scope.getTrends = function(location, fromDate, toDate, interval){
    LocationTrends.query({ location: location.name, limit: 10, from: fromDate, to: toDate, interval: interval }, function(data) {
      $scope.dataAvailable = true;

      var totalVelocity = 0;
      data.forEach(function(entry){
        totalVelocity = totalVelocity + entry.velocity;
      });

      if ((data.length == 0) || (totalVelocity === 0)){
        data = $scope.generateExampleTrends();
        $scope.dataAvailable = false;
      }

      data.forEach(function(e){
        if (!isNaN(e.series[0])){ e.velocity = calculateVelocity(e.series); }
      });

      data.sort(function(a,b){return b.velocity - a.velocity});
      $scope.trends = data;
      $scope.trends.forEach(function(trend, idx){ $log.log(idx + ' ' + trend.term); });
    }, function(error){
      $scope.dataAvailable = false;
      $log.log("Server error finding trends.");
      $scope.trends = $scope.generateExampleTrends();
    });
  };

  $scope.resetPanels = function(){
    $('.trendPanel, #overlay').removeClass("active");
    $('.trendPanel').attr("style", "");
  };

  $scope.toggleExplorer = function(view){
    $scope.resetPanels();
    $("#graph-container").removeClass("wordcloud-container");
    $("#graph-container").removeClass("scatterplot-container");
    $("#graph-container").removeClass("list-container");
    $("#graph-container").removeClass("treemap-container");
    $("#graph-container").addClass(view + "-container");
  };

  $scope.getTrends($scope.location, new Date($scope.selectionStart).toTimeString(), new Date($scope.selectionEnd).toTimeString(), $scope.interval);

}]);