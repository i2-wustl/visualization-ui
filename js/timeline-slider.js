class timelineSlider {
    __moving = false;
    formatDateIntoYear = d3.timeFormat("%m/%d/%y");
    formatDate = d3.timeFormat("%B %d, %Y");
    numDays;
    currentValue = 0;
    targetValue;
    timer;
    x;
    dateLabel;
    handle;
    trackProgress;
    cohortGroups;
    eventLabel;
    playButton;


    init = function () {
        let timelineSlider = this;

        const [startDate, endDate] = d3.extent(App.data.patients, d => d.SAMPLE_COLLECTION_DATE);

        const margin = { top: 5, right: 10, bottom: 5, left: 10 },
            width = 320 - margin.left - margin.right,
            height = 52 - margin.top - margin.bottom;

        const svg = d3.select("#vis")
            .append("svg")
            .attr("width", "320px")
            .attr("height", height);

        this.targetValue = width;

        this.numDays = daysBetween(startDate, endDate);

        console.log(startDate, endDate, this.numDays)

        this.playButton = d3.select("#timeline-play");

        this.playButton.on("click", function () {
            const button = d3.select("#timeline-play");
            if (button.attr("class") === "playing") {
                timelineSlider.pauseSlider();
                clearInterval(timelineSlider.timer);
            } else {
                button.attr("class", "playing");
                timelineSlider.__moving = true;
                timelineSlider.timer = setInterval(timelineSlider.dateSliderStep, 50, timelineSlider, 0.2);
            }
        });

        d3.select("#timeline-back-one-day").on("click", function () {
            const button = d3.select("#timeline-play");
            if (button.attr("class") === "playing") {
                timelineSlider.pauseSlider();
                clearInterval(timelineSlider.timer);
            }
            timelineSlider.dateSliderStep(timelineSlider, -1);
        });

        d3.select("#timeline-forward-one-day").on("click", function () {
            const button = d3.select("#timeline-play");
            if (button.attr("class") === "playing") {
                timelineSlider.pauseSlider();
                clearInterval(timelineSlider.timer);
            }
            timelineSlider.dateSliderStep(timelineSlider, 1);
        });

        this.x = d3.scaleTime()
            .domain([startDate, endDate])
            .range([0, this.targetValue])
            .clamp(true);

        const slider = svg.append("g")
            .attr("class", "slider")
            .attr("transform", "translate(" + margin.left + "," + 32 + ")");

        this.dateLabel = slider.append("text")
            .attr("class", "label")
            .attr("id", "dateFilter")
            .attr("x", this.targetValue / 2)
            .attr("text-anchor", "middle")
            .text(this.formatDate(startDate))
            .attr("transform", "translate(0," + (-10) + ")");

        this.trackProgress = slider.append("line")
            .attr("class", "track")
            .attr("x1", this.x.range()[0])
            .attr("x2", this.x.range()[1])
            .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-inset")
            .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-progress");

        this.trackProgress.select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-overlay")
            .call(d3.drag()
                .on("start.interrupt", function () {
                    slider.interrupt();
                    timelineSlider.currentValue = Math.max(0, d3.event.x);
                    timelineSlider.dateSliderUpdate(timelineSlider.x.invert(timelineSlider.currentValue));
                })
                .on("drag", function () {
                    timelineSlider.currentValue = Math.max(0, d3.event.x);
                    timelineSlider.dateSliderUpdate(timelineSlider.x.invert(timelineSlider.currentValue), true);
                })
            );

        this.trackProgress.attr("x2", this.x.range()[0]);

        const infoBanner = d3.select("#vis").append("div").attr("class", "timeline-info-banner");

        this.eventLabel = infoBanner.append("p")
            .attr("class", "timeline-event-label")
            .attr("text-anchor", "middle")
            .text("null")
            .style("display", "none");

        this.cohortGroups = infoBanner.append("div").attr("visibility", "visible");

        for (const key in App.params.patients) {
            const cohortGroupContainer = this.cohortGroups.append("span")
                .attr("id",  key.replace("+","") + "-timeline-cohort-container")
                .attr("class", "timeline-cohort-container");

            cohortGroupContainer.append("svg")
                .attr("height", "12px")
                .attr("width", "12px")
                .append("circle")
                .attr("cx", 6)
                .attr("cy", 6)
                .attr("r", 4)
                .attr("fill", App.params.patients[key].fill);
            cohortGroupContainer.append("p")
                .attr("id", key.replace("+","") + "-timeline-label")
                .attr("class", "timeline-cohort-label")
                .attr("text-anchor", "middle")
                .text(App.data.filtered_patients.filter(d => d.COHORT === key).length)
        }


        slider.selectAll("timeline-event")
            .data(App.data.timeline_events)
            .enter()
            .append("line")
            .attr("class", "timeline-event")
            .attr("x1", d => (timelineSlider.x(new Date(d.Date)) + timelineSlider.x(getDateAfterDays(d.Date, 1))) / 2)
            .attr("x2", d => (timelineSlider.x(new Date(d.Date)) + timelineSlider.x(getDateAfterDays(d.Date, 1))) / 2)
            .attr("y1", -4)
            .attr("y2", 4)
            .attr("name", d => "event_" + d.Name)
            .on("mouseover", function (d, i) {
                d3.select(this).classed("active", true);
                timelineSlider.eventLabel.text(d.Name + " - " + timelineSlider.formatDateIntoYear(d.Date));
                timelineSlider.toggleInfoBanner(false);
            })
            .on("mouseout", function (d, i) {
                d3.select(this).classed("active", false);
                timelineSlider.toggleInfoBanner(true);
            }).on("click", function (d, i) {
            this.dateSliderUpdate(new Date(d.Date));
        });

        this.handle = slider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 8);
    };

    toggleInfoBanner = function (cohortVisible) {
        this.eventLabel.style("display", cohortVisible ? "none" : "inline");
        this.cohortGroups.style("display", cohortVisible ? "inline" : "none");
    };

    dateSliderStep = function (timelineSlider, stepSizeDays) {
        // needs that small offset to avoid landing on date boundaries which caused the day to not change
        timelineSlider.currentValue = 1e-3 + timelineSlider.currentValue + (timelineSlider.targetValue * stepSizeDays / timelineSlider.numDays);
        // keep the value within the acceptable range
        timelineSlider.currentValue = Math.min(timelineSlider.targetValue, Math.max(0, timelineSlider.currentValue));
        timelineSlider.dateSliderUpdate(timelineSlider.x.invert(timelineSlider.currentValue));
        if (timelineSlider.currentValue > timelineSlider.targetValue) {
            timelineSlider.__moving = false;
            timelineSlider.playButton.attr("class", "not-playing");
            timelineSlider.currentValue = 0;
            clearInterval(timelineSlider.timer);
        }
    };

    dateSliderUpdate = function (h, dragging = false) {
        // update position of slider
        let xPos = this.x(h), xStartPos;
        this.handle.attr("cx", xPos);

        this.trackProgressUpdate(xPos);

        // update text of slider
        let oldDate = App.filters.date;
        let formattedDate = this.formatDate(h);
        this.dateLabel.text(formattedDate);
        App.filters.date = new Date(formattedDate);

        if (!datesAreOnSameDay(App.filters.date, oldDate)) {
            visualization.refresh(dragging);
        }
    };

    refresh = function() {
        for (const key in App.params.patients) {
            this.cohortGroups
                .select("#" + key.replace("+","") + "-timeline-label")
                .text(App.data.filtered_patients.filter(d => d.COHORT === key).length)
            this.cohortGroups
                .select("#" + key.replace("+","") + "-timeline-cohort-container")
                .style("display", App.filters.cohorts.has(key) ? "inline" : "none");
        }
        this.trackProgressUpdate(false);
    }

    trackProgressUpdate = function(moving = true) {
        const t = d3.transition().duration(moving ? 0 : 250);
        let xPos = this.handle.attr("cx"), xStartPos;

        switch (App.filters.cases) {
            case cases.TOTAL:
                xStartPos = 0;
                break;
            case cases.NEW:
                xStartPos = xPos;
                break;
            case cases.WITHIN_X_DAYS:
                let activeThreshold = getDateAfterDays(this.x.invert(xPos), -App.filters.withXDaysValue)
                xStartPos = this.x(activeThreshold);
                break;
            default:
        }

        this.trackProgress
            .call(lines => lines.transition(t)
            .attr("x1", xStartPos)
            .attr("x2", xPos));
    }

    pauseSlider = function() {
        d3.select("#timeline-play").attr("class", "not-playing");
        timelineSlider.__moving = false;
    }
}



