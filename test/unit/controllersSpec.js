'use strict';

describe('Udadisi controllers module', function() {

  beforeEach(module('udadisiApp'));
  
  describe('home controller', function(){
    it('should ....', inject(function($controller) {
      //spec body
      var controller = $controller('HomeCtrl');
      expect(controller).toBeDefined();
    }));
  });

  describe('trends controller', function(){
    it('should ....', inject(function($controller) {
      //spec body
      var controller = $controller('TrendsCtrl', { $scope: {} });
      expect(controller).toBeDefined();
    }));
  });

  describe('locations controller', function(){
    /*var scope;

    beforeEach(inject(function(_$rootScope_){
      scope = $rootScope.$new();
    }));*/

    it('should ....', inject(function($controller) {
      //spec body
      var controller = $controller('LocationsCtrl', { $scope: {} });
      expect(controller).toBeDefined();
    }));
  });

  describe('trend explorer controller', function(){
    it('should ....', inject(function($controller) {
      //spec body
      var controller = $controller('ExplorerCtrl');
      expect(controller).toBeDefined();
    }));
  });
});