'use strict';

/* Directives */
var udadisiDirectives = angular.module('udadisiDirectives', []);

udadisiDirectives.directive('wordcloud', 
  function($parse) {
    return { restrict: 'E', scope: { trends: '=' }, link: drawWordcloud }
  }
);

udadisiDirectives.directive('timespan', 
  function($parse) {
    return { restrict: 'E', scope: { selectstart: '=', selectend: '=', start: '=', end: '='}, link: setTimespan }
  }
);

var drawWordcloud = function(scope, element, attrs) {
  var vis = d3.select(element[0]); //TODO: getting: "mutating the [[Prototype]] of an object..." (may be browser vers)
  
  scope.$watch('trends', function (newVal, oldVal) { 
    vis.selectAll('*').remove();
    if (!newVal) { return; }

    var fill = d3.scale.category20();
    var cloudSize = [500, 500];
    //TODO: make sure word size doesn't go out of bounds
    var trendWords = scope.trends.map(function(trend) { return {text: trend.term, size: trend.occurrences/10.0, test: "haha"}; });
    var layout = d3.layout.cloud().size(cloudSize).words(trendWords)
        .padding(5).rotate(function() { return ~~(Math.random() * 2) * 90; })
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
  brush.extent([new Date(scope.selectstart), new Date(scope.selectend)]);
  // now draw the brush to match our extent
  brush(d3.select(".brush"));

  function brushend() {
    // If the user has selected no brush area, share everything.
    if (brush.empty()) {
        console.log("brush empty");
    } else {
    // Otherwise, restrict features to only things in the brush extent.
      console.log(brush.extent()[0]);
      console.log(brush.extent()[1]);
    }
  }
}