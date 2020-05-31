// Sourced extensively from 
// http://bl.ocks.org/tlfrd/df1f1f705c7940a6a7c0dca47041fec8
// With many modifications

var width = 960,
    height = 750,
    scale = 350;

var proj = d3.geoOrthographic()
    .scale(scale)
    .translate([width / 2, height / 2 + 10])
// change this to 180 for transparent globe
    .clipAngle(90);


var path = d3.geoPath().projection(proj).pointRadius(3);

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

svg.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged));
         
svg.call(d3.zoom()
    .on("zoom", zoomed));

// Source of world topojson data and airport data
// https://github.com/topojson/world-atlas
src = [  "https://unpkg.com/world-atlas@1/world/110m.json",
        "airports.json"
     ];

var cells;
//Converted d4.v4 queue implementation to promise .then imlpementation
Promise.all(src.map(url => d3.json(url))).then(function(values){
    
    world=values[0];
    places=values[1];
    
    console.log("World Values", world);
    console.log("Airports", places);
    
    cells = d3.geoVoronoi()(places);
    console.log("Cells", cells);
    
    // Draws a Circle around the outside of the globe
    circle = svg.append("circle")
        .attr("cx", width / 2)
      	.attr("cy", height / 2 + 10)
        .attr("r", proj.scale())
        .attr("class", "noclicks")
        .attr("fill", "none");
    
    // Draws outline of continents
    svg.append("path")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);

    // Draws grid lines for latitude and longitude
    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule noclicks")
        .attr("d", path);

    // Draws airport points
    svg.append("g")
        .selectAll("circle")
        .data(places.features)
        .enter()
        .append("path")
        .attr("fill", "red")
        .attr("d", path);
     
  
    // Draws outlines of countries
    svg.append("g").attr("class","countries")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path);
    
    polygon = svg.append("g")
        .selectAll("cell")
        .data(cells.polygons().features)
        .enter()
        .append("path")
        .attr("stroke", "black")
        .attr("fill", "white")
        .attr("d", path)
        .style("opacity", .2);
    
    text = svg.append("text")
        .attr("x", 30)
        .attr("y", 30)
        .style("fill", "black")
        .text("Hover over an area");
})


function moved() {
  findcell(proj.invert(d3.mouse(this)));
}

//Inspired by https://bl.ocks.org/Fil/e94fc45f5ed4dbcc989be1e52b797fdd
function findcell(m) {
    polygon.on("mouseover", function (d) {
        var point = d3.select(this);
        var name = point._groups[0][0].__data__.properties.site.properties.name;
        point._groups[0][0].style.fill = "blue";
        text.text("Closest large airport: " + name);
    })    
    .on("mouseout", function (d) {
        var point = d3.select(this);
        point._groups[0][0].style.fill = "";
        text.text("Hover over an area");
    });
}
    

// Updates various parameters after drag/zoom functions
function refresh() {
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
