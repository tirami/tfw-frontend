'use strict';

/* Filters */
var udadisiFilters = angular.module('udadisiFilters', []);

udadisiFilters.filter('allAsGlobal', function() {
  return function(input) {
    if (input == 'all') { return 'Global' } else { return input; }
  };
})

udadisiFilters.filter('boolAsActive', function() {
  return function(input) {
    if (input) { return 'active' } else { return ''; }
  };
})

udadisiFilters.filter('urlEncode', [function() {
  return window.encodeURIComponent;
}]);

/*

udadisiFilters.filter('urlEncode', function() {
  return function(input) { 
    return window.encodeURIComponent(input); 
  }
});
*/