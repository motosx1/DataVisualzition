function drawScatterplot(data, color_function, color_domain) {
    var chart = d3.select("#headingThree"),
        targetWidth = chart.node().getBoundingClientRect().width;

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = targetWidth - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var xScale = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.x; })).nice()
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.y; })).nice()
        .range([height, 0]);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var xAxis = d3.axisBottom()
        .scale(xScale);

    var yAxis = d3.axisLeft()
        .scale(yScale);

    var svg = d3.select("#tsne")
        .attr("width", targetWidth)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Sepal Width (cm)");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Sepal Length (cm)");

    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", function(d) { return xScale(d.x); })
        .attr("cy", function(d) { return yScale(d.y); })
        .style("fill", function(d) { return color_function(d.category); })
        .on('mouseover', function (d) {
            var transitionTime = 100;

            svg.append('text')
                .transition()
                .attr("class", "tip")
                .delay(transitionTime - 0.4 * transitionTime)
                .text("make: " + d.make
                      + ", fuel type: " + d['fuel-type']
                      + ", horsepower: " + d.horsepower
                      + ", city mpg: " + d['city-mpg']
                      + ", price: " + d.price)
                .attr("x", 10)
                .attr("y", 10);

            d3.select(this)
                .transition()
                .duration(transitionTime)
                .attr("r", 10);
        })
        .on('mouseout', function (d) {
            var transitionTime = 100;

            svg.selectAll("text").filter(".tip")
                .remove();

            d3.select(this)
                .transition()
                .duration(transitionTime)
                .attr("r", 4);
        });

    var legend = svg.selectAll(".legend")
        .data(color_domain)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d,i) { return color_function(i); });

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d, i) { return "Category "+(i+1); });
}
