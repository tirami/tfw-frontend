'use strict';

var udadisiDirectives = angular.module('udadisiDirectives', []);

udadisiApp.factory('IntervalService', function(){
  var IntervalService = {};
  
  IntervalService.calculateInterval = function(selectStart, selectEnd){
    var hoursdiff = Math.round((selectEnd - selectStart) / (60*60*1000));
    var interval = 3;
    if (hoursdiff < 24){ return 2; } 
    else if (hoursdiff < (5*24)){ interval = Math.round(hoursdiff/12); }
    else if (hoursdiff <= (10*24)){ interval = Math.round(hoursdiff/24); }
    else if (hoursdiff <= (28*24)){ interval = Math.round(hoursdiff/48); }
    else if (hoursdiff >= (28*24)){ interval = Math.round((hoursdiff/24)/5); }
    else { interval = 3; }
    return interval;
  };

  return IntervalService;
});

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
    return { restrict: 'A', scope: { trends: '=', mapScale: '=', property: '=' }, link: drawWordcloud }
  }
);

udadisiDirectives.directive('scatterPlot', 
  function($parse) {
    return { restrict: 'A', scope: { trends: '=' }, link: drawScatterPlot }
  }
);

udadisiDirectives.directive('treemap', 
  function($parse) {
    return { restrict: 'A', scope: { trends: '=' }, link: drawTreemap }
  }
);

udadisiDirectives.directive('timespan', function($parse, IntervalService) {
    return { restrict: 'A', scope: { selectStart: '=', selectEnd: '=', location: '=', interval: '=', start: '=', end: '=', updateFn: '=' }, 
      link: function(scope, element, attrs){ setTimespan(scope, element, attrs, IntervalService); } }
  }
);

udadisiDirectives.directive('locationToggle', 
  function($parse) {
    return { restrict: 'C', scope: { selectStart: '=', location: '=', interval: '=', updateFn: '=', setLocation: '=' }, link: toggleLocation }
  }
);

udadisiDirectives.directive('barGraph', 
  function($parse) {
    return { priority: 0, restrict: 'A', scope: { collection: '=', property: '=' }, link: drawBars }
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
};

var getUdadisiColour = function(i){
  var arr = getColoursArray();
  if (i >= arr.length){
    Math.floor(Math.random() * (arr.length-1));
  }
  return arr[i];
};

function make_x_axis(x, ticks) {
  if (ticks === undefined) { ticks = 5; }
  return d3.svg.axis().scale(x).orient("bottom").ticks(ticks);
};

function make_y_axis(y, ticks) {
  if (ticks === undefined) { ticks = 5; }
  return d3.svg.axis().scale(y).orient("left").ticks(ticks);
}

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
    if ((!data) || (!data[1])) { return; }

    var trend = data[0];
    var relatedTrends = data[1];

    root = { "name": trend, "children":[] };

    var i = 0;
    relatedTrends.forEach(function(entry){ 
      if ((entry != trend) && (i <11)){
        root.children.push({ "name": entry, "size":1 });
        i++;
      }
    });
    
    update();
  });

  function update() {
    var nodes = flatten(root);
    var links = d3.layout.tree().links(nodes);
    
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
  var bbox = d3.select('.series-container').node().getBoundingClientRect();
  var margin = {top: 10, right: 10, bottom: 10, left: 50};

  var width = bbox.width - margin.left - margin.right;
  var height = bbox.height - margin.top - margin.bottom;

  // Set the ranges
  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  // Define the axes
  var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);
  var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);


  var svg = d3.select(element[0]).append("svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .attr('viewBox','0 0 '+(width + margin.left + margin.right)+' '+(height + margin.top + margin.bottom))
    .attr('preserveAspectRatio','xMinYMin');

  var group = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  scope.$watch('seriesData', function (data, oldData) { 
    group.selectAll('*').remove();
    if ((!data || data.length===0)) { return; }

    x.domain([0,(data[0].series.length-1)]);
    var allSeries = [];
    data.forEach(function(e){ allSeries = allSeries.concat(e.series); });
    var yExtent = d3.extent(allSeries);
    y.domain(yExtent);

    //Draw grid
    var xGrid = group.append("g").attr("class", "grid").attr("transform", "translate(0," + height + ")")
      .call(make_x_axis(x, (data[0].series.length-1)).tickSize(-height, 0, 0).tickFormat(""));
    var yGrid = group.append("g").attr("class", "grid")
      .call(make_y_axis(y, yExtent[1]*2).tickSize(-width, 0, 0).tickFormat(""))
    
    //Y label
    group.append('g')
      .attr("class", "label")
      .attr('transform', 'translate(' + (-margin.left/2 - 5) + ', ' + height/2 + ')')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .text('Mentions');

    //Add Y scale
    group.append("g").attr("class", "y axis").call(yAxis);

    // Add the valueline path.
    data.forEach(function(entry, i){
      var tmp = 0;
      var valueline = d3.svg.line().x(function(d){ return x(tmp++); }).y(function(d){ return y(d); });

      group.append("path")
        .attr("data-legend",function(d) { return entry.term; })
        .attr("class", "line")
        .style("stroke", function() { return entry.color = getUdadisiColour(i); })
        .attr("d", valueline(entry.series));
    });

    var legend = group.append("g")
      .attr("class","legend")
      .attr("transform","translate(50,30)")
      .style("font-size","12px")
      .call(d3.legend);

  });
};

var drawScatterPlot = function(scope, element, attrs){

  var bbox = d3.select('#graph-container').node().getBoundingClientRect();
  var margin = {top: 20, right: 20, bottom: 100, left: 60};
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
      return { x: trend.velocity, y: trend.occurrences, elementId: ("#trend-panel-"+idx) };
    });

    // Compute the scales’ domains.
    var xext = d3.extent(trends, function(d) { return d.x });
    var yext = d3.extent(trends, function(d) { return d.y });

    //Add small buffer to extents
    xext[0] = xext[0];
    xext[1] = xext[1]+(1);
    yext[0] = yext[0]-(1);
    yext[1] = yext[1]+(1);

    x.domain(xext);
    y.domain(yext);

    // Add the x-axis.
    var xAxis = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.svg.axis().scale(x).orient("bottom"));

    xAxis.append('g')
      .attr('transform', 'translate(' + width/2 + ', ' + (margin.bottom/2.4) + ')')
      .append('text')
      .attr('text-anchor', 'middle')
      .text('Velocity (low to high)');

    // Add the y-axis.
    var yAxis = svg.append("g")
      .attr("class", "y axis")
      .call(d3.svg.axis().scale(y).orient("left"));

    yAxis.append('g')
      .attr('transform', 'translate(' + (margin.left/2)*-1 + ', ' + height/2 + ')')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .text('Mentions');

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

var toggleLocation = function(scope, element, attrs) {
  element.on('click', function(event) {
    event.stopImmediatePropagation();
    event.preventDefault();

    scope.setLocation(element[0].getAttribute("target-location"));

    $('.locationToggle').removeClass('selected');
    $(element[0]).toggleClass('selected');
    var date = scope.selectStart;
    if (!(date instanceof Date)) { date = new Date(date); }
    scope.updateFn(scope.location, date.toTimeString(), scope.interval);
    
  });
};

var drawWordcloud = function(scope, element, attrs) {
  var vis = d3.select(element[0]);
  var bbox = d3.select('#graph-container').node().getBoundingClientRect();
  
  var cloudSize = [jQuery('#graph-container').width(), jQuery('#graph-container').height()];    
  console.log(cloudSize);
  var cloudSize = [bbox.width, bbox.height];
  console.log(cloudSize);
  //var svg = vis.append("svg").attr("width", cloudSize[0]).attr("height", cloudSize[1]);
  
  var svg = vis.append("svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .attr('viewBox','0 0 '+(cloudSize[0])+' '+(cloudSize[1]))
    .attr('preserveAspectRatio','xMinYMin');

  //Add map
  var widthScaleFactor = 0.15625;
  var scale = cloudSize[0]*(widthScaleFactor*scope.mapScale);
  var mapGroup = svg.append("g");
  drawWorld(mapGroup, cloudSize, scale, []);

  var wordGroup = svg.append("g").attr("class", "wordgroup");

  scope.$watch('trends', function (newVal, oldVal) { 
    wordGroup.selectAll('*').remove();
    if (!newVal) { return; }

    //Set word size factor
    var averageLength = 0;
    newVal.map(function(t) { averageLength += t.term.length; });
    averageLength = averageLength / newVal.length;
    var maxSize = (cloudSize[0]/averageLength)/(newVal.length/2);
    var extents = d3.extent(newVal, function(t) { return t[scope.property]; });
    var sizeFactor = (maxSize / extents[1]) * 2.5;
    
    //Setup words
    var trendWords = newVal.map(function(trend, idx) {
      var fontSize = (trend[scope.property] * sizeFactor);
      if (fontSize < 14) { fontSize = 12; }
      return {text: trend.term, size: fontSize, elementId: ("#trend-panel-"+idx) }; 
    });

    var layout = d3.layout.cloud().size(cloudSize).words(trendWords)
      .padding(5).rotate(function() { return 0; }) //return ~~(Math.random() * 2) * 90;
      .font("Open Sans").fontWeight("600").fontSize(function(d) { return d.size; })
      .on("end", draw);
    
    layout.start();

    var wrdSize = wordGroup.node().getBoundingClientRect();
    //console.log(wrdSize);
    //wordGroup.attr("transform", "translate(" + (cloudSize[0] - wrdSize.width)/2 + "," + (cloudSize[1] - wrdSize.height)/2 + ")");
    wordGroup.attr("transform", "translate(" + cloudSize[0] / 2 + "," + cloudSize[1] / 1.9 + ")");
  });

  function draw(words) {
    wordGroup.selectAll("text")
      .data(words)
      .enter().append("text")
      .style("font-size", function(d) { return d.size + "px"; })
      .style("font-family", "Open Sans")
      .style("font-weight","600")
      .style("fill", function(d, i) { return getUdadisiColour(i); })
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ") rotate(" + d.rotate + ")"; })
      .text(function(d) { return d.text; })
      .on('click', function(obj){
        $('.trendPanel').removeClass('active'); 
        $(obj.elementId).addClass('active');
        $('#overlay').addClass('active');
      });
  };

};

var drawBars = function (scope, element, attrs) {
  
  var chart = d3.select(element[0]);  

  scope.$watch('collection', function (data, oldVal) {
    chart.selectAll('*').remove();
    if (!data) { return; }

    var extents = d3.extent(data, function(t) {  return t[scope.property]; });
    data.sort(function(a,b){return b[scope.property] - a[scope.property]});

    var cleaned = [];
    data.forEach(function(e){
      if(e[scope.property] > 0){ cleaned.push(e); }
    });

    chart.append("div").attr("class", "chart")
      .selectAll('div')
      .data(cleaned).enter().append("div")
      .style("width", function(d) { return (d[scope.property]/extents[1]*100) + "%"; })
      .style("height", "1.8em")
      .text(function(d) { return d.term; });
   });
};

var setTimespan = function(scope, element, attrs, IntervalService) {
  var container = d3.select(element[0]),
    margin = {top: 0, right: 20, bottom: 0, left: 40},
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
  var brush = d3.svg.brush().x(x).on('brushend', brushend);
  var brushg = context.append('g').attr('class', 'x brush').call(brush); 

  brushg.selectAll(".resize").append("rect").attr("width", 16).attr("rx", 2).attr("ry", 2).attr("height", 21).attr("transform", "translate(-8,2)");
  brushg.selectAll('rect').attr('y', 0).attr('height', height/2);//.attr("transform", "translate(0," +  height / 2 + ")");

  // define our brush extent
  brush.extent([new Date(scope.selectStart), new Date(scope.selectEnd)]);
  brush(d3.select(".brush"));

  function brushend(){
    if (brush.empty()) {
      console.log("brush empty, doing nowt");
    } else {
      scope.selectStart = brush.extent()[0];
      scope.selectEnd = brush.extent()[1];
      scope.interval = IntervalService.calculateInterval(scope.selectStart, scope.selectEnd);     
      scope.updateFn(scope.location, scope.selectStart.toTimeString(), scope.selectEnd.toTimeString(), scope.interval);
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

var drawTreemap = function(scope, element, attrs){

  function position() {
    this.style("left", function(d) { return d.x + "px"; })
    .style("top", function(d) { return d.y + "px"; })
    .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
    .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
  }
  
  var bbox = d3.select('#graph-container').node().getBoundingClientRect();
  var margin = {top: 0, right: 0, bottom: 50, left: 0};
  var width = bbox.width - margin.left - margin.right;
  var height = bbox.height - margin.bottom - margin.top;
  var color = d3.scale.category20c();
  
  scope.$watch('trends', function (data, oldData){
    if (!data)  { return; }

    $(element[0].children).remove();

    var treemap = d3.layout.treemap()
      .size([width, height])
      .sticky(true)
      .value(function(d) { return d.size; });

    var div = d3.select(element[0]).append("div")
      .style("position", "relative")
      .style("width", (width) + "px")
      .style("height", (height) + "px");

    data.forEach(function(entry){
      entry.size = entry.velocity;
    });

    var data = { "term": "cluster", "children": data };

    var node = div.datum(data).selectAll(".node")
      .data(treemap.nodes)
      .enter().append("div")
      .attr("class", "node")
      .call(position)
      .style("background", function(d) { return d.children ? color(d.term) : null; })
      .text(function(d) { return d.children ? null : d.term; });

    /*
    d3.selectAll("input").on("change", function change() {
      var value = this.value === "count" ? function() { return 1; } : function(d) { return d.size; };
      node.data(treemap.value(value).nodes).transition().duration(1500).call(position);
    });*/

  });

};

Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();
  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
};

Date.prototype.toTimeString = function() {
  var yyyy = this.getFullYear().toString();
  var month = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var day = this.getDate().toString();
  var hh = this.getHours().toString();
  var mm = this.getMinutes().toString();
  return yyyy + (month[1]?month:"0"+month[0]) + (day[1]?day:"0"+day[0]) + (hh[1]?hh:"0"+hh[0]) + (mm[1]?mm:"0"+mm[0]); //zero padding
};