// World Airports Voronoi Diagram Inspired by the Following Projects:
// - https://observablehq.com/@mbostock/world-airports-voronoi
// - https://observablehq.com/@d3/versor-dragging


// Globe code sourced extensively from 
// http://bl.ocks.org/tlfrd/df1f1f705c7940a6a7c0dca47041fec8
// With many modifications

var width = 960,
    height = 750,
    scale = 325;

var proj = d3.geoOrthographic()
    .scale(scale)
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .rotate([90, -20, 0]);


// Set path to be a geoPath projection
var path = d3.geoPath().projection(proj).pointRadius(3);

// Grid lines
var graticule = d3.geoGraticule();
  

var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .on("mousemove", moved);
    
// Draws outline around svg element
svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("stroke", "#777");

// Call functions on user interaction
svg.call(d3.drag()
         .on("start", dragstarted)
         .on("drag", dragged)
         .on("end", revert));
         
svg.call(d3.zoom()
         .on("zoom", zoomed)
         .on("end", revert));

// Source of world topojson data and airport data
// https://github.com/topojson/world-atlas
var src = [  "https://unpkg.com/world-atlas@1/world/110m.json",
             "https://unpkg.com/world-atlas@1/world/50m.json",
             "airports.json"
        ];

var cells, world110, world50;
var moving = false;
// Converted d4.v4 queue implementation to promise .then imlpementation
Promise.all(src.map(url => d3.json(url))).then(function(values){
    
    world110=values[0];
    world50=values[1];
    places=values[2];
    
    console.log("World Values", world50);
    console.log("Airports", places);
    
    cells = d3.geoVoronoi()(places);
    console.log("Cells", cells.polygons().features);
    
    // Draws a Circle around the outside of the globe
    circle = svg.append("circle")
        .attr("cx", width / 2)
      	.attr("cy", height / 2)
        .attr("r", proj.scale())
        .attr("class", "noclicks")
        .attr("fill", "none");
    
    // Draws grid lines for latitude and longitude
    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule noclicks")
        .attr("d", path);
    
    // Draws outline of continents
    svg.append("path")
        .datum(topojson.feature(world50, world50.objects.land))
        .attr("class", "land")
        .attr("d", path);
  
    // Draws outlines of countries
    svg.append("g").attr("class", "countries")
        .selectAll("path")
        .data(topojson.feature(world110, world110.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path);
    
    // Draws airport points
    svg.append("g")
        .selectAll("circle")
        .data(places.features)
        .enter()
        .append("path")
        .attr("fill", "red")
        .attr("d", path);
     
    
    // Draw Voronoi polygons around airport points
    polygon = svg.append("g")
        .selectAll("cell")
        .data(cells.polygons().features)
        .enter()
        .append("path")
        .attr("stroke", "black")
        .attr("fill", "white")
        .attr("d", path)
        .style("opacity", .2);
    
    // Append text to show highlighted airport area
    text = svg.append("text")
        .attr("x", width/2)
        .attr("y", height-20)
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .text("Hover over an area");
})

// When mouse moves on canvas, find closest cell
function moved() {
    findcell(proj.invert(d3.mouse(this)));
}

// Inspired by https://bl.ocks.org/Fil/e94fc45f5ed4dbcc989be1e52b797fdd
// Takes current cell and retreives data on it, and sets highlight color
function findcell(m) {
    polygon.on("mouseover", function (d) {
        var point = d3.select(this);
        point._groups[0][0].style.fill = "blue";
        var name = point._groups[0][0].__data__.properties.site.properties.name;   
        var country = point._groups[0][0].__data__.properties.site.properties.country;
        var municipality = point._groups[0][0].__data__.properties.site.properties.municipality
        country = getCountryName(country);
        if(name.length>0){
            name += ", ";
        }
        if(municipality.length>0){
            municipality += ", ";
        }
        text.text("Closest large airport: " + name + municipality + country);
    })    
    // If user leaves an area, set highlight to none and reset text
    .on("mouseout", function (d) {
        var point = d3.select(this);
        point._groups[0][0].style.fill = "";
        text.text("Hover over an area");
    });
}
    

// Updates circle and path parameters after drag/zoom functions
function refresh() {
    // When moving, set the path to 110m for greater responsivness
    svg.selectAll(".land").data(topojson.feature(world110, world110.objects.land).features).enter();
    svg.selectAll(".country").datum(topojson.feature(world110, world110.objects.countries).features);
    svg.selectAll("circle").attr("r", proj.scale());
    svg.selectAll("path").attr("d", path);

}


// Dragging functionality sourced from
// https://observablehq.com/@d3/versor-dragging 
function dragstarted() {
    v0 = versor.cartesian(proj.invert(d3.mouse(this)));
    r0 = proj.rotate();
    q0 = versor(r0);
}
  
function dragged() {
    var v1 = versor.cartesian(proj.rotate(r0).invert(d3.mouse(this))),
        q1 = versor.multiply(q0, versor.delta(v0, v1)),
        r1 = versor.rotation(q1);
    proj.rotate(r1);
    refresh();
}

// Added zoom
function zoomed(){
    proj.scale(scale*d3.event.transform.k);
    refresh();
}

// Sets land path back to 50m for greater detail
function revert(){
    svg.selectAll(".land").data(topojson.feature(world50, world50.objects.land).features).enter();
    svg.selectAll(".country").data(topojson.feature(world50, world50.objects.countries).features).enter();
    svg.selectAll("path").attr("d", path);
}
