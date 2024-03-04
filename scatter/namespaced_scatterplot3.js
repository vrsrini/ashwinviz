var myScatterplot = {
    // Variables
    margin: { top: 20, right: 30, bottom: 50, left: 60 },
    //width: 960 - this.margin.left - this.margin.right,
    //height: 500 - this.margin.top - this.margin.bottom,
	get width() { 
        return 960 - this.margin.left - this.margin.right;
    },
    get height() {
        return 500 - this.margin.top - this.margin.bottom;
    },
	tooltip: d3.select("body").append("div") 
        .attr("class", "tooltip") 
        .style("opacity", 0),
	teamDropdown: document.getElementById('teamDropdown'), 
	x: null,
	y: null,
	isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,

	setupSVG: function() {
		this.svg = d3.select("body").append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
			
		// Declare scales inside setupSVG
        this.x = d3.scaleLinear().range([0, this.width]); 
        this.y = d3.scaleLinear().range([this.height, 30]);
		
		    // Add the axis creation code here
    this.svg.append("g")
        .attr("transform", "translate(0," + this.height + ")") 
        .attr("class", "x-axis");

    this.svg.append("g")
        .attr("class", "y-axis");
		
	    // Add x-axis label
    this.svg.append("text") 
        .attr("class", "x-axis-label")
        .attr("x", this.width / 2)  // Position in the middle of the x-axis 
        .attr("y", this.height + this.margin.bottom ) // Adjust vertical position as needed
        .style("text-anchor", "middle") 
        .text("Wickets");

    // Add y-axis label (with rotation for reversed effect)
    this.svg.append("text") 
        .attr("class", "y-axis-label")
        .attr("x", -(this.height / 2))  // Position in the middle of the y-axis
        .attr("y", -this.margin.left + 20 ) // Adjust horizontal position as needed
        .attr("transform", "rotate(-90)") // Rotate the text
        .style("text-anchor", "middle") 
        .text("Strike Rate (Reversed)");
	},		
		

    // Functions 
	loadData: function() { 
	   return new Promise((resolve, reject) => {
		   var datasetType = datasetDropdown.value; // Access value directly
		   var selectedType = typeDropdown.value;  // Access value directly
		   var selectedTeam = teamDropdown.value;  // Access value directly


			d3.csv("bowlerscatterall.csv").then(function(data) {
				myScatterplot.populateTeamDropdown(data); // Populate team dropdown based on loaded data

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
},

	populateTeamDropdown: function(data) {
		var uniqueTeams = [...new Set(data.map(d => d.Team))];

		// Use d3.select to make teamDropdown a D3 selection
		d3.select(teamDropdown).selectAll("*").remove(); // Clear existing options
		d3.select(teamDropdown).selectAll("option")
			.data(["All", ...uniqueTeams])
			.enter().append("option")
			.attr("value", d => d)
			.text(d => d);
	},


    updateScatterplot: function(data) {
        this.x.domain([70, d3.max(data, d => d.Wickets)]);
        this.y.domain([d3.max(data, d => d.StrikeRate), 30]);
		//isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        myScatterplot.svg.select(".x-axis").transition().call(d3.axisBottom(this.x));
        myScatterplot.svg.select(".y-axis").transition().call(d3.axisLeft(this.y));

        let circles = myScatterplot.svg.selectAll("circle").data(data, d => d.Name);

        circles.exit().remove(); 

        let enteredCircles = circles.enter().append("circle")
            .attr("r", 5);

        enteredCircles.merge(circles)
            .transition().duration(500)
            .attr("cx", d => this.x(d.Wickets))
            .attr("cy", d => this.y(d.StrikeRate))
            .style("fill", function(d) {
                if (d.Name === "R Ashwin") {
                    return "black"; 
                } else {
                    return d.Type === "Spin" ? "blue" : "red"; 
                }
            });
			
		enteredCircles.merge(circles)
		.on("mouseover", (event, d) => { 
			console.log("In mouseover");		
			if (!this.isTouchDevice) {  // Only for desktop
				var datasetType = datasetDropdown.value;
				var displayWickets = datasetType === "Away" ? d.Owickets : d.Wickets;
				var displayStrikeRate = datasetType === "Away" ? d.OstrikeRate : d.StrikeRate;

				this.tooltip.transition().duration(200).style("opacity", .9);
				this.tooltip.html(`BowlerName: ${d.Name}<br/>Wickets: ${displayWickets}<br/>StrikeRate: ${displayStrikeRate}`)
					.style("left", (event.pageX) + "px")
					.style("top", (event.pageY - 28) + "px");
			}
		})
		.on("mouseout", () => {
			if (!this.isTouchDevice) { // Only for desktop
				this.tooltip.transition().duration(500).style("opacity", 0);
			}
		})
		.on("touchstart", (event, d) => { // For touch devices
			var datasetType = datasetDropdown.property.value;
			var displayWickets = datasetType === "Away" ? d.Owickets : d.Wickets;
			var displayStrikeRate = datasetType === "Away" ? d.OstrikeRate : d.StrikeRate;

			this.tooltip.transition().duration(200).style("opacity", .9); // Consider quicker fade-in
			this.tooltip.html(`BowlerName: ${d.Name}<br/>Wickets: ${displayWickets}<br/>StrikeRate: ${displayStrikeRate}`)
					.style("left", (event.touches[0].pageX) + "px")
					.style("top", (event.touches[0].pageY - 28) + "px");
		})
		.on("touchend", () => { // Simplified touchend behavior
			this.tooltip.transition().duration(500).style("opacity", 0);
		}); 

        // ... (Your interaction code with modifications to use the namespace)
    },

    updateMedians: function(data,svg) {
        // ... (Your updateMedians function with modifications to use the namespace)
		var datasetType = datasetDropdown.value;
		var selectedType = typeDropdown.value;
		var selectedTeam = teamDropdown.value; // Ensure team filtering if needed

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
			.attr("x1", this.x(medianWickets))
			.attr("x2", this.x(medianWickets))
			.attr("y1", 0)
			.attr("y2", this.height);

		svg.append("text")
		  .attr("class", "median-label")
		  .attr("x", this.x(medianWickets) + 10) // Adjust the offset as needed
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
			.attr("x2", this.width)
			.attr("y1", this.y(medianStrikeRate))
			.attr("y2", this.y(medianStrikeRate));

		  svg.append("text")
			  .attr("class", "median-label")
			  .attr("x", this.width)
			  .attr("y", this.y(medianStrikeRate) - 5)
			  .attr("text-anchor", "end")
			  .text(`Median SR: ${medianStrikeRate.toFixed(1)}`);
	},

    init: function() { 
        // Renamed the function for clarity
        this.setupSVG(); 
		
		// Event listener for "Render button" 
        d3.select("#renderButton").on("click", function() {
            myScatterplot.loadData().then(data => { 
                myScatterplot.updateScatterplot(data);
                myScatterplot.updateMedians(data, myScatterplot.svg);
            }).catch(error => console.error("Error loading or updating data: ", error));
        });


        // Rest of your initialization code
        this.loadData().then(data => {
            this.updateScatterplot(data);
            this.updateMedians(data, myScatterplot.svg);
        }).catch(error => console.error("Error on initial data load: ", error));
    },
};

// Initialize your scatterplot
myScatterplot.init(); 
