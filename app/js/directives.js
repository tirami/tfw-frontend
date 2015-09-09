'use strict';

/* Directives */
var udadisiDirectives = angular.module('udadisiDirectives', []);

udadisiDirectives.directive('wordcloud', [
  function() {
    return { restrict: 'A', scope: {}, template: 'my word cloud',
      link: function(scope, element, attrs) { }
    }
  }
]);