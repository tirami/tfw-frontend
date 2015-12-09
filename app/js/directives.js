'use strict';

/* Directives */
var udadisiDirectives = angular.module('udadisiDirectives', []);

var mapDirective = function($templateRequest, $compile, $parse) {
  return {
    restrict: 'A', scope: { mapScale: '=' },
    link: function(scope, element, attrs){
      setTimeout(function(){ drawMap(scope,element,attrs); }, 10);
    }
  }
};

udadisiDirectives.directive('mapProjection', ['$templateRequest', '$parse', mapDirective]);

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

udadisiDirectives.directive('barGraph', 
  function($parse) {
    return { priority: 0, restrict: 'A', scope: { trends: '=' }, link: drawBars }
  }
);

udadisiDirectives.directive('timeSeries', 
  function($parse) {
    return { priority: 0, restrict: 'A', scope: { seriesData: '=' }, link: drawTimeSeries }
  }
);

udadisiDirectives.directive('nodeGraph', 
  function($parse) {
    return { priority: 0, restrict: 'A', scope: { trend: "=", relatedTrends: '=' }, link: drawNodes }
  }
);

//TODO: USE COLOURS VIZ OTHER THAN WORDCLOUD
//TODO: fix bouncy bar graphs

var colours = { "pa-pink": "#e2014d", 
    "pa-yellow": "#ffd600",
    "pa-turquoise": "#008e8f",
    "pa-brown": "#634400",
    "navy-blue": "#0c1444",
    "pa-red": "#fc1921",
    "pa-orange": "#faa433",
    "pa-royal-blue": "#232690",
    "pa-light-green": "#98cb99",
    "pa-light-blue": "#66afe9" }

var getColoursArray = function() {
  var c = []; 
  for(var key in colours) {
      var value = colours[key];
      c.push(value);
  }
  return c;
}

var getUdadisiColour = function(i){
  var arr = getColoursArray();
  if (i >= arr.length){
    Math.floor(Math.random() * (arr.length-1));
  }
  return arr[i];
};

var drawNodes = function(scope, element, attrs){
  var bbox = d3.select('#node-container').node().getBoundingClientRect();
  var margin = {top: 10, right: 10, bottom: 10, left: 10};
  var width = bbox.width - margin.left - margin.right;
  var height = bbox.height - margin.top - margin.bottom;
  
  var force = d3.layout.force().gravity(.01).distance(140).charge(-100)
    .size([width, height]).on("tick", tick);

  var svg = d3.select(element[0]).append("svg").attr("width", width).attr("height", height);

  var link = svg.selectAll(".link"), node = svg.selectAll(".node");

  var root = { "name": "trend", "children": [{"name": "analytics","children": [{ "name": "cluster", "children": [
      {"name": "AgglomerativeCluster", "size": 3938},
      {"name": "CommunityStructure", "size": 3812},
      {"name": "HierarchicalCluster", "size": 16714},
      {"name": "MergeEdge", "size": 743}
    ]
    }]}]};

  scope.$watchGroup(['trend', 'relatedTrends'], function(data, oldValues, scope) {
    if (!data) { return; }

    var trend = data[0];
    var relatedTrends = data[1];

    root = { "name": trend.name, "children":[] };

    relatedTrends.forEach(function(entry){ 
      if (entry.term != trend.name){
        root.children.push({ "name": entry.term, "size":entry.occurrences }); 
      }
    });
    
    update();
  });

  function update() {
    var nodes = flatten(root);
    var links = d3.layout.tree().links(nodes);

    console.log(nodes);
    
    // Restart the force layout.
    force.nodes(nodes).links(links).start();

    // Update the links…
    link = link.data(links, function(d) { return d.target.id; });

    // Exit any old links.
    link.exit().remove();

    // Enter any new links.
    link.enter().insert("line", ".node")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    // Update the nodes…
    node = node.data(nodes, function(d) { return d.id; }).style("fill", color);

    // Exit any old nodes.
    node.exit().remove();

    // Enter any new nodes.
    node.enter().append("g")
      .attr("class", "node")
      .on("click", click)
      .call(force.drag);

    node.append("circle")
      .attr("r", function(d) { return 10; }) //return Math.sqrt(d.size) / 10 || 14.5; })
      .style("fill", color);

    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });
  }

  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }

  // Color leaf nodes orange, and packages white or blue.
  function color(d) {
    return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
  }

  // Toggle children on click.
  function click(d) {
    if (!d3.event.defaultPrevented) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update();
    }
  }

  // Returns a list of all nodes under the root.
  function flatten(root) {
    var nodes = [], i = 0;
    function recurse(node) {
      if (node.children) node.children.forEach(recurse);
      if (!node.id) node.id = ++i;
      nodes.push(node);
    }
    recurse(root);
    return nodes;
  }

};

var drawTimeSeries = function(scope, element, attrs){
  //var trends = { term: "battery", timeseries: [100000:100, 100000:100] }
  var bbox = d3.select('#series-container').node().getBoundingClientRect();
  var margin = {top: 10, right: 10, bottom: 10, left: 40};

  var width = bbox.width - margin.left - margin.right;
  var height = bbox.height - margin.top - margin.bottom;

  // Set the ranges
  var x = d3.time.scale().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  // Define the axes
  var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);
  var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

  // Parse the date / time
  var parseDate = d3.time.format("%Y%m%d").parse;

  var svg = d3.select(element[0]).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  var group = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  scope.$watch('seriesData', function (data, oldData) { 
    group.selectAll('*').remove();
    if (!data) { return; }

    data.forEach(function(entry){
      entry.series.forEach(function(d){
        d.date = parseDate(d.date).getTime();
        d.close = +d.close;
      });
    });
    
    x.domain(d3.extent(data[0].series, function(d) { return d.date; }));
    y.domain([0, 100]);

    // Define the line
    var valueline = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); });

    // Add the valueline path.
    data.forEach(function(entry, i){
      
      group.append("path")
        .attr("data-legend",function(d) { return entry.term; })
        .attr("class", "line")
        .style("stroke", function() { return entry.color = getUdadisiColour(i); })
        .attr("d", valueline(entry.series));

        /*.append("text")
          .style("font-size", function(entry) { return "10px"; })
          .style("font-family", "Open Sans")
          .style("font-weight", "600")
          .attr("text-anchor", "middle")
          .text(function(d) { return entry.term; })*/
    });

    //svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
    group.append("g").attr("class", "y axis").call(yAxis);

    var legend = group.append("g")
      .attr("class","legend")
      .attr("transform","translate(50,30)")
      .style("font-size","12px")
      .call(d3.legend)

  });
};

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
    if (spotSize === undefined){ spotSize = 7 } else { spotSize = spotSize + 1; }
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
    scope.location = { name: this.getAttribute("target-location") };
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
      .font("Open Sans").fontWeight("600").fontSize(function(d) { return d.size; })
      .on("end", draw);
    
    layout.start();
    
    function draw(words) {
      wordGroup.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Open Sans")
        .style("font-weight","600")
        .style("fill", function(d, i) { return getUdadisiColour(i); })
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

var drawBars = function (scope, element, attrs) {
  
  var chart = d3.select(element[0]);  

  scope.$watch('trends', function (newVal, oldVal) { 
    chart.selectAll('*').remove();
    if (!newVal) { return; }

    var data = newVal;
    var extents = d3.extent(data, function(t) { return t.occurrences; });
  
    chart.append("div").attr("class", "chart")
      .selectAll('div')
      .data(data).enter().append("div")
      .transition().ease("elastic")
      .style("width", function(d) { return (d.occurrences/extents[1]*100) + "%"; })
      .style("height", "1.8em")
      .text(function(d) { return d.term; });
   });
};

var setTimespan = function(scope, element, attrs) {
  
  var container = d3.select(element[0]),
    margin = {top: 0, right: 10, bottom: 0, left: 40},
    height = 50;
  var width = (container.node().offsetWidth) - margin.left - margin.right;

  var svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  var context = svg.append('g').attr('class', 'context').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  //The x axis & labelling
  var timespan = [scope.start, scope.end];
  var timeExtent = d3.extent(timespan, function(d) { return new Date(d); });
  var x = d3.time.scale().range([0, width]).domain(timeExtent);
  var format = d3.time.format("%-d %b");
  var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10).tickFormat(format);
  context.append("g").attr("class", "x axis").attr("transform", "translate(0," + (height/2) + ")")
    .call(xAxis).selectAll("text").attr("y", 4).attr("x", 2).style("text-anchor", "start");

  var zoom = d3.behavior.zoom().x(x).scaleExtent([0, width]).on("zoom", zoomed);

  //The "brush" or selector itself
  var diamond = d3.svg.symbol().type('diamond').size(height*4);
  var brush = d3.svg.brush().x(x).on('brushend', brushend);
  var brushg = context.append('g').attr('class', 'x brush').call(brush); 

  brushg.selectAll(".resize").append("path").attr("transform", "translate(0," +  height / 2 + ")").attr("d", diamond).style("stroke", "#FFFFFF");
  brushg.selectAll('rect').attr('y', 0).attr('height', height/2);//.attr("transform", "translate(0," +  height / 2 + ")");

  // define our brush extent
  var selectEnd = new Date(scope.selectStart + (scope.interval*24*60*60*1000))
  brush.extent([new Date(scope.selectStart), selectEnd]);
  brush(d3.select(".brush"));

  function brushend(){
    if (brush.empty()) {
      console.log("brush empty, doing nowt");
    } else {  
      scope.selectStart = brush.extent()[0];
      scope.interval = Math.ceil((brush.extent()[1] - brush.extent()[0]) / (24*60*60*1000));
      scope.$apply();
      scope.updateFn(scope.location, scope.selectStart.yyyymmdd(), scope.interval);
    }
  }

  function zoomed(e) {
    svg.select(".x.axis").call(xAxis);
    /*svg.selectAll('rect.extent').attr("transform", function(d) { 
      return "translate(" + x(d.point.x) + ",0)"; }
    );
    svg.selectAll('g.resize.e').attr("transform", function(d) { 
      return "translate(" + x(d.point.x) + ",0)"; }
    );
    svg.selectAll('g.resize.w').attr("transform", function(d) { 
      return "translate(" + x(d.point.x) + ",0)"; }
    );*/
  }

  d3.select("button.zr").on("click", reset);

  function reset() {
    d3.transition().duration(750).tween("zoom", function() {
      var newDomain = [new Date(x.domain()[0]-(86400000*7)), x.domain()[1]]; //set a week hence
      var ix = d3.interpolate(x.domain(), newDomain);
      return function(t) {
        zoom.x(x.domain(ix(t)));
        zoomed();
      };
    });
  }

}


Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();
  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
};
