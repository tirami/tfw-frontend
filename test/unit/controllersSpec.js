'use strict';

describe('Udadisi controllers module', function() {

  beforeEach(module('udadisiApp'));
  var scope, controller;

  describe('Home controller', function(){
    
    beforeEach(inject(function($controller) {
      scope = {};
      controller = $controller('HomeCtrl', {$scope:scope});
    }));

    it('should be defined... ', function() {
      expect(controller).toBeDefined();
    });
  });

  describe('trends controller', function(){
    beforeEach(inject(function($controller) {
      scope = {};
      controller = $controller('TrendsCtrl', {$scope:scope});
    }));

    it('should be defined... ', function() {
      expect(controller).toBeDefined();
    });
  });
  
  describe('locations controller', function(){
    beforeEach(inject(function($controller) {
      scope = {};
      controller = $controller('LocationsCtrl', {$scope:scope});
    }));

    it('should be defined... ', function() {
      expect(controller).toBeDefined();
    });
  });

  describe('trend explorer controller', function(){
    beforeEach(inject(function($controller) {
      scope = {};
      controller = $controller('ExplorerCtrl', {$scope:scope});
    }));

    it('should be defined... ', function() {
      expect(controller).toBeDefined();
    });
  });

});