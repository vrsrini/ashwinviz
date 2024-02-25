var margin = { top: 20, right: 30, bottom: 50, left: 60 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "x-axis");

svg.append("g")
    .attr("class", "y-axis");

var datasetDropdown = d3.select("#datasetDropdown");
var typeDropdown = d3.select("#typeDropdown");
var teamDropdown = d3.select("#teamDropdown"); // Added teamDropdown

function loadData() {
    return new Promise((resolve, reject) => {
        var datasetType = datasetDropdown.property("value");
        var selectedType = typeDropdown.property("value");
        var selectedTeam = teamDropdown.property("value");

        d3.csv("bowlerscatterall.csv").then(function(data) {
            populateTeamDropdown(data); // Populate team dropdown based on loaded data

            var processedData = data.map(d => ({
                ...d,
                Wickets: datasetType === "Away" ? +d.Owickets : +d.Wickets,
                Balls: datasetType === "Away" ? +d.Oballs : +d.Balls,
                StrikeRate: datasetType === "Away" ? +d.OstrikeRate : +d.StrikeRate,
                Matches: datasetType === "Away" ? d.OMatches : d.Matches,
                Name: d.Name.trim(),
                Type: d.Type.trim(),
                Team: d.Team.trim()
            })).filter(d => (datasetType !== "Away" || (+d.Balls !== -99 && +d.Wickets !== -99)) &&
             (selectedType === "All" || d.Type === selectedType) &&
             (selectedTeam === "All" || d.Team === selectedTeam));
            resolve(processedData);
        }).catch(error => reject(error));
    });
}


function populateTeamDropdown(data) {
    var uniqueTeams = [...new Set(data.map(d => d.Team))];
    teamDropdown.selectAll("*").remove(); // Clear existing options
    teamDropdown.selectAll("option")
        .data(["All", ...uniqueTeams])
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);
}

function updateScatterplot(data) {
    x.domain([70, d3.max(data, d => d.Wickets)]);
    y.domain([d3.max(data, d => d.StrikeRate), 30]);

    svg.select(".x-axis").transition().call(d3.axisBottom(x));
    svg.select(".y-axis").transition().call(d3.axisLeft(y));

    var circles = svg.selectAll("circle").data(data, d => d.Name);

    circles.exit().remove();

    var enteredCircles = circles.enter().append("circle")
        .attr("r", 5);

    enteredCircles.merge(circles)
        .transition().duration(500)
        .attr("cx", d => x(d.Wickets))
        .attr("cy", d => y(d.StrikeRate))
        //.style("fill", d => d.Type === "Spin" ? "blue" : "red");
		.style("fill", function(d) {
		  if (d.Name === "R Ashwin") {
		  return "black"; // Special color for "R Ashwin"
		} else {
		  return d.Type === "Spin" ? "blue" : "red"; // Existing logic
		}
	  });

    enteredCircles.merge(circles)
        .on("mouseover", (event, d) => {
            var datasetType = datasetDropdown.property("value");
            var displayWickets = datasetType === "Away" ? d.Owickets : d.Wickets;
            var displayStrikeRate = datasetType === "Away" ? d.OstrikeRate : d.StrikeRate;
            
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`BowlerName: ${d.Name}<br/>Wickets: ${displayWickets}<br/>StrikeRate: ${displayStrikeRate}`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });
}


/*function updateMedians(data) {
  var datasetType = datasetDropdown.property("value");
  var selectedType = typeDropdown.property("value");
  
  var filteredData = data.filter(d => selectedType === "All" || d.Type === selectedType);

  var medianWickets = d3.median(filteredData, d => datasetType === "Away" ? +d.Owickets : +d.Wickets);
  var medianStrikeRate = d3.median(filteredData, d => datasetType === "Away" ? +d.OstrikeRate : +d.StrikeRate);

  svg.selectAll(".median-line").remove();
  svg.selectAll(".median-label").remove();*/
function updateMedians(data) {
    // Assuming x and y scales are already updated based on this data in updateScatterplot

    var datasetType = datasetDropdown.property("value");
    var selectedType = typeDropdown.property("value");
    var selectedTeam = teamDropdown.property("value"); // Ensure team filtering if needed

    var filteredData = data.filter(d => (selectedType === "All" || d.Type === selectedType) &&
                                        (selectedTeam === "All" || d.Team === selectedTeam));

    var medianWickets = d3.median(filteredData, d => datasetType === "Away" ? +d.Owickets : +d.Wickets);
    var medianStrikeRate = d3.median(filteredData, d => datasetType === "Away" ? +d.OstrikeRate : +d.StrikeRate);

    // Clear previous medians
    svg.selectAll(".median-line").remove();
    svg.selectAll(".median-label").remove();
	
	console.log("Value of dropdowns", selectedType, "and",datasetType, "and",  selectedTeam);
	console.log("Value of medianWickets",medianWickets);
	console.log("Value of medianWickets",medianStrikeRate);
	console.log("Filtered Data", filteredData);
	

// Draw median lines and labels for Wickets
svg.append("line")
    .attr("class", "median-line")
    .style("stroke", "black")
    .style("stroke-width", 2)
    .style("stroke-dasharray", "5,5") // Set the line to be dashed
    .attr("x1", x(medianWickets))
    .attr("x2", x(medianWickets))
    .attr("y1", 0)
    .attr("y2", height);

svg.append("text")
  .attr("class", "median-label")
  .attr("x", x(medianWickets) + 10) // Adjust the offset as needed
  .attr("y", 5)
  .style("text-anchor", "start") // Align text to start from the x position
  .text(`Median Wkts: ${medianWickets.toFixed(1)}`);


// Draw median lines and labels for Strike Rate
svg.append("line")
    .attr("class", "median-line")
    .style("stroke", "red")
    .style("stroke-width", 2)
    .style("stroke-dasharray", "5,5") // Set the line to be dashed
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", y(medianStrikeRate))
    .attr("y2", y(medianStrikeRate));

  svg.append("text")
      .attr("class", "median-label")
      .attr("x", width)
      .attr("y", y(medianStrikeRate) - 5)
      .attr("text-anchor", "end")
      .text(`Median SR: ${medianStrikeRate.toFixed(1)}`);
}


// Event listener for the "Render" button
d3.select("#renderButton").on("click", function() {
    loadData().then(data => {
        updateScatterplot(data);
        updateMedians(data);
    }).catch(error => console.error("Error loading or updating data: ", error));
});

// Initial data load and plot setup
loadData().then(data => {
    updateScatterplot(data);
    updateMedians(data);
}).catch(error => console.error("Error on initial data load: ", error));
