
const timelineSlider = {
    init: () => {
        const [startDate, endDate] = d3.extent(App.data.patients, d => d.SAMPLE_COLLECTION_DATE);

        const formatDateIntoYear = d3.timeFormat("%m/%d/%y");
        const formatDate = d3.timeFormat("%B %d, %Y"); //%A,

        const margin = { top: 5, right: 10, bottom: 5, left: 10 },
            width = 320 - margin.left - margin.right,
            height = 70 - margin.top - margin.bottom;

        const svg = d3.select("#vis")
            .append("svg")
            .attr("width", "320px")
            .attr("height", height);

        let moving = false;
        let currentValue = 0;
        const targetValue = width;

        const numDays = daysBetween(startDate, endDate);

        const playButton = d3.select("#timeline-play");

        playButton.on("click", function () {
            const button = d3.select(this);
            if (button.attr("class") === "playing") {
                button.attr("class", "not-playing");
                moving = false;
                clearInterval(timer);
            } else {
                button.attr("class", "playing");
                moving = true;
                timer = setInterval(dateSliderStep, 50);
            }
        });

        const x = d3.scaleTime()
            .domain([startDate, endDate])
            .range([0, targetValue])
            .clamp(true);

        const slider = svg.append("g")
            .attr("class", "slider")
            .attr("transform", "translate(" + margin.left + "," + 32 + ")");

        const label = slider.append("text")
            .attr("class", "label")
            .attr("id", "dateFilter")
            .attr("x", targetValue / 2)
            .attr("text-anchor", "middle")
            .text(formatDate(startDate))
            .attr("transform", "translate(0," + (-10) + ")");

        slider.append("line")
            .attr("class", "track")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1])
            .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-inset")
            .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-overlay")
            .call(d3.drag()
                .on("start.interrupt", function () {
                    slider.interrupt();
                    currentValue = Math.max(0, d3.event.x);
                    dateSliderUpdate(x.invert(currentValue));
                })
                .on("drag", function () {
                    currentValue = Math.max(0, d3.event.x);
                    dateSliderUpdate(x.invert(currentValue), true);
                })
            );

        const eventLabel = slider.append("text")
            .attr("class", "timeline-event-label")
            .attr("x", targetValue / 2)
            .attr("text-anchor", "middle")
            .text("null")
            .attr("transform", "translate(0," + (25) + ")")
            .attr("visibility", "hidden")
            .style("fill", "#1f78b4");

        slider.selectAll("timeline-event")
            .data(App.data.timeline_events)
            .enter()
            .append("line")
            .attr("class", "timeline-event")
            .attr("x1", d => (x(new Date(d.Date)) + x(getDateAfterDays(d.Date, 1))) / 2)
            .attr("x2", d => (x(new Date(d.Date)) + x(getDateAfterDays(d.Date, 1))) / 2)
            .attr("y1", -4)
            .attr("y2", 4)
            .attr("name", d => "event_" + d.Name)
            .on("mouseover", function (d, i) {
                d3.select(this).classed("active", true);
                eventLabel.attr("visibility", "visible");
                eventLabel.text(d.Name + " - " + formatDateIntoYear(d.Date));
            })
            .on("mouseout", function (d, i) {
                d3.select(this).classed("active", false);
                eventLabel.attr("visibility", "hidden");
            }).on("click", function (d, i) {
                dateSliderUpdate(new Date(d.Date));
            });

        const handle = slider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 8);

        function dateSliderStep() {
            dateSliderUpdate(x.invert(currentValue));
            currentValue = currentValue + (targetValue / (numDays * 5));
            if (currentValue > targetValue) {
                moving = false;
                playButton.attr("class", "not-playing");
                currentValue = 0;
                clearInterval(timer);
            }
        }

        function dateSliderUpdate(h, dragging = false) {
            // update position of slider
            handle.attr("cx", x(h));

            // update text of slider
            let oldDate = App.filters.date;
            let formattedDate = formatDate(h);
            label.text(formattedDate);
            App.filters.date = new Date(formattedDate);

            /*
            The next section was for showing the timeline event name while the play button was playing.
            In practice, the days pass too quickly to be able to read it. Also it was a little buggy.
            */

            /*
            // find name in events by date
            var matchedEvent = App.data.timeline_events.find(e => formatDate(e.Date) == formattedDate);
            if (matchedEvent) {
                // get matching tick and activate it
                slider.selectAll("[name='event_" + matchedEvent.Name+"']").classed("active", true )
                // update and show the tick label
                eventLabel.attr("visibility", "visible");
                eventLabel.text(matchedEvent.Name + " - " + formatDateIntoYear(matchedEvent.Date));
            } // check if there was a match yesterday, meaning we just left an event and should inactivate the tick and hide the label
            else if (App.data.timeline_events.find(e => formatDate(getDateAfterDays(e.Date,1)) === formattedDate))
            {
                eventTicks.classed("active", false );
                eventLabel.attr("visibility", "hidden");
            }
            */

            if (!datesAreOnSameDay(App.filters.date, oldDate)) {
                visualization.refresh(dragging);
            }


        }
    }
}