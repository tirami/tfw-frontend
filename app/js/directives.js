'use strict';

/* Directives */
var udadisiDirectives = angular.module('udadisiDirectives', []);

udadisiDirectives.directive('wordcloud', 
  function($parse) {
    return { restrict: 'A', scope: { trends: '=' }, link: drawWordcloud }
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
    return { restrict: 'A', scope: { }, link: drawMap }
  }
);

var drawMap = function(scope,element,attrs){
  //var width = 960, height = 480;
  var bbox = d3.select(element[0]).node().getBoundingClientRect();
  var width = bbox.width-30;
  var height = width/2;
  var scale = width*0.15625;
  var projection = d3.geo.equirectangular().scale(scale).translate([width / 2, height / 2]).precision(.1);
  var path = d3.geo.path().projection(projection);
  var svg = d3.select(element[0]).append("svg").attr("width", width).attr("height", height);

  //Grid
  var graticule = d3.geo.graticule();
  svg.append("path").datum(graticule).attr("class", "graticule").attr("d", path); 

  d3.json("/app/world.json", function(error, world) {
    if (error) throw error;

    /*var hscale  = scale*width  / (bounds[1][0] - bounds[0][0]);
    var vscale  = scale*height / (bounds[1][1] - bounds[0][1]);
    var scale   = (hscale < vscale) ? hscale : vscale;
    var offset  = [width - (bounds[0][0] + bounds[1][0])/2, height - (bounds[0][1] + bounds[1][1])/2];

    projection = d3.geo.mercator().center(center).scale(scale).translate(offset);
    path = path.projection(projection);*/

    //Land
    var r = svg.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);

    //Borders
    svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);
  });
  //d3.select(self.frameElement).style("height", height + "px");
};

var setLocation = function(scope, element, attrs) {
  element.on('click', function(event) {
    scope.location = this.getAttribute("target-location");
    scope.$apply();
    scope.updateFn(scope.location, scope.selectStart.yyyymmdd(), scope.interval);
  });
};

var drawWordcloud = function(scope, element, attrs) {
  var vis = d3.select(element[0]); //TODO: getting: "mutating the [[Prototype]] of an object..." (may be browser vers)
  
  scope.$watch('trends', function (newVal, oldVal) { 
    vis.selectAll('*').remove();
    if (!newVal) { return; }

    //Setup backg
    var fill = d3.scale.category20();
    //var margin = {top: 30, right: 10, bottom: 30, left: 10}; 
    //var width = parseInt(d3.select('#wordcloud').style('width'), 10); 

    var bbox = d3.select('#graph-container').node().getBoundingClientRect();
    var cloudSize = [bbox.width, bbox.width/2];

    //Set word size factor
    var totalLength = 0;
    var average = 0;
    scope.trends.map(function(t) { totalLength += t.term.length; average += t.occurrences; });
    average = average / scope.trends.length;
    var maxSize = Math.sqrt((cloudSize[0]*0.74)*(cloudSize[1]*0.74) / totalLength);
    var extents = d3.extent(scope.trends, function(t) { return t.occurrences; });
    var sizeFactor = (maxSize / extents[1]) * (extents[1] / average);

    //Setup words
    var trendWords = scope.trends.map(function(trend) { return {text: trend.term, size: trend.occurrences * sizeFactor }; });
    var layout = d3.layout.cloud().size(cloudSize).words(trendWords)
      .padding(5).rotate(function() { return 0; }) //return ~~(Math.random() * 2) * 90;
      .font("Impact").fontSize(function(d) { return d.size; })
      .on("end", draw);
    
    layout.start();

    function draw(words) {
      vis.append("svg")
      .attr("width", layout.size()[0])
      .attr("height", layout.size()[1])
      .append("g")
      .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
      .selectAll("text")
      .data(words)
      .enter().append("text")
      .style("font-size", function(d) { return d.size + "px"; })
      .style("font-family", "Impact")
      .style("fill", function(d, i) { return fill(i); })
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
      .text(function(d) { return d.text; });
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
      height = 100;

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
