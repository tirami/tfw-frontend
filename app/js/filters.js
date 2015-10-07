'use strict';

/* Filters */
angular.module('udadisiFilters', []).filter('allAsGlobal', function() {
  return function(input) {
    if (input == 'all') { return 'Global' } else { return input; }
  };
})