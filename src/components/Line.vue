<template>
  <v-container>
    <v-select
      v-model="selected"
      :items="items"
      item-value="value"
      item-text="label"
      dense
      solo
      @change="selectDataSet"
    ></v-select>
    <div id="gI" class="graph"></div>
    <v-btn
      fab
      dark
      color="blue"
      @click="saveAsPng()"
    >
      <v-icon dark>
        mdi-download
      </v-icon>
    </v-btn>
  </v-container>
</template>

<script>
import * as d3 from "d3";
import $ from "jquery";
import graphHelper from "@/helpers/graphHelper.js"

export default {
  data: () => ({
    items: [
      {
        label: "Apple",
        value: "apples",
      },
      {
        label: "Bananas",
        value: "bananas",
      },
    ],
    selected: "apples",
    graph: {},
    data: [
      {
        date: "2009-01-01T12:00:00Z",
        apples: 130,
        bananas: 40,
      },
      {
        date: "2010-01-01T12:00:00Z",
        apples: 137,
        bananas: 58,
      },
      {
        date: "2011-01-01T12:00:00Z",
        apples: 166,
        bananas: 97,
      },
      {
        date: "2012-01-01T12:00:00Z",
        apples: 154,
        bananas: 117,
      },
      {
        date: "2013-01-01T12:00:00Z",
        apples: 179,
        bananas: 98,
      },
      {
        date: "2014-01-01T12:00:00Z",
        apples: 187,
        bananas: 120,
      },
      {
        date: "2015-01-01T12:00:00Z",
        apples: 189,
        bananas: 84,
      },
    ],
  }),
  mounted() {
    // format date
    $.each(this.data, function(index, d) {
      //d.date = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z")(d.date); // assumes that the received time matches the local time zone
      let timeParse = d3.utcParse("%Y-%m-%dT%H:%M:%S%Z"); // assumes that the received time is UTC
      d.date = timeParse(d.date);
    });

    this.createChart("#gI");
  },
  methods: {
    saveAsPng(){
      graphHelper.saveAsPng(d3, "linechart");
    },
    createChart(div) {
      // set the dimensions and margins of the graph
      let margin = { top: 30, right: 30, bottom: 30, left: 30 },
        totalWidth = $(div).width(),
        totalHeight = $(div).height(),
        width = totalWidth - margin.left - margin.right,
        height = totalHeight - margin.top - margin.bottom;

      // append the svg object to the div
      this.graph.svg = d3
        .select(div)
        .append("svg")
        .attr("viewBox", [0, 0, totalWidth, totalHeight])
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // extent returns a pair with min and max date value
      let extent = d3.extent(this.data, (d) => d.date);

      // set data on X
      this.graph.x = d3
        .scaleTime()
        .domain([d3.timeYear.floor(extent[0]), d3.timeYear.floor(extent[1])]) //use floor of min and max so that there isn't a tick in X without data
        .nice()
        .range([0, width]);

      // create X axis
      let xAxis = (g) =>
        // set X axis at the bottom of the chart
        // default is at the top
        g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(this.graph.x)); //optional ".ticks(width / 80)" after axisBottom

      // add X axis to graph
      this.graph.svg
        .append("g")
        .attr("class", "x-axis")
        .call(xAxis);

      // set data on Y
      this.graph.y = d3
        .scaleLinear()
        .domain([
          d3.min(this.data, (d) => d.apples),
          d3.max(this.data, (d) => d.apples),
        ])
        .nice()
        .range([height - margin.bottom, margin.top]);

      // create Y axis
      let yAxis = d3.axisLeft(this.graph.y);

      // add Y axis to graph
      this.graph.svg
        .append("g")
        .attr("class", "y-axis")
        .call(yAxis);

      // add line to graph and set style
      this.graph.line = this.graph.svg
        .append("path")
        .datum(this.data)
        .attr("class", "apples-line")
        .attr(
          "d",
          d3
            .line()
            .defined((d) => !isNaN(d.apples))
            .x((d) => this.graph.x(d.date))
            .y((d) => this.graph.y(d.apples))
        );

      // add dots to graph and set style
      this.graph.dots = this.graph.svg
        .append("g")
        .selectAll("dot")
        .data(this.data)
        .enter()
        .append("circle")
        .attr("class", "apples-circle")
        .attr("cx", (d) => this.graph.x(d.date))
        .attr("cy", (d) => this.graph.y(d.apples))
        .attr("tooltip", (d) => d.apples)
        .attr("r", 6);

      this.createTooltip(div, ".apples-circle, .bananas-circle");
    },
    filterData(selectedGroup) {
      return this.data.map(function(d) {
        return { date: d.date, value: d[selectedGroup] };
      });
    },
    update(type) {
      let data = this.filterData(type);

      this.graph.y
        .domain([d3.min(data, (d) => d.value), d3.max(data, (d) => d.value)])
        .nice();

      this.graph.svg
        .selectAll(".y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(this.graph.y));

      this.graph.line
        .datum(data)
        .transition()
        .duration(1000)
        .attr("class", `${type}-line`)
        .attr(
          "d",
          d3
            .line()
            .defined((d) => !isNaN(d.value))
            .x((d) => this.graph.x(+d.date))
            .y((d) => this.graph.y(+d.value))
        );

      this.graph.dots
        .data(data)
        .transition()
        .duration(1000)
        .attr("class", `${type}-circle`)
        .attr("cx", (d) => this.graph.x(+d.date))
        .attr("cy", (d) => this.graph.y(+d.value))
        .attr("tooltip", (d) => d.value);
    },
    createTooltip(div, component) {
      let tooltip = d3
        .select(div)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      $(`${component}:visible`)
        .mouseover(function(d) {
          let target = d.target;

          // set text
          tooltip.html(`<div class="text">${$(target).attr("tooltip")}</div>`);

          let xTarget = $(target).position().left;
          let yTarget = $(target).position().top;
          let wTarget = target.getBBox().width;
          let hTarget = target.getBBox().height;

          let wTooltip = $(".tooltip").outerWidth();
          let hTooltip = $(".tooltip").outerHeight();

          // set position
          tooltip
            .style("left", `${xTarget + wTarget / 2 - wTooltip / 2}px`)
            .style("top", `${yTarget - hTarget / 2 - hTooltip}px`);

          // show tooltip
          tooltip
            .transition()
            .duration(100)
            .style("opacity", 1);
        })
        .mouseout(function() {
          // hide tooltip
          tooltip
            .transition()
            .duration(200)
            .style("opacity", 0);
        });
    },
    selectDataSet() {
      this.update(this.selected);
    },
  },
  beforeDestroy() {
    $(".tooltip").remove();
  },
};
</script>

<style>
.tooltip {
  position: absolute;
  width: auto;
  height: auto;
  padding: 0.5rem;
  background: lightgray;
  border-radius: 8px;
  pointer-events: none;
}
.tooltip > .text {
  font: 0.8rem sans-serif;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-align: center;
}
</style>

<style scoped>
.graph {
  width: 80vw;
  height: 40vh;
}
.graph >>> .apples-line {
  fill: none;
  stroke: rgb(145, 0, 0);
  stroke-width: 2;
}
.graph >>> .bananas-line {
  fill: none;
  stroke: rgb(255, 166, 0);
  stroke-width: 2;
}
.graph >>> .apples-circle {
  stroke: rgb(145, 0, 0);
  stroke-width: 2;
  fill: white;
}
.graph >>> .apples-circle:hover {
  stroke: white;
  fill: rgb(145, 0, 0);
}
.graph >>> .bananas-circle {
  stroke: rgb(255, 166, 0);
  stroke-width: 2;
  fill: white;
}
.graph >>> .bananas-circle:hover {
  stroke: white;
  fill: rgb(255, 166, 0);
}
</style>
