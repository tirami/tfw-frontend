'use strict';

/* https://github.com/angular/protractor/blob/master/docs/toc.md */

describe('udadisi app', function() {


  it('should automatically redirect to /home when location hash/fragment is empty', function() {
    browser.get('app/index.html');
    expect(browser.getLocationAbsUrl()).toMatch("/home");
  });


  describe('home', function() {

    beforeEach(function() {
      browser.get('app/index.html#/home');
    });


    it('should render home when user navigates to /home', function() {
      expect(element.all(by.css('[ng-view] p')).first().getText()).
        toMatch(/partial for home/);
    });

  });


  describe('view2', function() {

    beforeEach(function() {
      browser.get('app/index.html#/view2');
    });


    it('should render view2 when user navigates to /view2', function() {
      expect(element.all(by.css('[ng-view] p')).first().getText()).
        toMatch(/partial for view 2/);
    });

  });
});
