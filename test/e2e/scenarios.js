'use strict';

/* https://github.com/angular/protractor/blob/master/docs/toc.md */

describe('udadisi app', function() {

  it('should automatically redirect to /home when location hash/fragment is empty', function() {
    browser.get('app/index.html');
    expect(browser.getLocationAbsUrl()).toMatch("/home");
  });


  describe('home', function() {
    beforeEach(function() {
      browser.get('app/#/home');
    });

    it('should render home when user navigates to /home', function() {
      expect(element.all(by.css('[ng-view] h1')).first().getText()).
        toMatch(/EXPLORE THE TRENDS/);
    });
  });


  describe('trend explorer', function() {
    beforeEach(function() {
      browser.get('app/#/trend-explorer');
    });

    it('should render trend explorer when user navigates to /trend-explorer', function() {
      expect(element.all(by.css('[ng-view] h1')).first().getText()).
        toMatch(/TREND EXPLORER/);
    });
  });


  describe('location profile', function() {
    beforeEach(function() {
      browser.get('app/#/locations/global');
    });

    it('should render global location profile when user navigates to /locations/global', function() {
      expect(element.all(by.css('[ng-view] h1')).first().getText()).
        toMatch(/GLOBAL TRENDS/);
    });
  });


  describe('trend profile', function() {
    beforeEach(function() {
      browser.get('app/#/trends/solar');
    });

    it('should render trend profile for "solar" when user navigates to /trends/mobile', function() {
      expect(element.all(by.css('[ng-view] h1')).first().getText()).
        toMatch(/SOLAR/);
    });
  });

});
