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
    when('/view2', {
      templateUrl: 'partials/view2.html',
      controller: 'View2Ctrl'
    }).
    otherwise({redirectTo: '/home'});
}]);