'use strict';

// Declare app level module which depends on views, and components
var udadisiApp = angular.module('udadisiApp', [
  'ngRoute',
  'udadisiControllers'
]);

udadisiApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/home', {
      templateUrl: 'partials/home.html',
      controller: 'HomeCtrl'
    }).
    when('/about', {
      templateUrl: 'partials/about.html',
      controller: 'HomeCtrl'
    }).
    when('/locations/:location', {
      templateUrl: 'partials/location-profile.html',
      controller: 'LocationsCtrl'
    }).
    when('/trends/:trend', {
      templateUrl: 'partials/trend-profile.html',
      controller: 'TrendsCtrl'
    }).
    when('/trend-explorer', {
      templateUrl: 'partials/trend-explorer.html',
      controller: 'ExplorerCtrl'
    }).
    otherwise({redirectTo: '/home'});
}]);