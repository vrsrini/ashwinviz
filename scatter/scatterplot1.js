var margin = { top: 20, right: 30, bottom: 50, left: 60 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Append a div to serve as a tooltip
var tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px");

// Dropdown setup
var typeDropdown = d3.select("#typeDropdown");

console.log("Before data loading");
// Load the data
d3.csv("bowlerscatter.csv").then(function (data) {
  // Process data
  data.forEach(function (d) {
    d.Wickets = +d.Wickets; // Convert Wickets to number
    d.Balls = +d.Balls; // Ensure Balls is treated as a number for consistency
    d.StrikeRate = +d.StrikeRate; // Convert StrikeRate to number
    // No conversion needed for Name, but you might want to trim whitespace
    d.Name = d.Name.trim();
    d.Type = d.Type.trim();
  });

  // X axis
  var x = d3
    .scaleLinear()
    .domain([100, 850]) // Start from 100
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add X axis label
  svg
    .append("text")
    .attr(
      "transform",
      "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")"
    )
    .style("text-anchor", "middle")
    .text("Wickets");

  /// Y axis
  var y = d3
    .scaleLinear()
    .domain([d3.max(data, function (d) { return d.StrikeRate; }), 30])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // Y axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Strike Rate");

  // Function to dynamically populate the team dropdown
  function populateTeamDropdown() {
    // Collect unique teams (remove duplicates)
    const uniqueTeams = [...new Set(data.map((d) => d.Team))]; 
	console.log("Unique teams:", uniqueTeams); // Check the list of teams

    // Get a reference to the team dropdown
    const teamDropdown = d3.select("#teamDropdown");

    // Add options for each team
    teamDropdown
      .selectAll("option")
      .data(uniqueTeams) 
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d); 
  }

  // Function to update medians and redraw median lines
  function updateMedians() {
    var selectedType = typeDropdown.property("value");
    var filteredData = data.filter(function (d) { 
      return selectedType === "All" || d.Type === selectedType; 
    });

    // Calculate median of Wickets for filtered data
    const wickets = filteredData.map((d) => d.Wickets).sort(d3.ascending);
    const medianWickets = d3.median(wickets);

    // Calculate median of StrikeRate for filtered data
    const StrikeRate = filteredData
      .map((d) => d.StrikeRate)
      .sort(d3.ascending);
    const medianStrikeRate = d3.median(StrikeRate);

    // Remove old median lines
    svg.selectAll("line").remove(); // Avoid duplicate lines
	 // Remove old median labels before drawing new ones
	svg.selectAll("text").remove(); 
	
	

    // Draw vertical line for median Wickets
    svg
      .append("line")
      .style("stroke", "black")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "5,5") // Dashed line
      .attr("x1", x(medianWickets))
      .attr("y1", 0)
      .attr("x2", x(medianWickets))
      .attr("y2", height);
	  
	// Vertical line with label at the top (with rounding)
	svg.append("text")
     .attr("transform", `translate(${x(medianWickets)}, 5)`) 
     .attr("dy", ".71em")
     .style("text-anchor", "start")
     .text(`Median Wkts: ${medianWickets.toFixed(1)}`);
	  
	 
    // Draw horizontal line for median StrikeRate
    svg
      .append("line")
      .style("stroke", "black")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "5,5") // Dashed line
      .attr("x1", 0)
      .attr("y1", y(medianStrikeRate))
      .attr("x2", width)
      .attr("y2", y(medianStrikeRate));
	  
	// Horizontal line with label below (with rounding)
  svg.append("text")
     .attr("transform", `translate(${width - 10}, ${y(medianStrikeRate) + 15})`) 
     .attr("dy", ".35em") 
     .style("text-anchor", "end")
     .text(`Median SR: ${medianStrikeRate.toFixed(1)}`);
	 
  }

  // Function to update the scatter plot based on filter
  function updateScatterplot() {
    const selectedType = d3.select("#typeDropdown").property("value"); 
    const selectedTeam = d3.select("#teamDropdown").property("value");
	console.log("Selected Team: ", selectedTeam); // Check if selection is registered

    // Filter data based on both selections
    const filteredData = data.filter((d) => {
      return (
        (selectedType === "All" || d.Type === selectedType) && 
        (selectedTeam === "All" || d.Team === selectedTeam) 
      );
    });
	console.log("Total data points:", data.length); 
    console.log("Filtered data points:", filteredData.length);
    console.log("First few filtered data entries:", filteredData.slice(0, 3));

    // Update the circles based on the filtered data
    var circles = svg
      .selectAll("circle")
      .data(filteredData, function(d) { 
        return d.Name; 
      }); // Use Name as a key for stable updates

    // Remove old circles that no longer exist in the filtered data
    circles.exit().remove();

    // Update positions and colors of existing circles
    circles
      .transition()
      .duration(500) // Add a transition for smoothness
      .attr("cx", function(d) {
        return x(d.Wickets);
      })
      .attr("cy", function(d) {
        return y(d.StrikeRate);
      })
      .style("fill", function(d) {
		  if (d.Name === "R Ashwin") {
		  return "black"; // Special color for "R Ashwin"
		} else {
		  return d.Type === "Spin" ? "blue" : "red"; // Existing logic
		}
      }); 

    // Add new circles for newly filtered data
    circles
      .enter()
      .append("circle")
      .attr("cx", function(d) {
        return x(d.Wickets);
      })
      .attr("cy", function(d) {
        return y(d.StrikeRate);
      })
      .attr("r", 5)
	.style("fill", function(d) {
			  if (d.Name === "R Ashwin") {
			  return "black"; // Special color for "R Ashwin"
			} else {
			  return d.Type === "Spin" ? "blue" : "red"; // Existing logic
			}
		  })
      // Now attach the event listeners directly within this chain
      .on("mouseover", function(event, d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`BowlerName: ${d.Name}<br/>Wickets: ${d.Wickets}<br/>StrikeRate: ${d.StrikeRate}`)
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Update medians whenever the filter changes
    updateMedians(); 
  }

  // Populate the team dropdown
  populateTeamDropdown();  

    // Initial plot rendering (with "All" as the default filter)
    updateScatterplot();
    updateMedians(); // Draw initial median lines
	
	// Event listener for the "Render" button (only subsequent updates)
  d3.select("#renderButton").on("click", function() {
      updateScatterplot();
      updateMedians();
  });

    // Call updateScatterplot whenever the dropdown selection changes
    //typeDropdown.on("change", updateScatterplot);
}).catch(function(error) {
  console.error("Error loading or processing data", error);
});
