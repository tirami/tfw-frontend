'use strict';

/* Filters */
var udadisiFilters = angular.module('udadisiFilters', []);

udadisiFilters.filter('allAsGlobal', function() {
  return function(input) {
    if (input == 'all') { return 'Global' }
    else if (input == 'ALL') { return 'GLOBAL' }
    else { return input; }
  };
})

udadisiFilters.filter('unspecifiedFull', function() {
  return function(input) {
    if (input == 'unspecified') { return 'unspecified locations' }
    else if (input == 'Unspecified') { return 'unspecified locations' }
    else { return input; }
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

udadisiFilters.filter('displayRange', function() {
  return function(range) {
    return (new Date(range.start)).toTimeString() + " ~ " + (new Date(range.end)).toTimeString();
  };
});