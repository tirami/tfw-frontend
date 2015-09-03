'use strict';

describe('Udadisi controllers module', function() {

  beforeEach(module('udadisiApp'));

  describe('home controller', function(){
    it('should ....', inject(function($controller) {
      //spec body
      var homeCtrl = $controller('HomeCtrl');
      expect(homeCtrl).toBeDefined();
    }));
  });

  describe('view2 controller', function(){
    it('should ....', inject(function($controller) {
      //spec body
      var view2Ctrl = $controller('View2Ctrl');
      expect(view2Ctrl).toBeDefined();
    }));
  });
});