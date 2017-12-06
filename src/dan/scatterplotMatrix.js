var viewWidth = window.innerWidth;
var viewHeight = window.innerHeight;
// d3.select(window).on("resize", resize);

var margin = {top: 20, right: 40, bottom: 30, left: 40};
var width = viewWidth - margin.left - margin.right - 50;
var height = viewHeight - margin.top - margin.bottom - 50;

// get the data
var boats = boat_data.boats;


/* Define a paading of 20px */
var padding = 20;

/* Define the size of a scatter plot */
var scatterPlotSize = 230;

/* Create a template for the left axis */
var scaleLeft = d3.scaleLinear()
    .range([scatterPlotSize - padding / 2, padding / 2]);

var leftAxis = d3.axisLeft(scaleLeft)
    .ticks(6);


/* Create a template for the bottom axis */
var scaleBottom = d3.scaleLinear()
    .range([padding / 2, scatterPlotSize - padding / 2]);

var bottomAxis = d3.axisBottom(scaleBottom)
    .ticks(6);

function getDomainAndFeatureNr(data, excludedFeatures) {

	/* Initiate a domain variable */
	var domain = {};
	/* Get the name of the features, which are not excluded */
	var featureNames = d3.keys(data[0]).filter(function (d) { return excludedFeatures.indexOf(d) < 0; });
	/* Get the number of features */
	var featureNumber = featureNames.length;

	/* Build a map of the domain of each feature */
    featureNames.forEach(function(name) {
		domain[name] = d3.extent(data, function (d) { return d[name] });
	});

	/* return the triplet consisting of the domain, the names of the features, and the number of features */
	return [domain, featureNames, featureNumber];
}

function drawScatterplot(data, selectedFeatures = [], excludedFeatures = []) {
	/* remove what was previously in this SVG */
	d3.select("#plotSVG").remove();

	/* Get some info on the data */
	var res = getDomainAndFeatureNr(data, excludedFeatures);
	var domains = res[0];
	var featureNames = getCommonSet(res[1], selectedFeatures);
    var featureNumber = res[2] < selectedFeatures.length ? res[2] : selectedFeatures.length;

    /* Create a brush */
    var brush = d3.brush()
		.extent(function() {
			return [[scaleBottom.range()[0], scaleLeft.range()[1]], [scaleBottom.range()[1], scaleLeft.range()[0]]]
		})
        .on("start", brushStart)
        .on("brush", brushMove)
        .on("end", brushEnd);

    console.log(res);

    var distanceToBottom = scatterPlotSize * featureNumber;

    // leftAxis.tickSize(-distanceToBottom);
    // bottomAxis.tickSize(-distanceToBottom);

    /* Start adding elements */
    var svg = d3
		.select("#vis")
        .append("svg")
		.attr("id", "plotSVG")
        .attr("width", distanceToBottom + padding)
        .attr("height", distanceToBottom + padding)
        .attr("transform", "translate(" + padding + ", " + padding / 2 + ")");


	svg.selectAll("xAxis")
		.data(featureNames)
		.enter()
		.append("g")
		.attr("class", "x_axis")
		.attr("transform", function(d, i) { return "translate(" + ((i * scatterPlotSize) + 15) + ", " + (distanceToBottom - padding / 2) + ")" })
		.each(function(d) { scaleBottom.domain(domains[d]); d3.select(this).call(bottomAxis); });

	svg.selectAll("yAxis")
        .data(featureNames)
        .enter()
        .append("g")
        .attr("class", "y_axis")
        .attr("transform", function(d, i) { return "translate(" + 25 + ", " + ((featureNumber - 1 - i) * scatterPlotSize) + ")" })
        .each(function(d) { scaleLeft.domain(domains[d]); d3.select(this).call(leftAxis); });

	/* Define a Curry-like function */
	var curryPlot = function(p) {
        plotCellAndPoints(this, domains, data, p);
	};

	/* Cartesian product the names of the relevant features */
	var plotsData = cartesianProduct(featureNames, featureNames);

	/* Create each of the cells, and then plot the points within it */
	var cells = svg.selectAll("cell")
				.data(plotsData)
				.enter()
				.append("g")
				.attr("class", "cell")
				/* The constants 16 and 0.5 are used here for corrective purposes, i.e. to properly align the rectangle to the axes */
				.attr("transform", function(d) { return "translate(" + (d.i * scatterPlotSize + 16) + ", " + ((featureNumber - d.j - 1) * scatterPlotSize + 0.5) + ")"; })
				.each(curryPlot);

	/* Add a label to the cells found on the secondary diagonal of the scatter plot matrix */
	cells.filter(function(d) { return d.i === d.j; })
		.append("text")
		.attr("x", padding)
		.attr("y", padding)
		.attr("dy", ".71em")
		.text(function(d) { return d.iName; });

	cells.call(brush);

    /* The brushCell variable will hold the cell currently selected by the brush */
    var brushCell;

    function brushStart(p) {
        if (brushCell !== this) {
            d3.select(brushCell).call(brush.move, null);
            brushCell = this;
            //brush.move(d3.select(brushCell), null);

            scaleBottom.domain(domains[p.iName]);
            scaleLeft.domain(domains[p.jName]);
        }
    }

    function brushMove(p) {
        var e = d3.brushSelection(this);

        console.log("" + e);
        console.log(p.iName + " " + p.jName);

        if (!e)
            svg.selectAll(".circle").classed("hidden", false);
        else
			svg.selectAll(".circle").classed("hidden", function (d) {
				return e[0][0] > scaleBottom(d[p.iName]) || scaleBottom(d[p.iName]) > e[1][0]
					|| e[0][1] > scaleLeft(d[p.jName]) || scaleLeft(d[p.jName]) > e[1][1];
			});

    }

    // If the brush is empty, select all circles.
    function brushEnd() {
        if (d3.event.selection === null)
            svg.selectAll(".hidden").classed("hidden", false);
    }

}
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function cartesianProduct(featureSetA, featureSetB) {
	var collection = [];

	for (var i = 0; i < featureSetA.length; ++i)
		for (var j = 0; j < featureSetB.length; ++j)
			collection.push(
				{
					// x: data[featureSetA[i]],
					// y: data[featureSetB[j]],
                    iName: featureSetA[i],
                    jName: featureSetB[j],
					i: i,
					j: j
				}
			);

	return collection;
}


function plotCellAndPoints(caller, domains, data, p) {
    var cell = d3.select(caller);

    console.log(cell);

    cell.append("rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("height", scatterPlotSize - padding)
        .attr("width", scatterPlotSize - padding);

    scaleBottom.domain(domains[p.iName]);
    scaleLeft.domain(domains[p.jName]);

    cell.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("cx", function (d) { return scaleBottom(d[p.iName]); })
        .attr("cy", function (d) { return scaleLeft(d[p.jName]); })
        .attr("r", 3)
        .style("fill", getRandomColor());
}

function resize() {
  viewWidth = window.innerWidth;
  viewHeight = window.innerHeight;

  width = viewWidth - margin.left - margin.right - 50;
  height = viewHeight - margin.top - margin.bottom - 50;

  drawScatterplot(boats);
}

function getCommonSet(setA, setB) {
	var finalSet = [];

	setA.sort();
	setB.sort();

	for (var indexA = 0, indexB = 0; indexA < setA.length && indexB < setA.length; ) {
		if (setA[indexA] === setB[indexB]) {
            finalSet.push(setA[indexA])
            ++indexA;
            ++indexB;
        } else if (setA[indexA] < setB[indexB])
        	++indexA;
		else
			++indexB;
	}

	return finalSet;
}

var totalFeatures = d3.keys(boats[0]); // ["a", "m", "u", "v", "x", "y"];

$(function() {

	for (var i = 0; i < totalFeatures.length; ++i) {
		var newElement = "<li onclick='elementSelected(this)' value='" + totalFeatures[i] + "' class = 'featureFont'>" + totalFeatures[i] + "</li>";

		$("#features").append(newElement);
	}

    console.log(totalFeatures);

    drawScatterplot(boats, totalFeatures);
});

function elementSelected(element) {
	var value = element.getAttribute("value");
    var index = totalFeatures.indexOf(value);

	console.log(value);

	if (index >= 0) {
        totalFeatures.splice(index, 1);
    	// element.setAttribute("style", "color: black;");
		$(element).addClass("unselectedFont");
	} else {
        totalFeatures.push(value);
    	// element.removeAttribute("style");
        $(element).removeClass("unselectedFont");
	}

	console.log(totalFeatures);

    drawScatterplot(boats, totalFeatures);
}