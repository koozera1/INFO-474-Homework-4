'use strict';

(function() {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope
  let div;

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500)

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("gapminder.csv")
      .then((data) => makeScatterPlot(data))
      .then
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData.filter(function(d){return d.year == '1980'});
    let allData = csvData;


    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions, allData);

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Fertility vs Life Expectancy (1980)");

    svgContainer.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map, allData) {
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;


    // append data to SVG and plot as points
    var dot = svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .attr('fill', "#4286f4")
        // add tooltip functionality to points
        .on("mouseover", (d) => {

          // make tooltip for country
          div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

          div.transition()
            .duration(200)
            .style("opacity", .9);
          div
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");

            // create the graph inside of the tooltip
            createToolTip(allData, d.country)
          
          console.log(d.country)
        })
        .on("mouseout", (d) => {
            // remove tooltip
            div.remove()
        });

  }


  function createToolTip(allData, currCountry) {
    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 50, bottom: 50, left: 110},
    width = 550 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;


    // append the svg object to the body of the page
    var svg = div
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


    let currData = allData.filter(function(d){return d.country == currCountry})

    // Add X axis --> it is a date format
    var x = d3.scaleTime()
      .domain(d3.extent(currData, function(d) { return +d.year; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(currData, function(d) { return +d.population; })])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add the line
    svg.append("path")
      .datum(currData)
      .attr("fill", "none")
      .attr("stroke", "#122066")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d) { return x(d.year) }) 
        .y(function(d) { return y(d.population) }) 
        )

    // Add title of the tooltip
    svg.append('text')
        .attr('x', 150)
        .attr('y', 0)
        .style('font-size', '14pt')
        .text(currCountry);

    // Add x axis label
    svg.append('text')
        .attr('x', 170)
        .attr('y', 410)
        .style('font-size', '10pt')
        .text('Years');
  
    // Add y axis label
    svg.append('text')
        .attr('transform', 'translate(-80, 200)rotate(-90)')
        .style('font-size', '10pt')
        .text('Population');


  }


  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
