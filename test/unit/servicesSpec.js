'use strict';

describe("trends service", function () {

  var LocationTrends;
  beforeEach(module("udadisiServices"));
  beforeEach(inject(function (_LocationTrends_) {  LocationTrends = _LocationTrends_; }));

  it('LocationTrends service should be defined', function () { expect(LocationTrends).toBeDefined(); });  

  describe("Mocked API Responses", function () {

    var $httpBackend;
    beforeEach(inject(function ($injector) { 
      $httpBackend = $injector.get('$httpBackend'); 
      $httpBackend.when("GET", "http://localhost:8080/v1/locations/all/trends?from=20150826&interval=3&limit=10").respond(
        [{"term":"solar","occurrences":28},{"term":"battery","occurrences":25},
        {"term":"openmaps","occurrences":25},{"term":"gravitylight","occurrences":20},{"term":"banana","occurrences":16},{"term":"water","occurrences":15},
        {"term":"tech-funds","occurrences":14},{"term":"crowdsourcing","occurrences":12},{"term":"crowdfunding","occurrences":10},{"term":"biotech","occurrences":9}]);    
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });
    
    it('should have sent a GET request to the trends API', function() {
      var result = LocationTrends.query({ location: "all", limit: 10, from: "20150826", interval: 3 });
      $httpBackend.expectGET('http://localhost:8080/v1/locations/all/trends?from=20150826&interval=3&limit=10');
      $httpBackend.flush();
    });

    it("should do something", function () {
      var opts = { location: "all", limit: 10, from: "20150826", interval: 3 };
      spyOn(LocationTrends,"query").and.callThrough();
      LocationTrends.query(opts);
      expect(LocationTrends.query).toHaveBeenCalledWith(opts);
      //expect(terms).toEqual(["solar", "biotech"]);  });
      $httpBackend.flush();
    });

  });
});