'use strict';

/* Directives */
var udadisiDirectives = angular.module('udadisiDirectives', []);

udadisiDirectives.directive('wordcloud', 
  function($parse) {
    return { restrict: 'A', scope: { trends: '=', mapScale: '=' }, link: drawWordcloud }
  }
);

udadisiDirectives.directive('scatterPlot', 
  function($parse) {
    return { restrict: 'A', scope: { trends: '=' }, link: drawScatterPlot }
  }
);

udadisiDirectives.directive('timespan', 
  function($parse) {
    return { restrict: 'A', scope: { selectStart: '=', location: '=', interval: '=', start: '=', end: '=', updateFn: '=' }, link: setTimespan }
  }
);

udadisiDirectives.directive('locationToggle', 
  function($parse) {
    return { restrict: 'C', scope: { selectStart: '=', location: '=', interval: '=', updateFn: '=' }, link: setLocation }
  }
);

udadisiDirectives.directive('mapProjection', 
  function($parse) {
    return { restrict: 'A', scope: { mapScale: '=' }, link: drawMap }
  }
);

var drawScatterPlot = function(scope, element, attrs){

  var bbox = d3.select('#graph-container').node().getBoundingClientRect();
  var margin = {top: 20, right: 20, bottom: 100, left: 40};
  var width = bbox.width - margin.left - margin.right;
  var height = bbox.height - margin.top - margin.bottom;
    
  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);
  var z = d3.scale.category10();
  var vis = d3.select(element[0]);
  
  scope.$watch('trends', function (newVal, oldVal) { 
    vis.selectAll('*').remove();
    if (!newVal) { return; }

    var svg = vis.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var trends = newVal.map(function(trend, idx) {
      return { x: trend.occurrences, y: trend.term.length, elementId: ("#trend-panel-"+idx) };
    });

    // Compute the scales’ domains.
    var xext = d3.extent(trends, function(d) { return d.x });
    var yext = d3.extent(trends, function(d) { return d.y });

    //Add small buffer to extents
    xext[0] = xext[0]-(1);
    xext[1] = xext[1]+(1);
    yext[0] = yext[0]-(1);
    yext[1] = yext[1]+(1);

    x.domain(xext);
    y.domain(yext);

    // Add the x-axis.
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.svg.axis().scale(x).orient("bottom"));

    // Add the y-axis.
    svg.append("g")
      .attr("class", "y axis")
      .call(d3.svg.axis().scale(y).orient("left"));

    var xPosition = 10; 
    var yPosition = 10;

    svg.selectAll(".series")
      .data(trends)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 10)
      .attr("cx", function(d) { return x(d.x); })
      .attr("cy", function(d) { return y(d.y); }).on("mouseover", function(trend,e){
        $('.trendPanel').removeClass("active");
        var element = $(trend.elementId);
        element.toggleClass("active");
        if (d3.event.layerX > width/2){ xPosition = (element.width()*-1)-10; } else { xPosition = 10; }
        if (d3.event.layerY > height/2){ yPosition = (element.height()*-1)-10; } else { yPosition = 10; }
        element.css("top", (d3.event.layerY + yPosition) + "px").css("left", (d3.event.layerX + xPosition) + "px");
      });
  });
};

var drawWorld = function(group, size, mapScale, places){
  var projection = d3.geo.equirectangular().scale(mapScale).translate([size[0] / 2, size[1] / 2]).precision(.1);
  var path = d3.geo.path().projection(projection);

  d3.json("/app/world.json", function(error, world) {
    if (error) throw error;
    //Land
    group.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);

    //Location pins
    group.selectAll(".pin")
      .data(places)
      .enter().append("circle", ".pin")
      .attr("r", function(d) { return d.spotSize })
      .attr("transform", function(d) {
        return "translate(" + projection([
          d.location.longitude,
          d.location.latitude
        ]) + ")";
      }).on("mouseover", function(place,e){
        for (var i = 0; i < places.length; i++) { places[i].element.removeClass("active"); }
        place.element.toggleClass("active");
        place.element.css("top", (d3.event.pageY + 10) + "px").css("left", (d3.event.pageX + 10) + "px");
      });

    //Borders
    /*svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);*/
  });
};

var drawMap = function(scope,element,attrs){
  var bbox = d3.select(element[0]).node().getBoundingClientRect();
  var width = bbox.width-13;
  var height = width*(0.5*scope.mapScale);
  var widthScaleFactor = 0.15625;
  var scale = width*(widthScaleFactor*scope.mapScale);

  //Collect places
  var places = [];
  for (var i = 0; i < element[0].children.length; i++) {
    var c = angular.element(element[0].children[i]);
    var spotSize = c.attr('data-spot-size');
    if (spotSize === undefined){ spotSize = 7 } 
    places.push({ element: c, spotSize: spotSize, location: { latitude: c.attr('data-latitude'), longitude: c.attr('data-longitude') } });
  }

  //Append svg
  var svg = d3.select(element[0]).append("svg").attr("width", width).attr("height", height);
  drawWorld(svg, [width,height], scale, places);

  //Grid
  //var graticule = d3.geo.graticule();
  //svg.append("path").datum(graticule).attr("class", "graticule").attr("d", path); 
};

var setLocation = function(scope, element, attrs) {
  element.on('click', function(event) {
    scope.location = this.getAttribute("target-location");
    scope.$apply();
    $('.locationToggle').removeClass('active');
    $(this).toggleClass('active');
    var date = scope.selectStart;
    if (!(date instanceof Date)) { date = new Date(date); }
    scope.updateFn(scope.location, date.yyyymmdd(), scope.interval);
  });
};

var drawWordcloud = function(scope, element, attrs) {
  var vis = d3.select(element[0]); //TODO: getting: "mutating the [[Prototype]] of an object..." (may be browser vers)
  var bbox = d3.select('#graph-container').node().getBoundingClientRect();
  var cloudSize = [bbox.width, bbox.height-60];
  var svg = vis.append("svg").attr("width", cloudSize[0]).attr("height", cloudSize[1]);

  //Add map
  var widthScaleFactor = 0.15625;
  var scale = cloudSize[0]*(widthScaleFactor*scope.mapScale);
  var mapGroup = svg.append("g");
  drawWorld(mapGroup, cloudSize, scale, []);

  var wordGroup = svg.append("g").attr("transform", "translate(" + cloudSize[0] / 2 + "," + cloudSize[1] / 2 + ")");
  
  scope.$watch('trends', function (newVal, oldVal) { 
    wordGroup.selectAll('*').remove();
    if (!newVal) { return; }

    //Setup backg
    var fill = d3.scale.category20();

    //Set word size factor
    var totalLength = 0;
    var average = 0;
    scope.trends.map(function(t) { totalLength += t.term.length; average += t.occurrences; });
    average = average / scope.trends.length;
    var maxSize = Math.sqrt((cloudSize[0]*0.74)*(cloudSize[1]*0.74) / totalLength);
    var extents = d3.extent(scope.trends, function(t) { return t.occurrences; });
    var sizeFactor = (maxSize / extents[1]) * (extents[1] / average);

    //Setup words
    var trendWords = scope.trends.map(function(trend, idx) { return {text: trend.term, size: (trend.occurrences * sizeFactor), elementId: ("#trend-panel-"+idx) }; });
    var layout = d3.layout.cloud().size(cloudSize).words(trendWords)
      .padding(5).rotate(function() { return 0; }) //return ~~(Math.random() * 2) * 90;
      .font("Impact").fontSize(function(d) { return d.size; })
      .on("end", draw);
    
    layout.start();
    
    function draw(words) {
      wordGroup.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return fill(i); })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
        .text(function(d) { return d.text; })
        .on('click', function(obj){ 
          $('.trendPanel').removeClass('active'); 
          $(obj.elementId).addClass('active');
          $('#overlay').addClass('active');
        });
    };

    //function resize(){}
    //d3.select(window).on('resize', resize); 

  });
};

var barChart = function (scope, element, attrs) {
  var data = attrs.chartData.split(','); //e.g.  <chart chart-data="40,100,80,15,25,60,10"></chart>
  //in D3, any selection[0] contains the group
  //selection[0][0] is the DOM node
  //but we won't need that this time
  var chart = d3.select(element[0]);
  //to our original directive markup bars-chart
  //we add a div with out chart stling and bind each
  //data entry to the chart
  chart.append("div").attr("class", "chart")
   .selectAll('div')
   .data(data).enter().append("div")
   .transition().ease("elastic")
   .style("width", function(d) { return d + "%"; })
   .text(function(d) { return d + "%"; });
  //a little of magic: setting it's width based
  //on the data value (d) 
  //and text all with a smooth transition
};

var setTimespan = function(scope, element, attrs) {
  var timespan = [scope.start, scope.end];

  var container = d3.select(element[0]),
      width = (container.node().offsetWidth),
      margin = {top: 0, right: 0, bottom: 0, left: 0},
      height = 50;

  var timeExtent = d3.extent(timespan, function(d) { return new Date(d); });

  var svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

  var context = svg.append('g').attr('class', 'context').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var x = d3.time.scale().range([0, width]).domain(timeExtent);

  //The x axis & labelling
  var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);
  svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + (height-20) + ")")
    .call(xAxis).selectAll("text").attr("y", 4).attr("x", 2).style("text-anchor", "start");

  //The "brush" or selector itself
  var brush = d3.svg.brush().x(x).on('brushend', brushend);
  context.append('g').attr('class', 'x brush').call(brush).selectAll('rect').attr('y', 0).attr('height', height);

  // define our brush extent
  var selectEnd = new Date(scope.selectStart + (scope.interval*24*60*60*1000))
  brush.extent([new Date(scope.selectStart), selectEnd]);
  // now draw the brush to match our extent
  brush(d3.select(".brush"));

  function brushend() {
    if (brush.empty()) {
      console.log("brush empty, doing nowt");
    } else {  
      scope.selectStart = brush.extent()[0];
      scope.interval = Math.ceil((brush.extent()[1] - brush.extent()[0]) / (24*60*60*1000));
      scope.$apply();
      scope.updateFn(scope.location, scope.selectStart.yyyymmdd(), scope.interval);
    }
  }
}


Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();
  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
};
