'use strict';

/* Controllers */
var startOfToday = function(){
  return Date.now() - (Date.now() % (24*60*60*1000));
}

var day   = 24*60*60*1000;
var today = startOfToday(); // CHANGE TO startOfToday(); to get up to date info

var udadisiControllers = angular.module('udadisiControllers', ['ngRoute']);

//Main Controller
udadisiControllers.controller('MainCtrl', ['$scope', '$route', '$timeout', 'Locations', '$log', function ($scope, $route, $timeout, Locations, $log) {
  // $scope.setActivePage will be available to all children 
  // scopes of this controller

  // Close the IE alert

  $("#ieWarning a").click(function() {
  $("#ieWarning").slideUp();
  return false;
  });


  // refresh the window on resize to stop trend graph breaking
  var windowWidth = $(window).width();
  
  $(window).resize(function() {
      if(windowWidth != $(window).width()) {
      location.reload();
      return;
      }
  });



  $scope.Math = window.Math;
  
  $scope.isLoading = false;
  $scope.loadingState = function(s){
    if (s){ $scope.isLoading = s; }
    else { $timeout(function(){$scope.isLoading = s}, 800); }
  };

  $scope.setActivePage = function(name) {
    $scope.activePage = name.replace(/\//g, '').replace(':', '-');
  };

  $scope.generateSeries = function(){
    var series = []; 
    var day = new Date();
    for(var i=0; i < 10; i++){
      day.setDate(day.getDate() + 1);
      series.push( Math.random()*100 );
    }
    //return series;
    return [];
  };

  $scope.generateExampleTrends = function(){

    return [];

    /*
    var trends = [{"term":"water-pump","occurrences":122, "velocity": 2.4, "series":[]},
    {"term":"solar","occurrences":92, "velocity": 1.3, "series":[]},
    {"term":"battery","occurrences":57, "velocity": 5.4, "series":[]}];

    trends.forEach(function(t){
      t.series = $scope.generateSeries();
    });

    return trends;*/
  };

  $scope.locations = [{ name: "all", geo_coord: { latitude: 0.0, longitude: 0.0 }, scale: 0.9 }];
  $scope.getLocations = function(){
    Locations.query({},
      function(data){  $scope.locations = data; }, 
      function(error){ $scope.locations = [{ name: "all", geo_coord: { latitude: 0.0, longitude: 0.0 }, scale: 0.9 }]; $scope.loadingState(false); });
  };
  $scope.getLocations();
  
  $scope.toggleMenu = function(view, clickEvent){     
    if ($(".open")[0]){
      $('nav#main-menu').slideUp();
      $(clickEvent.target).removeClass("open");
    } else {
      $('nav#main-menu').slideDown();
      $(clickEvent.target).addClass("open");
      $('html, body').css({
          'overflow': 'hidden',
          'height': '100%'
      });
    }
  };
  
  $scope.closeMenu = function(view, clickEvent){     
    if($(window).width() <= 600) {
      $('a#toggle .fa').removeClass("open");
       $('nav#main-menu').delay( 500 ).slideUp();
       $('html, body').css({
           'overflow': 'auto',
           'height': 'auto'
       });
    };
  };

  $scope.buildIntervals = function(interval, selectionStart, selectionEnd){
    var intervalTime = 0;
    var intervalSpans = [];
    intervalTime = (selectionEnd - selectionStart) / interval;
    var i = 0;
    for (i = 0; i < interval; i++) {
      intervalSpans.push({
        start: ((selectionStart-0) + (intervalTime * i)), 
        end: ((selectionStart-0) + (intervalTime * (i+1)))
      });
    }
    return intervalSpans;
  };

  $scope.source = "all";
  $scope.setSource = function(src){
    $scope.source = src;
    $scope.$apply();
  };

  $scope.location = { name: "all" };
  $scope.setLocation = function(name) {
    $scope.location = { name: name };
    $scope.$apply();
  };

  $scope.spanEnd   = today-1; //at 23:59:59
  $scope.spanStart = today-(31*day);
  $scope.setSpanStart = function(startDate) {
    $scope.spanStart = startDate;
    $scope.$apply();
  };

}]);

//About Controller
udadisiControllers.controller('AboutCtrl', ['$scope', '$route', '$log', function($scope, $route, $log){
  $scope.setActivePage($route.current.originalPath);
  $scope.loadingState(false);
}]);

//Home Controller
udadisiControllers.controller('HomeCtrl', ['$scope', '$route', '$log', '$window', 'Stats', 'LocationTrends', function($scope, $route, $log, $window, Stats, LocationTrends) { 
  $scope.setActivePage($route.current.originalPath);
  $scope.loadingState(false);
  
  $scope.getTrends = function(location, fromDate, interval){   
    LocationTrends.query({ location: location.name, limit: 5, from: fromDate, interval: interval, source: "" }, 
      function(data) {
        data = data.slice(0,5); //NB will just be in alphabetical order if all velocities are -1
        jQuery.each($scope.locations, function(i,l){
          if(location.name === l.name){ location.trends = data; }
        });
      },
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

  $scope.selectionStart = today-(4*day);
  $scope.interval = 2;
  $scope.globalLocation = undefined;
  $scope.query = "";
  
  $scope.$watch('locations', function(newValue, oldValue) {
    $.each($scope.locations, function(idx, item){
      if (item.name == "all"){ $scope.globalLocation = item; }
      $scope.getTrends(item, new Date($scope.selectionStart).toTimeString(), $scope.interval);
      //$scope.getStats(item);
    });
  });

}]);


//Location profile
udadisiControllers.controller('LocationsCtrl', ['$scope', '$route', '$routeParams', '$log', 'Stats', 'LocationTrends', 'IntervalService', function($scope, $route, $routeParams, $log, Stats, LocationTrends, IntervalService) { 
  $scope.setActivePage($route.current.originalPath);
  
  $scope.getTrends = function(location, fromDate, toDate, interval){ 
    $scope.loadingState(true);
    LocationTrends.query({ location: location.name, limit: 10, from: fromDate, to: toDate, interval: interval }, 
      function(data) {
        $scope.loadingState(false);
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

        data.sort(function(a,b){return b.velocity - a.velocity});
        data = data.slice(0,10);

        data.forEach(function(entry){  
          entry.topval = entry.velocity * entry.occurrences;
        });

        $scope.trends = data;
      },
      function(error){ 
        $scope.loadingState(false);
        $log.log("No trends returned for "+location.name);
        $scope.trends = $scope.generateExampleTrends();
      });
  };

  $scope.getStats = function(location){
    Stats.get({ location: location.name },
      function(result){ location.trendscount = result.trendscount; },
      function(error){ $log.log("No stats returned for "+location.name); });
  };

  //Set current location
  var n = $routeParams.location;
  if(n == "global") { n = "all"; }
  $scope.location = { name: n, geo_coord: { latitude: 0.0, longitude: 0.0 }, scale: 0.9 };

  $scope.$watch('locations', function(newValue, oldValue) {
    newValue.forEach(function(l){
      if (n === l.name){ $scope.location = l; return; }
    });
    if ($scope.location.name != "all"){ $scope.location.scale = 5; }
  });

  //Setup timeselection 
  if ($routeParams.selectionStart && $routeParams.selectionEnd){
    $scope.selectionStart = new Date(parseInt($routeParams.selectionStart));
    $scope.selectionEnd = new Date(parseInt($routeParams.selectionEnd));
    $scope.interval = IntervalService.calculateInterval($scope.selectionStart, $scope.selectionEnd);
  } else {
    $scope.selectionStart = today-(4*day);
    $scope.selectionEnd = today-1;
    $scope.interval = 4;
  }
  
  $scope.dataAvailable = true;

  $scope.getStats($scope.location);
  $scope.getTrends($scope.location, new Date($scope.selectionStart).toTimeString(), new Date($scope.selectionEnd).toTimeString(), $scope.interval);
  
  $scope.$watch('selectionStart', function(newValue, oldValue) { 
    $scope.intervalSpans = $scope.buildIntervals($scope.interval, $scope.selectionStart, $scope.selectionEnd);
  });

}]);


//Trend Profile
udadisiControllers.controller('TrendsCtrl', ['$scope', '$log', '$window', '$route', '$routeParams', 'RelatedTrends', 'IntervalService', function($scope, $log, $window, $route, $routeParams, RelatedTrends, IntervalService) { 
  $scope.setActivePage($route.current.originalPath);

  var generateFakeSources = function(){
    jQuery.each($scope.tabs, function(k,v){
      var i = 0;
      while (i < 23) {
        var newSrc = { posted: (new Date), source: k, source_uri: "http://bbc.co.uk/"+k+"/"+i };
        v.push(newSrc);
        if ($.isArray($scope.trendData.sources)){ $scope.trendData.sources.push(newSrc); } 
        else { $scope.trendData.sources = [newSrc]; }
        i++;
      }
    });
  };

  var generateFakeData = function(){   
    //return { velocity: 1, series: [Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10,Math.random()*10], related: $scope.generateExampleTrends() };
    return { velocity: 1, series: [], related: $scope.generateExampleTrends() };
  };
  
  var generateFakeSourcesData = function(){
    return [{term:"twitter", series:generateFakeData().series}, {term:"blog", series:generateFakeData().series}, {term:"academic", series: generateFakeData().series}, {term:"news", series: generateFakeData().series}];
  }

  $scope.calculatePrevalences = function(){
    var occurrences = [];
    jQuery.each($scope.prevalences, function(k,l){
      if (l.occurrences){ occurrences.push(l.occurrences); }
    });
    var max = occurrences.sort().reverse()[0];
    jQuery.each($scope.prevalences, function(k,l){
      if (l.occurrences){ l.prevalence = l.occurrences/max; } else { l.prevalence = 0; }
    });
  };

  $scope.populateSourcesTabs = function(sources){
    $scope.tabs = { "twitter":[], "blog":[], "academic":[], "news":[] };
    if (sources ===undefined){ //generateFakeSources(); 
      return; 
    }
    sources.forEach(function(src){
      if ($scope.tabs[src.source] === undefined) { $scope.tabs[src.source] = [src]; }
      else { $scope.tabs[src.source].push(src); }
    });
  };

  var calculateTotalLength = function(sourcesData){
    var totalLength = 0;
    sourcesData.forEach(function(entry){
      totalLength = totalLength + entry.series.length;
    });
    return totalLength;
  };

  $scope.lastSourcesRequest = [];
  $scope.getRelatedSources = function(location, fromDate, toDate, interval) {   
    if ($scope.lastSourcesRequest[0] == fromDate && $scope.lastSourcesRequest[1] == toDate){ return; }
    $scope.lastSourcesRequest = [fromDate, toDate];

    $scope.loadingState(true);
    var tempData = [];
    $.each($scope.location.sourcesData, function(idx, sourceData){
      RelatedTrends.query({ location: location.name, term: $scope.trend, limit: 5, from: fromDate, to: toDate, interval: interval, source: sourceData.term }, 
        function(data){
          if ((data === undefined) || (data.series === undefined) || (data.series.length === 0)){ data.series = []; }
          tempData.push({ term: sourceData.term, series: data.series });
          if (tempData.length >= location.sourcesData.length){
            $scope.loadingState(false);
            if (calculateTotalLength(tempData) > 0){ 
              $scope.location.sourcesData = tempData;
              $scope.sourcesDataAvailable = true;
            } else {
              $scope.location.sourcesData = generateFakeSourcesData();
              $scope.sourcesDataAvailable = false;
            }
          }
        },
        function(error){
          $log.log(error);
          tempData.push({ term: sourceData.term, series: [] });
          if (tempData.length >= location.sourcesData.length) { 
            if (calculateTotalLength(tempData) > 0){ $scope.location.sourcesData = tempData; } 
            else { $scope.location.sourcesData = generateFakeSourcesData(); }
            $scope.loadingState(false);
            $scope.sourcesDataAvailable = false;
          }
        });
    });
  };

  $scope.lastRelatedRequest = [];
  $scope.getRelatedTrends = function(location, fromDate, toDate, interval, source) {
    if (($scope.lastRelatedRequest[0] == fromDate) && ($scope.lastRelatedRequest[1] == toDate) && ($scope.lastRelatedRequest[2] == location.name)){ 
      return; 
    }
    $scope.lastRelatedRequest = [fromDate, toDate, location.name];

    var sourceParam = source;
    if (source === "all"){ sourceParam = "" }
    $scope.loadingState(true);
    var dataAvailable = false;

    RelatedTrends.query({ location: location.name, term: $scope.trend, limit: 5, from: fromDate, to: toDate, interval: interval, source: sourceParam }, 
      function(data){
        $scope.requestCounter++;
        if ($scope.requestCounter >= $scope.locations.length){ $scope.loadingState(false); }
        
        if ((data === undefined) || (data.series === undefined) || (data.series.length === 0)){
          data = generateFakeData();
          dataAvailable = false;
        } else {
          dataAvailable = true;
        }
        
        data.occurrences = data.series.reduce(function(a, b){return a+b;});

        if (location.name === "all"){ $scope.populateSourcesTabs(data.sources); }

        if ($scope.location.name === location.name){
          $scope.dataAvailable = dataAvailable;
          if ((source === "") || (source === "all")){
            $scope.location.seriesData = [{term:"All Sources", series: data.series }];
            $scope.trendData = data;
            $scope.relatedTrends = data.related.slice(0,10);
          }
        }

        if ((dataAvailable) && ((source === "") || (source === "all"))){ //should not run on regular update
          $scope.prevalences[location.name].occurrences = data.occurrences;
          if ($scope.requestCounter == $scope.locations.length){ $scope.calculatePrevalences(); }
        }
      },
      function(error){
        $scope.loadingState(false);
        $scope.calculatePrevalences();
        $log.log("Error returning trend data for "+$scope.trend); 
        $scope.requestCounter++
        if ($scope.requestCounter >= $scope.locations.length){ $scope.loadingState(false); }
      });
  };
  
  $scope.getCsv = function(){
    var frm = new Date($scope.selectionStart).toTimeString();
    var to = new Date($scope.selectionEnd).toTimeString();
    var src = $scope.source;
    if ($scope.source === 'all' ){ src = ''; }
    var csvUrl = ('http://engine.udadisi.com/v1/locations/'+$scope.location.name+'/trends/'+$scope.trend+'/csv?source='+src+'&from='+frm+'&to='+to);
    $window.open(csvUrl, '_blank');
  };

  $scope.dataAvailable = false;
  $scope.sourcesDataAvailable = false;
  $scope.trendData = { term: $routeParams.trend, velocity:0, sources:[], series: [] };
  $scope.trend = $routeParams.trend;
  $scope.relatedTrends = [];

  if ($routeParams.location === undefined){ $scope.location = { name: "all" }; }
  else { $scope.location = { name: $routeParams.location }; }
  $scope.location.seriesData = [{term:"All Sources", series:generateFakeData().series}];
  $scope.location.sourcesData = generateFakeSourcesData();

  if ($routeParams.selectionStart && $routeParams.selectionEnd){
    $scope.selectionStart = new Date(parseInt($routeParams.selectionStart));
    $scope.selectionEnd = new Date(parseInt($routeParams.selectionEnd));
    $scope.interval = IntervalService.calculateInterval($scope.selectionStart, $scope.selectionEnd);
  } else {
    $scope.selectionStart = today-(4*day);
    $scope.selectionEnd = today-1;
    $scope.interval = 4;
  }

  $scope.tabs = { "twitter":[], "blog":[], "academic":[], "news":[] };
  $scope.prevalences = {};

  $scope.updateFn = $scope.getRelatedTrends;

  $scope.$watch('locations', function(newValue, oldValue) {
    $scope.requestCounter = 0;    
    $scope.locations.forEach(function(location){
      $scope.prevalences[location.name] = location;
      $scope.getRelatedTrends(location, new Date($scope.selectionStart).toTimeString(), new Date($scope.selectionEnd).toTimeString(), $scope.interval, "all");
    });
  });
    
  $scope.resetPanels = function(){
    $('.trendPanel, #overlay').removeClass("active");
    $('.trendPanel').attr("style", "");
  };

  $scope.pageSize = 10;
  $scope.pageIdx = 0;
  $scope.changePage = function(page){
    $scope.pageIdx = (page-1)*$scope.pageSize;
  };

  $scope.toggleView = function(view, clickEvent){
    $("#graphTabs button").removeClass("active");
    $(clickEvent.target).addClass("active");
    $("#trend-graphs").removeClass("history-tab-open");
    $("#trend-graphs").removeClass("sources-tab-open");
    $("#trend-graphs").removeClass("related-tab-open");

    if (view == "sources"){
      $scope.updateFn = $scope.getRelatedSources;
      $scope.getRelatedSources($scope.location, new Date($scope.selectionStart).toTimeString(), new Date($scope.selectionEnd).toTimeString(), $scope.interval);
    } else {
      $scope.updateFn = $scope.getRelatedTrends;
      $scope.getRelatedTrends($scope.location, new Date($scope.selectionStart).toTimeString(), new Date($scope.selectionEnd).toTimeString(), $scope.interval, "all");
    }

    $("#trend-graphs").addClass(view + "-tab-open");
    $scope.changePage(0);
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
    $scope.pageSize = 10;
    $scope.pageIdx = 0;
    $("ul.pagination li").removeClass("active");
    $("section."+view+"-tab-open ul.pagination li:first-of-type").addClass("active");
  };

  $scope.$watch('selectionStart', function(newValue, oldValue) { 
    $scope.intervalSpans = $scope.buildIntervals($scope.interval, $scope.selectionStart, $scope.selectionEnd);
  });

}]);


//Trend Explorer
udadisiControllers.controller('ExplorerCtrl', ['$scope', '$location', '$route', '$log', '$routeParams', 'LocationTrends', 'IntervalService', function($scope, $location, $route, $log, $routeParams, LocationTrends, IntervalService) { 
  $scope.loadingState(false);
  $scope.setActivePage($route.current.originalPath);
  $scope.currentView = 'wordcloud';

  $scope.dataAvailable = false;
  $scope.trends = $scope.generateExampleTrends();
  
  if ($routeParams.selectionStart && $routeParams.selectionEnd){
    $scope.selectionStart = new Date(parseInt($routeParams.selectionStart));
    $scope.selectionEnd = new Date(parseInt($routeParams.selectionEnd));
    $scope.interval = IntervalService.calculateInterval($scope.selectionStart, $scope.selectionEnd);
  } else {
    $scope.selectionStart = today-(4*day);
    $scope.selectionEnd = today-1;
    $scope.interval = 4;
  }

  if ($routeParams.source){
    $scope.source = $routeParams.source;
  }

  if ($routeParams.location){
    $scope.location = { name: $routeParams.location }
  }

  $scope.shareResults = function(clickEvent){
    $('#share').show();
    var frm = new Date($scope.selectionStart).toTimeString();
    var to = new Date($scope.selectionEnd).toTimeString();
    var currUrl = ($location.protocol()+'://'+$location.host()+'/#/trend-explorer?location='+$scope.location.name+'&source='+$scope.source+'&selectionStart='+frm+'&selectionEnd='+to);
    $('#share input').val(currUrl).select();
  };

  $scope.getTrends = function(location, fromDate, toDate, interval, source){
    if ((source === undefined) || (source == "all")){ source = "" }
    
    $scope.loadingState(true);
    LocationTrends.query({ location: location.name, limit: 10, from: fromDate, to: toDate, interval: interval, source: source }, function(data) {
      $scope.dataAvailable = true;
      $scope.loadingState(false);

      var totalVelocity = 0;
      data.forEach(function(entry){
        totalVelocity = totalVelocity + entry.velocity;
      });

      if ((data === null) || (data.length == 0) || (totalVelocity <= 0)){
        data = $scope.generateExampleTrends();
        $scope.dataAvailable = false;
      }

      $scope.trends = data.slice(0,10);
      if ($(".open")[0]){ $scope.hideFilters(); }

    }, function(error){
      $scope.dataAvailable = false;
      $scope.loadingState(false);
      $log.log("Server error finding trends.");
      $scope.trends = $scope.generateExampleTrends();
    });
  };

  $scope.resetPanels = function(){
    $('.trendPanel, #overlay').removeClass("active");
    $('.trendPanel').attr("style", "");
  };

  $scope.toggleExplorerView = function(view, clickEvent){
    $scope.resetPanels();
    $("#graph-container").removeClass("wordcloud-container");
    $("#graph-container").removeClass("scatterplot-container");
    $("#graph-container").removeClass("list-container");
    $("#graph-container").removeClass("treemap-container");
    $("#graph-container").addClass(view + "-container");
    $("#viewOptions button").removeClass("active");
    $(clickEvent.target).addClass("active");    
  };

  $scope.toggleExplorerLocation = function(view, clickEvent){
    $scope.resetPanels();
    $("#locationOptions button").removeClass("active");
    $(clickEvent.target).addClass("active");    
  };

  $scope.hideFilters = function(){
    $('#side-menu').removeClass('active');
    $('#toggleViews').slideUp();
    $('#showFiltersMobile').removeClass("open");
  };

  $scope.toggleFilters = function(view, clickEvent){
    if ($(".open")[0]){
      $scope.hideFilters();
    } else {
      $('#toggleViews').slideDown();
      $('#showFiltersMobile').addClass("open");
      $('#side-menu').addClass('active');
    }
  };

  $scope.getTrends($scope.location, new Date($scope.selectionStart).toTimeString(), new Date($scope.selectionEnd).toTimeString(), $scope.interval, $scope.source);

}]);