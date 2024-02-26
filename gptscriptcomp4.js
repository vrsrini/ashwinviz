// Define global variables and constants
let currentMatch = 1,
    racePaused = false,
    raceFinished = false,
    milestoneCounter = 0,
    resumePoints = [],
    milestonesByMatch = {},
    milestoneCount = 0,
	exitingBowlersInfo = [],
    loadedData;
// Make sure maxWickets is updated based on the dropdown selection
let maxWickets = parseInt(document.getElementById('maxWickets').value);
document.getElementById('maxWickets').addEventListener('change', function() {
  maxWickets = parseInt(this.value);
  //updateChartForMaxWickets();
  // Update the chart to reflect the new maxWickets value
});

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// D3 chart setup
const margin = { top: 100, right: 160, bottom: 30, left: 50 },
      width = 1500 - margin.left - margin.right,
      height = 3000;

const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
	//.attr("height", tallestBarHeight + somePadding) // Dynamic height setting
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const x = d3.scaleBand().range([0, width]).padding(0.1),
      y = d3.scaleLinear().domain([maxWickets, 0]).range([height, 0]);
	  
//console.log("Max wickets : ",maxWickets);

svg.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(y).ticks(10)
        .tickFormat(d => d === 0 ? "Start" : d === maxWickets ? d + " wkts" : d)
        .tickSize(-width));

const tooltip = d3.select("body").append("div").attr("class", "tooltip");

const milestoneText = svg.append("text")
    .attr("class", "milestoneText")
    .attr("x", 0)
    .attr("y", 0)
    .style("text-anchor", "start")
    .style("font-size", "16px");
	
// Function to update chart elements based on new maxWickets
function updateChartForMaxWickets() {
    // Update the y scale's domain with the new maxWickets value
	y.domain([maxWickets + 10, 0]);

    // Re-call the Y-axis to reflect the new domain
    svg.select(".y.axis")
        .call(d3.axisLeft(y).ticks(10)
            .tickFormat(d => d === 0 ? "Start" : d + " wkts")
            .tickSize(-width));

    // Optionally, re-draw other chart elements that depend on the y scale here
    // This might include bars, lines, or other SVG elements in your visualization
}

function startVisualization() {
	return d3.csv("bowler_dataNew.csv").then(data => { // Return the promise here
        loadedData = data.map(d => {
            d.matchesPlayed = +d.matchesPlayed;
            d.wicketsTaken = +d.wicketsTaken;
            return d;
        });
        //console.log(loadedData);

        // Initialize bowler activity tracking
        const bowlerLastMatch = {};
        loadedData.forEach(d => {
            // If bowler exists, update their last match if current is later; else, add them
            if (bowlerLastMatch[d.Name]) {
                if (d.matchesPlayed > bowlerLastMatch[d.Name]) {
                    bowlerLastMatch[d.Name] = d.matchesPlayed;
                }
            } else {
                bowlerLastMatch[d.Name] = d.matchesPlayed;
            }
        });

        // Store bowlerLastMatch for use in updateChart
        window.bowlerLastMatch = bowlerLastMatch;
    }).catch(error => console.error('Error loading the CSV file:', error));
}


// Event listener for the start/resume button
document.getElementById('start-button').addEventListener('click', function() {
    const buttonText = this.innerText;
    if (buttonText === "Start") {
        this.disabled = true;
		document.getElementById('maxWickets').disabled = true; // Disable the dropdown
        
		// Ensure data is loaded before starting the race
        startVisualization().then(() => {
            this.innerText = "Resume";
            racePaused = false;
		if(currentMatch === 1) {
                updateChart(loadedData.filter(d => d.matchesPlayed === currentMatch));
            }
            runRace(); // Begin the race
        });
	} else if (buttonText === "Resume" && racePaused) {
        racePaused = false;
        this.disabled = true;
        runRace();
    }
});

document.getElementById('reset-button').addEventListener('click', function() {
    resetForNewRace(); // Call your existing reset function
    this.style.display = 'none'; // Hide the reset button again
});



function updateChart(matchData) {
    x.domain(matchData.map(d => d.Name));
	updateChartForMaxWickets();
    const bars = svg.selectAll(".bar")
        .data(matchData, d => d.Name);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .merge(bars)
        .attr("x", d => x(d.Name))
        .attr("width", x.bandwidth())
        .attr("y", 0)
        .attr("height", d => y(d.wicketsTaken))
        //.attr("fill", d => d.Type === "Spin" ? "#0000FF" : "#FF0000")
		.style("fill", function(d) {
		  if (d.Name === "R Ashwin") {
			  return "black"; // Special color for "R Ashwin"
			} else {
			  return d.Type === "Spin" ? "blue" : "red"; // Existing logic
			}		
		  })
        //.on("mouseover", tooltipShow)
        //.on("mouseout", tooltipHide);
		.on("mouseover", function(event, d) {
			if (!isTouchDevice) { // Only for desktop
				tooltip.transition()
					.duration(200)
					.style("opacity", .9);
				tooltip.html(`Bowler: ${d.Name}<br>Wickets: ${d.wicketsTaken}<br>Matches: ${d.matchesPlayed}`)
					.style("left", (event.pageX) + "px")
					.style("top", (event.pageY - 28) + "px");
			}
		})
		.on("mousemove", function(event) {
			if (!isTouchDevice) { // Only for desktop
				tooltip.style("left", (event.pageX) + "px")
					.style("top", (event.pageY - 28) + "px");
			}
		})
		.on("mouseout", function() {
			if (!isTouchDevice) { // Only for desktop
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
			} 
		})
		.on("touchstart", function(event, d) { //  For touch devices
			tooltip.transition()
				.duration(200) // Consider a quicker fade-in for touch
				.style("opacity", .9);
			tooltip.html(`Bowler: ${d.Name}<br>Wickets: ${d.wicketsTaken}<br>Matches: ${d.matchesPlayed}`)
				.style("left", (event.touches[0].pageX) + "px") 
				.style("top", (event.touches[0].pageY - 28) + "px");
		})
		.on("touchend", function() { 
			tooltip.transition()
				.duration(500)
				.style("opacity", 0);
		});
    bars.exit().remove();


// Exit message appending
	matchData.forEach(d => {
		if (window.bowlerLastMatch[d.Name] === currentMatch) {
			//console.log(`${d.Name}'s career ends with ${d.wicketsTaken} wickets in ${d.matchesPlayed} matches.`);
			if (d.wicketsTaken < maxWickets) {
				exitingBowlersInfo.push(`${d.Name}, ${d.Team}, ${d.matchesPlayed}, ${d.wicketsTaken}`);
			}
		}
	});

/*// Dynamically set the milestone threshold based on maxWickets
let milestoneThreshold = maxWickets === 100 ? 50 : 100;
console.log("milestone threshold is: ",milestoneThreshold); */

// Define milestones based on maxWickets
let milestones;
if (maxWickets === 100) {
    milestones = [50];
} else if (maxWickets === 200) {
    milestones = [100];
} else if (maxWickets === 300) {
    milestones = [200]; // Add 200 as a second milestone to track
} else if (maxWickets === 400) {
    milestones = [300]; // Add 200 as a second milestone to track
} else if (maxWickets === 500) {
    milestones = [400]; // Add 200 as a second milestone to track
} else if (maxWickets === 600) {
    milestones = [500]; // Add 200 as a second milestone to track
} else if (maxWickets === 700) {
    milestones = [500]; // Add 200 as a second milestone to track
} else if (maxWickets === 800) {
    milestones = [500]; // Add 200 as a second milestone to track
}

let currentMilestoneIndex = 0; // To track which milestone we're currently checking

// Function to calculate viewport height for scrolling
function calculateViewportHeight(wickets) {
    const yPixelValue = y(wickets); 
    const pixelOffset = 50; 

    // Calculate based on fixed chart height
    const maxScroll = height - window.innerHeight + pixelOffset; 
    return Math.min(yPixelValue + pixelOffset, maxScroll); 
}

// Function to display milestone messages dynamically based on the current milestone
function displayMilestoneMessages() {
    let currentMilestone = milestones[currentMilestoneIndex]; // Get the current milestone
    document.getElementById('milestone-messages').innerText = ''; // Clear previous messages
    Object.entries(milestonesByMatch).forEach(([matchKey, bowlers]) => {
        // Only display messages for the current milestone
        if(matchKey.includes(`${currentMilestone} Wickets`)) {
            let bowlerDetails = bowlers.map(bowler => `${bowler.name} (${bowler.team})`).join(", ");
            document.getElementById('milestone-messages').innerText += `Bowler(s) who reached ${currentMilestone} wickets in ${matchKey.split(' - ')[0]} - ${bowlerDetails}\n`;
        }
    });
}


// Adjust the check within the forEach loop
matchData.forEach(d => {
    let currentMilestone = milestones[currentMilestoneIndex];
    if ((milestoneCount < 5 || maxWickets === 800) && d.wicketsTaken >= currentMilestone && !resumePoints.includes(d.Name)) {
        racePaused = true;
        let matchKey = `${d.matchesPlayed} Tests - ${currentMilestone} Wickets`;
        if (!milestonesByMatch[matchKey]) {
            milestonesByMatch[matchKey] = [];
            milestoneCount++;
        }
        milestonesByMatch[matchKey].push({ name: d.Name, team: d.Team });
        resumePoints.push(d.Name);
    }
	
		if (racePaused) {
		document.getElementById('start-button').disabled = false;
		document.getElementById('start-button').innerText = "Resume";
		displayMilestoneMessages();
		// Scrolling during pause
            const currentMilestone = milestones[currentMilestoneIndex];
            const viewportHeight = calculateViewportHeight(currentMilestone);
            window.scrollTo({ 
                top: viewportHeight,
                behavior: 'smooth'
            });
	}
	
	    // Move to the next milestone if the current one has been fully processed
    if (milestoneCount >= 5 && currentMilestoneIndex < milestones.length - 1) {
        currentMilestoneIndex++;
        milestoneCount = 0; // Reset for the next milestone
        // Optionally reset or clear messages for the next milestone
    }
})

    // Check for a winner
	let winner = matchData.find(d => d.wicketsTaken >= maxWickets);
		if (winner) {
		raceFinished = true;
		let winnerMessage = `<strong>Race finished! Bowler ${winner.Name} wins by reaching ${maxWickets} wickets in ${winner.matchesPlayed} Test matches.</strong>`;
		document.getElementById('milestone-messages').innerHTML += winnerMessage;
		document.getElementById('reset-button').style.display = 'block'; // Show reset button
		// Scrolling for winner
       const viewportHeight = calculateViewportHeight(maxWickets);
       window.scrollTo({ 
           top: viewportHeight,
           behavior: 'smooth'
       });
	}

}

function runRace() {
    if (!raceFinished && !racePaused) {
        const matchData = loadedData.filter(d => d.matchesPlayed === currentMatch);
		//console.log("Within runrace() to be checked for currentMatch", currentMatch);
		//console.log(matchData);
        if (matchData.length > 0) {
            updateChart(matchData);
            currentMatch++;
			document.getElementById('match-counter').innerText = `Matches Played: ${currentMatch-1}`;
            setTimeout(runRace, 100); // Adjust delay as needed
        } else {
            raceFinished = true;
            alert("Race finished. No more data available.");
            //displaySummaryBox(currentMatch); // Display summary box at the end of the race
            resetForNewRace(); // Reset after the race finishes
        }
    }
}

// Assuming displaySummaryBox() is defined to encapsulate the summary box display logic
/*function displaySummaryBox(matches) {
    let summaryMessage = `Bowlers whose career has ended before or have played lower than ${matches} matches - ` + exitingBowlersInfo.join(": ");
    let summaryBox = document.createElement("div");
    summaryBox.style.position = "relative";
    summaryBox.style.marginTop = "20px";
    summaryBox.innerHTML = summaryMessage;
    document.getElementById("chart").after(summaryBox);
}*/





function resetForNewRace() {
    document.getElementById('start-button').innerText = "Start";
    document.getElementById('start-button').disabled = false;
	document.getElementById('maxWickets').disabled = false; // Re-enable the dropdown
    // Reset global variables for a new race
    currentMatch = 1;
    racePaused = false;
    raceFinished = false;
    milestoneCounter = 0;
    resumePoints = [];
    milestonesByMatch = {};
    milestoneCount = 0;
	exitingBowlersInfo = []; // Clear any exiting bowler info
    loadedData = []; // Optionally clear loadedData if you plan to reload or reinitialize it
    // Optionally, reinitialize your chart here
	
	// Reinitialize your chart or visualization here if necessary
    // For example, clear the chart and prepare for new data rendering
    svg.selectAll(".bar").remove(); // Remove all bars from the chart
    // Optionally, you might want to call startVisualization() or similar function to reload data and prepare the chart
	// Viewport Reset 
    window.scrollTo({ 
        top: 0,
        behavior: 'smooth'
    });
	// To simply remove the existing Y axis and its ticks
	svg.select(".y.axis").selectAll("*").remove();

    // Reset the maxWickets to its default value if needed
    document.getElementById('maxWickets').value = "100"; // or any default value you prefer
    maxWickets = parseInt(document.getElementById('maxWickets').value); // Update the maxWickets variable accordingly

    // Clear the milestone message area
    document.getElementById('milestone-messages').innerText = '';
	document.getElementById('match-counter').innerText = `Matches Played: 0`;

}

// Initialize the visualization
startVisualization();
