var width = 600,
    height = 400,
    individuals = 25,
	generations = 20, 
	saturation = 0.3,
	lightness = 0.6,
	highlightedSaturation = 0.85,
	highlightedLightness = 0.40,
	mutationRate = 0.1;

var xRadius = Math.floor(0.25 * width/individuals),
	yRadius = Math.floor(0.25 * height/generations),
	radius = Math.min(xRadius, yRadius);

function accessor(key) {
    return function (o) {
        return o[key];
    };
}

function ancestors() {
	var anc = [];
	for (var i = 0; i < individuals; i += 1) {
		anc.push(Math.floor(Math.random() * individuals));
	}
	anc = anc.sort(function(a, b) {return a - b;});
	return anc;
}

// create nodes
var nodes = [];
for (var i = 0; i < individuals; i += 1) {
	for (var j = 0; j < generations; j += 1) {
		nodes.push(
			{"name": i.toString() + "-" + j.toString(), "coord": i, "gen": j, "hue": 200}
		);
	}
}

// link nodes
var links = [];
for (var j = 0; j < generations - 1; j += 1) {
	d3.zip(d3.range(individuals), ancestors()).map(function(d){
		var cCoord = d[0];
		var pCoord = d[1];
		var cGen = j+1;
		var pGen = j;
		var cName = cCoord.toString() + "-" + cGen.toString();
		var pName = pCoord.toString() + "-" + pGen.toString();
		var pNode, cNode;
		nodes.map( function (f) { 
			if (f.name == pName) { 
				pNode = f;
			}
			if (f.name == cName) { 
				cNode = f;
			}	
		});
		// inheritance
		cNode.hue = pNode.hue;
		// mutation
		if (Math.random() < mutationRate) {
			h = Math.random() * 360;
			cNode.hue = h;
		}
		links.push({"parent": pName, "child": cName, "cCoord": cCoord, "pCoord": pCoord, "cGen": cGen, "pGen": pGen, "hue": pNode.hue});
	});
}

function getRelated(name) {
	var n = [name];
    links.map( function (d) {
 		if (n.some( function(f) { return f == d.parent })) {
    		n.push(d.child);
    	}
    });
    links.reverse().map( function (d) {
 		if (n.some( function(f) { return f == d.parent })) {
    		n.push(d.child);
    	}
    });    
    links.map( function (d) {
 		if (n.some( function(f) { return f == d.child })) {
    		n.push(d.parent);
    	}
    });  
    links.reverse().map( function (d) {
 		if (n.some( function(f) { return f == d.child })) {
    		n.push(d.parent);
    	}
    });    
    return n;
}

var individuals = d3.max(nodes, accessor("coord")),
	generations = d3.max(nodes, accessor("gen"));

var x = d3.scale.linear()
    .domain([0, individuals])
    .range([radius + 1, width - radius - 1]);
    
var y = d3.scale.linear()
    .domain([0, generations])
    .range([radius + 1, height - radius - 1]);    

var plot = d3.select(".plot")
    .attr("width", width)
    .attr("height", height);
    
var lines = plot.selectAll("line")
	.data(links)
	.enter().append("line")
  	.style("stroke", function(d) { return d3.hsl(d.hue, saturation-0.2, lightness); })
	.attr("x1", function(d) { return x(d.pCoord); })
	.attr("y1", function(d) { return y(d.pGen); })
	.attr("x2", function(d) { return x(d.cCoord); })
	.attr("y2", function(d) { return y(d.cGen); });	

var points = plot.selectAll("circle")
    .data(nodes)
  	.enter().append("circle")
  	.style("fill", function(d) { return d3.hsl(d.hue, saturation, lightness); })
    .attr("cx", function(d) { return x(d.coord); })
    .attr("cy", function(d) { return y(d.gen); })
    .attr("r", radius)
    .on("mouseover", function() { 
    	target = d3.select(d3.event.target);
    	highlight = getRelated(target.datum().name);
    	plot.selectAll("circle").filter( function(d,i) { 
    		return highlight.some( function(f) { return f == d.name }); 
    	}).style("fill", function(d) { return d3.hsl(d.hue, highlightedSaturation, highlightedLightness); });
    	plot.selectAll("line").filter( function(d,i) { 
    		return highlight.some( function(f) { return f == d.child }); 
    	}).style("stroke", function(d) { return d3.hsl(d.hue, highlightedSaturation-0.2, highlightedLightness); });
    })
	.on("mouseout", function() { 
		plot.selectAll("circle").style("fill", function(d) { return d3.hsl(d.hue, saturation, lightness); });
		plot.selectAll("line").style("stroke", function(d) { return d3.hsl(d.hue, saturation-0.2, lightness); }); 
	});
