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
    else if (hoursdiff <= (63*24)){ interval = Math.round((hoursdiff/24)/7); }
    else if (hoursdiff <= (126*24)){ interval = Math.round((hoursdiff/24)/14); }
    else if (hoursdiff > (126*24)){ interval = Math.round((hoursdiff/24)/31); }
    else { interval = 3; }
    return interval;
  };

  return IntervalService;
});

var mapDirective = function($templateRequest, $compile, $parse) {
  return {
    restrict: 'A', scope: { mapScale: '=', latlng: '=', locations: '=' },
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
    return { restrict: 'A', scope: { selectStart: '=', selectEnd: '=', location: '=', source: '=', interval: '=', start: '=', end: '=', updateFn: '=' }, 
      link: function(scope, element, attrs){ setTimespan(scope, element, attrs, IntervalService); } }
  }
);

udadisiDirectives.directive('zoomControl', function($parse, IntervalService) {
    return { restrict: 'C', scope: { selectStart: '=', selectEnd: '=', start: '=', end: '=', updateFn: '=' },
      link: function(scope, element, attrs){ timespanZoom(scope, element, attrs); } }
  }
);

udadisiDirectives.directive('locationToggle', 
  function($parse) {
    return { restrict: 'C', scope: { selectStart: '=', selectEnd: '=', location: '=', source: '=', interval: '=', updateFn: '=', setLocation: '=' }, link: toggleLocation }
  }
);

udadisiDirectives.directive('sourceSelect', 
  function($parse) {
    return { restrict: 'C', scope: { selectStart: '=', selectEnd: '=', location: '=', source: '=', interval: '=', updateFn: '=', setSource: '=' }, link: selectSource }
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

  var div = d3.select("div#graph-tooltip");

  scope.$watch('seriesData', function (data, oldData) {
    group.selectAll('*').remove();
    if ((!data || data.length===0)) { return; }

    var allSeries = [];
    var allLengths = [];

    data.forEach(function(e){ 
      allSeries = allSeries.concat(e.series);  
      allLengths = allLengths.concat(e.series.length);
    });

    var xExtent = d3.extent(allLengths);
    x.domain([0,(xExtent[1]-1)]);
    
    var yExtent = d3.extent(allSeries);
    y.domain(yExtent);

    //Draw grid
    var xGrid = group.append("g").attr("class", "xgrid grid").attr("transform", "translate(0," + height + ")")
      .call(make_x_axis(x, 25).tickSize(-height, 0, 0).tickFormat(""));
    var yGrid = group.append("g").attr("class", "ygrid grid")
      .call(make_y_axis(y, 15).tickSize(-width, 0, 0).tickFormat(""));
    
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

    var linesGroup = group.append("g").attr("class", "linesGroup");

    // Add the valueline path.
    data.forEach(function(entry, i){
      var tmp = 0;

      var valueline = d3.svg.line().x(function(d){ return x(tmp++); }).y(function(d){ return y(d); });
      linesGroup.append("path")
        .attr("data-legend",function(d) { return entry.term; })
        .attr("class", "line")
        .style("stroke", function() { return entry.color = getUdadisiColour(i); })
        .attr("d", valueline(entry.series));

      var tmp2 = 0;
      linesGroup.selectAll("dot")
        .data(entry.series)
        .enter().append("circle").style("fill", getUdadisiColour(i))
        .attr("r", 5)
        .attr("data-interval", function(d,i){ return i; })
        .attr("cx", function(d) { return x(tmp2++); })
        .attr("cy", function(d) { return y(d); })
        .on("mouseover", function(d) {
          var circle = $(d3.event.target);
          circle.attr("r", 10);
          div.transition().duration(200).style("opacity", 1);
          div.style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px");
          div.attr("class", "tooltip timespan-" + circle.attr("data-interval"));
          div.html(d+" mentions.");
        })
        .on("mouseout", function(d) { 
          $(d3.event.target).attr("r", 5);
          div.transition().duration(200).style("opacity", 0);
        });
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

var addPins = function(projection, group, places){
  group.selectAll(".pin")
    .data(places)
    .enter().append("circle")
    .attr("class", "pin")
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
    }).on("mouseout", function(place,e){
      place.element.removeClass("active");
    });
};

var drawWorld = function(group, size, mapScale, places, latlng){
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
    addPins(projection, group, places);

    var coordinates = projection([latlng[1],latlng[0]]);
    group.attr("transform", "translate(" + (-coordinates[0]+(size[0]/2)) + "," + (-coordinates[1]+(size[1]/2)) + ")");

    //Borders
    /*svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);*/
  });
  return projection;
};

var drawMap = function(scope,element,attrs){
  var bbox = d3.select(element[0]).node().getBoundingClientRect();

  var width = bbox.width;
  var height = bbox.height;
  var widthScaleFactor = 0.15625;
  var scale = width*(widthScaleFactor*scope.mapScale);

  //Collect places
  var places = [];
  for (var i = 0; i < element[0].children.length; i++) {
    var c = angular.element(element[0].children[i]);
    var spotSize = parseFloat(c.attr('data-spot-size'));
    if ((spotSize == undefined) || (isNaN(spotSize))){ spotSize = 7; }
    places.push({ element: c, spotSize: spotSize, location: { latitude: c.attr('data-latitude'), longitude: c.attr('data-longitude') } });
  }

  //Append svg
  var svg = d3.select(element[0]).append("svg").attr("width", width).attr("height", height);

  if (scope.latlng === undefined){ scope.latlng = [0.0,0.0]; scope.mapScale = 0.9; }

  scope.$watch('latlng', function (newVal, oldVal) {
    var projection = drawWorld(svg, [width,height], scale, places, newVal);
    /*console.log("Bark");
    console.log(newVal);
    svg.selectAll(".pin").remove();
    places = [];
    jQuery.each(newVal, function(k,l){
      if (l.name != "all"){
        console.log(l);
        console.log("p");
        console.log(l.prevalence);
        var e = angular.element("#loc-"+l.name);
        if ((spotSize == undefined) || (isNaN(spotSize))){ spotSize = 7; }
        places.push({ element: e, spotSize: (l.prevalence*20), location: { latitude: l.geo_coord.latitude, longitude: l.geo_coord.longitude } });
      }
    });
    addPins(projection, svg, places);*/
  });

  //Grid
  //var graticule = d3.geo.graticule();
  //svg.append("path").datum(graticule).attr("class", "graticule").attr("d", path); 
};

var toggleLocation = function(scope, element, attrs) {
  element.on('click', function(event) {
    event.stopImmediatePropagation();
    event.preventDefault();

    scope.setLocation(element[0].getAttribute("target-location"));

    $('.locationToggle').removeClass('active');
    $(element[0]).toggleClass('active');
    
    var fromDate = scope.selectStart;
    var toDate = scope.selectEnd;
    
    if (!(fromDate instanceof Date)) { fromDate = new Date(fromDate); }
    if (!(toDate instanceof Date)) { toDate = new Date(toDate); }

    scope.updateFn(scope.location, fromDate.toTimeString(), toDate.toTimeString(), scope.interval, scope.source);
  });
};

var selectSource = function(scope, element, attrs) {
  element.on('click', function(event) {
    event.stopImmediatePropagation();
    event.preventDefault();

    scope.setSource(element[0].getAttribute("target-source"));

    $('.sourceSelect').removeClass('active');
    $(element[0]).toggleClass('active');
    
    var fromDate = scope.selectStart;
    var toDate = scope.selectEnd;
    
    if (!(fromDate instanceof Date)) { fromDate = new Date(fromDate); }
    if (!(toDate instanceof Date)) { toDate = new Date(toDate); }

    scope.updateFn(scope.location, fromDate.toTimeString(), toDate.toTimeString(), scope.interval, scope.source);
  });
};

var drawWordcloud = function(scope, element, attrs) {
  var vis = d3.select(element[0]);
  var bbox = d3.select('#graph-container').node().getBoundingClientRect();
  var cloudSize = [bbox.width, bbox.height];
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
  drawWorld(mapGroup, cloudSize, scale, [], [0.0,0.0]);

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
      .style("height", "0.75em").append("span")
      .html(function(d) { return '<a href="#/trends/'+d.term+'">'+d.term+'</a>'; });
   });
};

var setTimespan = function(scope, element, attrs, IntervalService) {
  var container = d3.select(element[0]),
    margin = {top: 0, right: 25, bottom: 0, left: 40},
    height = 70;
  var width = (container.node().offsetWidth) - margin.left - margin.right;

  var svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  var context = svg.append('g').attr('class', 'context').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  scope.$watch('start', function (newVal, oldData){
    if (!newVal) { return; }
    context.selectAll('*').remove();
    
    //The x axis & labelling
    var timespan = [newVal, scope.end];
    var timeExtent = d3.extent(timespan, function(d) { return new Date(d); });
    var x = d3.time.scale().range([0, width]).domain(timeExtent);
    
    var format = d3.time.format("%-d %b");
    var spanDiff = (scope.end - newVal);
    if (spanDiff >= (300*24*60*60*1000)){ format = d3.time.format("%b %y"); }
    
    var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10).tickFormat(format);
    context.append("g").attr("class", "x axis").attr("transform", "translate(0," + (height/2) + ")")
      .call(xAxis).selectAll("text").attr("y", 4).attr("x", 2).style("text-anchor", "start").attr("transform", "rotate(+20)" );

    //The "brush" or selector itself
    var brush = d3.svg.brush().x(x).on('brushend', brushend);
    var brushg = context.append('g').attr('class', 'x brush').call(brush); 

    svg.append("defs").append("pattern").attr("height", 21).attr("width", 16).attr("id", "grip").append("image").attr("xlink:href", "app/assets/images/grip.png").attr("height", 25).attr("width", 16);
    brushg.selectAll(".resize").append("rect").attr("width", 16).attr("height", 20).attr("transform", "translate(-8,0)").style("fill", "url(#grip)");
    brushg.selectAll('rect').attr('y', 0).attr('height', 30);//.attr("transform", "translate(0," +  height / 2 + ")");

    // define our brush extent
    brush.extent([new Date(scope.selectStart), new Date(scope.selectEnd)]);
    brush(d3.select(".brush"));

    //Brush callback
    function brushend(){
      if (brush.empty()) {
        console.log("brush empty, doing nowt");
      } else {
        scope.selectStart = brush.extent()[0];
        scope.selectEnd = brush.extent()[1];
        scope.interval = IntervalService.calculateInterval(scope.selectStart, scope.selectEnd);
        scope.updateFn(scope.location, scope.selectStart.toTimeString(), scope.selectEnd.toTimeString(), scope.interval, scope.source);
      }
    };

  });

}

var timespanZoom = function(scope, element, attrs){
  element.on('click', function(event) {
    event.stopImmediatePropagation();
    event.preventDefault();

    var zoomIn = (element[0].getAttribute("zoom-direction") === "in");
    var diff = (scope.end - scope.start);
    var newDate = newDate = new Date(scope.start - Math.round(diff/8));
    if (zoomIn){ newDate = new Date((scope.start-0) + Math.round(diff/8)); }
    
    var maxDate = new Date(scope.end - (2*365*24*60*60*1000));
    var minDate = new Date(scope.end - (7*24*60*60*1000));

    if ((newDate >= maxDate) && (newDate <= minDate)){
      $('.zoomControl').prop("disabled", false);
      scope.updateFn(newDate);
    } else {
      $('.zoomControl').prop("disabled", false);
      $(element[0]).prop("disabled", true);
    }

  });
};

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
      //.style("background", function(d) { return d.children ? color(d.term) : null; })
      .html(function(d) { return d.children ? null : '<a href="#/trends/'+d.term+'">'+d.term+'</a>'; });

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