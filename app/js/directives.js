'use strict';

/* Directives */
var udadisiDirectives = angular.module('udadisiDirectives', []);

udadisiDirectives.directive('wordcloud', 
  function($parse) {
    return { restrict: 'E', scope: { trends: '=' }, link: drawWordcloud }
  }
);

var drawWordcloud = function(scope, element, attrs) {
  var vis = d3.select(element[0]); //TODO: getting: "mutating the [[Prototype]] of an object..." (may be browser vers)
  
  scope.$watch('trends', function (newVal, oldVal) { 
    vis.selectAll('*').remove();
    if (!newVal) { return; }

    var fill = d3.scale.category20();
    var trendWords = scope.trends.map(function(trend) { return {text: trend.term, size: trend.occurrences/10.0, test: "haha"}; });
    var layout = d3.layout.cloud().size([500, 500]).words(trendWords)
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
      .attr("transform", function(d) {
      return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
      }).text(function(d) { return d.text; });
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
