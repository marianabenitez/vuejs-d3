<template>
  <v-container>
    <div class="chart-container"></div>
    <v-btn fab dark color="blue" @click="saveAsPng()">
      <v-icon dark>
        mdi-download
      </v-icon>
    </v-btn>
  </v-container>
</template>

<script>
// this OrgChart was adapted from https://bl.ocks.org/bumbeishvili/09a03b81ae788d2d14f750afe59eb7de
import * as d3 from "d3";
import graphHelper from "@/helpers/graphHelper.js";

export default {
  data: () => ({
    duration: 300,
    node: {
      width: 200,
      height: 175,
    },
    image: {
      width: 100,
      height: 100,
      rx: 100,
    },
    initialZoom: 1,
    allowZoom: true,
    grayscale: false,
    enableExpand: false,
    rendering: {},
    behaviors: {},
    data: [
      {
        id: "0bf326d0-3c9e-474a-a583-88f733a7cce5",
        parentId: null,
        imageUrl:
          "https://raw.githubusercontent.com/bumbeishvili/Assets/master/Projects/D3/Organization%20Chart/general.jpg",
        name: "Name One",
        jobTitle: "Job Title 1",
      },
      {
        id: "5a89746a-e26f-43e0-8675-e821c1924088",
        parentId: "0bf326d0-3c9e-474a-a583-88f733a7cce5",
        imageUrl:
          "https://raw.githubusercontent.com/bumbeishvili/Assets/master/Projects/D3/Organization%20Chart/general.jpg",
        name: "Name Two",
        jobTitle: "Job Title 2",
      },
      {
        id: "1517a3cc-9b9c-4c2b-ba8c-47b1e58ed4d0",
        parentId: "0bf326d0-3c9e-474a-a583-88f733a7cce5",
        imageUrl:
          "https://raw.githubusercontent.com/bumbeishvili/Assets/master/Projects/D3/Organization%20Chart/general.jpg",
        name: "Name Three",
        jobTitle: "Job Title 3",
      },
      {
        id: "8f805290-3c86-4a1c-aef7-0ef1faddd0fb",
        parentId: "1517a3cc-9b9c-4c2b-ba8c-47b1e58ed4d0",
        imageUrl:
          "https://raw.githubusercontent.com/bumbeishvili/Assets/master/Projects/D3/Organization%20Chart/general.jpg",
        name: "Name Four",
        jobTitle: "Job Title 4",
      },
    ],
  }),
  mounted() {
    this.createPatternify();
    this.createChart(this.data);
  },
  methods: {
    saveAsPng() {
      graphHelper.saveAsPng(d3, "orgchart");
    },
    createPatternify() {
      d3.selection.prototype.patternify = function(params) {
        let data = params.data || [params.selector];

        // Pattern in action
        let selection = this.selectAll(`.${params.selector}`).data(
          data,
          (d, i) => (typeof d === "object" && d.id ? d.id : i)
        );

        selection.exit().remove();

        selection = selection
          .enter()
          .append(params.tag)
          .merge(selection);

        selection.attr("class", params.selector);

        return selection;
      };
    },
    createChart(data) {
      //Drawing containers
      let container = d3.select(".chart-container");
      let containerRect = container.node().getBoundingClientRect();
      let width = containerRect.width;
      let height = containerRect.height;

      //Calculated properties
      this.rendering.depth = this.node.height + 60;
      this.rendering.centerX = width / 2;

      let vm = this;
      this.rendering.treemap = d3
        .tree()
        .size([width, height])
        .nodeSize([this.node.width, this.node.height])
        .separation(function(a, b) {
          return a.parent == vm.rendering.root && b.parent == vm.rendering.root
            ? 2
            : 1;
        });
      this.behaviors.zoom = d3.zoom().on("zoom", this.zoomed);

      //****************** ROOT node work ************************

      // if needed, use this to work with all nodes
      // let allNodes = this.rendering.treemap(this.rendering.root).descendants();
      // direct children = foreach (d) => d.children
      // all children = foreach (d) => d.descendants()

      this.rendering.root = d3
        .stratify()
        .id((d) => d.id)
        .parentId((d) => d.parentId)(data);
      this.rendering.root.x0 = 0;
      this.rendering.root.y0 = 0;

      if (this.enableExpand) {
        this.rendering.root.children.forEach(this.collapseAll);
        this.rendering.root.children.forEach(this.initialExpand);
      }

      //Add svg
      this.rendering.svg = container
        .patternify({
          tag: "svg",
          selector: "svg-chart-container",
        })
        .attr("width", width)
        .attr("height", height)
        .call(this.behaviors.zoom)
        .attr("cursor", this.allowZoom ? "move" : "default");

      //Add container g element
      this.rendering.chart = this.rendering.svg.patternify({
        tag: "g",
        selector: "chart",
      });

      this.rendering.centerG = this.rendering.chart
        .patternify({
          tag: "g",
          selector: "center-group",
        })
        .attr(
          "transform",
          `translate(${this.rendering.centerX},${this.node.height}) scale(${this.initialZoom})`
        );

      if (this.behaviors.lastTransform) {
        this.behaviors.zoom
          .scaleBy(this.rendering.chart, this.behaviors.lastTransform.k)
          .translateTo(
            this.rendering.chart,
            this.behaviors.lastTransform.x,
            this.behaviors.lastTransform.y
          );
      }

      this.applyFilters();

      // Display tree contents
      this.renderData(this.rendering.root);
    },
    applyFilters() {
      let filterDefs = this.rendering.svg.patternify({
        tag: "defs",
        selector: "filter-defs",
      });

      let filter = filterDefs
        .patternify({ tag: "filter", selector: "shadow-filter-element" })
        .attr("y", `${-50}%`)
        .attr("x", `${-50}%`)
        .attr("height", `${200}%`)
        .attr("width", `${200}%`);

      filter
        .patternify({
          tag: "feGaussianBlur",
          selector: "feGaussianBlur-element",
        })
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 3.1)
        .attr("result", "blur");

      filter
        .patternify({ tag: "feOffset", selector: "feOffset-element" })
        .attr("in", "blur")
        .attr("result", "offsetBlur")
        .attr("dx", 4.28)
        .attr("dy", 4.48)
        .attr("x", 8)
        .attr("y", 8);

      filter
        .patternify({ tag: "feFlood", selector: "feFlood-element" })
        .attr("in", "offsetBlur")
        .attr("flood-color", "black")
        .attr("flood-opacity", 0.3)
        .attr("result", "offsetColor");

      filter
        .patternify({ tag: "feComposite", selector: "feComposite-element" })
        .attr("in", "offsetColor")
        .attr("in2", "offsetBlur")
        .attr("operator", "in")
        .attr("result", "offsetBlur");

      let feMerge = filter.patternify({
        tag: "feMerge",
        selector: "feMerge-element",
      });

      feMerge
        .patternify({ tag: "feMergeNode", selector: "feMergeNode-blur" })
        .attr("in", "offsetBlur");

      feMerge
        .patternify({ tag: "feMergeNode", selector: "feMergeNode-graphic" })
        .attr("in", "SourceGraphic");
    },
    renderData(source) {
      //  Assigns the x and y position for the nodes
      let treeData = this.rendering.treemap(this.rendering.root);

      // Get tree nodes and links
      let nodes = treeData.descendants();
      let links = treeData.descendants().slice(1);

      // Set constant depth for each nodes
      nodes.forEach((d) => (d.y = d.depth * this.rendering.depth));

      //#region [ Filters ]

      let defs = this.rendering.svg.patternify({
        tag: "defs",
        selector: "image-defs",
      });

      let patternsSelection = defs
        .selectAll(".pattern")
        .data(nodes, (d) => d.id);

      let patternEnterSelection = patternsSelection.enter().append("pattern");

      let patterns = patternEnterSelection
        .merge(patternsSelection)
        .attr("class", "pattern")
        .attr("height", 1)
        .attr("width", 1)
        .attr("id", (d) => d.id);

      patterns
        .patternify({
          tag: "image",
          selector: "pattern-image",
          data: (d) => [d],
        })
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", this.image.width)
        .attr("height", this.image.height)
        .attr("xlink:href", (d) => d.data.imageUrl)
        .attr(
          "viewbox",
          () => `0 0 ${this.image.width * 2} ${this.image.height}`
        )
        .attr("preserveAspectRatio", "xMidYMin slice")
        .attr("class", this.grayscale ? "grayscale" : "colorful");

      patternsSelection
        .exit()
        .transition()
        .duration(this.duration)
        .remove();

      //#endregion [ Filters ]

      //#region [ Links ]

      // Update the links...
      let linkSelection = this.rendering.centerG
        .selectAll("path.link")
        .data(links, (d) => d.id);

      // Enter any new links at the parent's previous position.
      let linkEnter = linkSelection
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("d", () => {
          let o = {
            x: source.x0,
            y: source.y0,
          };
          return this.drawLinks(o, o);
        });

      // UPDATE
      let linkUpdate = linkEnter.merge(linkSelection);

      // Styling links
      linkUpdate.attr("class", "link");

      // Transition back to the parent element position
      linkUpdate
        .transition()
        .duration(this.duration)
        .attr("d", (d) => this.drawLinks(d, d.parent));

      // Remove any exiting links
      linkSelection
        .exit()
        .transition()
        .duration(this.duration)
        .attr("d", () => {
          let o = {
            x: source.x,
            y: source.y,
          };
          return this.drawLinks(o, o);
        })
        .remove();

      //#endregion [ Links ]

      //#region [ Nodes ]

      // Updating nodes
      let nodesSelection = this.rendering.centerG
        .selectAll("g.node")
        .data(nodes, (d) => d.id);

      // Enter any new nodes at the parent's previous position.
      let nodeEnter = nodesSelection
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", () => `translate(${source.x0},${source.y0})`)
        .attr("cursor", "default")
        .on("click", (d) => {
          this.onNodeClick(d3.select(d.target).data()[0].data.id);
          if ([...d.target.classList].includes("node-button-circle")) {
            return;
          }
        });

      // Add rectangle for the nodes
      nodeEnter
        .patternify({
          tag: "rect",
          selector: "node-rect",
          data: (d) => [d],
        })
        .attr("width", 1e-6)
        .attr("height", 1e-6);

      // Add foreignObject element
      let fo = nodeEnter
        .patternify({
          tag: "foreignObject",
          selector: "node-foreign-object",
          data: (d) => [d],
        })
        .style("width", `${this.node.width}px`)
        .style("height", `${this.node.height}px`)
        .attr("x", -(this.node.width / 2))
        .attr("y", -(this.node.height / 1.75));

      // Add foreign object
      fo.patternify({
        tag: "xhtml:div",
        selector: "node-foreign-object-div",
        data: (d) => [d],
      })
        .style("width", `${this.node.width}px`)
        .style("height", `${this.node.height}px`)
        .style("grid-template-rows", `${this.image.height}px auto auto`)
        .html(
          (
            d
          ) => `<div style="grid-row-start: 2; margin-top: auto;"><b>${d.data.name}</b></div>
          <div style="grid-row-start: 3; margin-bottom: auto;">${d.data.jobTitle}</div>`
        );

      // Node images
      let nodeImageGroups = nodeEnter.patternify({
        tag: "g",
        selector: "node-image-group",
        data: (d) => [d],
      });

      // Node image rectangle
      nodeImageGroups.patternify({
        tag: "rect",
        selector: "node-image-rect",
        data: (d) => [d],
      });

      if (this.enableExpand) {
        // Node button circle group
        let nodeButtonGroups = nodeEnter
          .patternify({
            tag: "g",
            selector: "node-button-g",
            data: (d) => [d],
          })
          .on("click", this.click);

        // Add button circle
        nodeButtonGroups.patternify({
          tag: "circle",
          selector: "node-button-circle",
          data: (d) => [d],
        });

        // Add button text
        nodeButtonGroups
          .patternify({
            tag: "text",
            selector: "node-button-text",
            data: (d) => [d],
          })
          .attr("pointer-events", "none");
      }

      // Node update styles
      let nodeUpdate = nodeEnter
        .merge(nodesSelection)
        .style("font", "12px sans-serif");

      // Transition to the proper position for the node
      nodeUpdate
        .transition()
        .attr("opacity", 0)
        .duration(this.duration)
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .attr("opacity", 1);

      // Move images to desired positions
      nodeUpdate
        .selectAll(".node-image-group")
        .attr(
          "transform",
          () => `translate(${-this.image.width / 2},${-this.image.height})`
        );

      nodeUpdate
        .select(".node-image-rect")
        .attr("fill", (d) => `url(#${d.id})`)
        .attr("width", this.image.width)
        .attr("height", this.image.height)
        .attr("rx", this.image.rx);

      // Update  node attributes and style
      nodeUpdate
        .select(".node-rect")
        .attr("width", this.node.width)
        .attr("height", this.node.height)
        .attr("x", -(this.node.width / 2))
        .attr("y", -(this.node.height / 1.75))
        .attr("cursor", "default");

      // Move node button group to the desired position
      nodeUpdate
        .select(".node-button-g")
        .attr(
          "transform",
          () => `translate(0,${Math.ceil(this.node.height / 1.95)})`
        )
        .attr("opacity", (d) => (d.children || d._children ? 1 : 0));

      // Restyle node button circle
      nodeUpdate.select(".node-button-circle").attr("r", 16);

      // Restyle texts
      nodeUpdate
        .select(".node-button-text")
        .attr("transform", "translate(-6,6)")
        .text((d) => (d.children ? "-" : "+"));

      // Remove any exiting nodes
      let nodeExitTransition = nodesSelection
        .exit()
        .attr("opacity", 1)
        .transition()
        .duration(this.duration)
        .attr("transform", () => `translate(${source.x},${source.y})`)
        .on("end", function() {
          d3.select(this).remove();
        })
        .attr("opacity", 0);

      // On exit reduce the node rects size to 0
      nodeExitTransition
        .selectAll(".node-rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", 0)
        .attr("y", 0);

      // On exit reduce the node image rects size to 0
      nodeExitTransition
        .selectAll(".node-image-rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", this.node.width / 2)
        .attr("y", this.node.height / 2);

      // Store the old positions for transition.
      nodes.forEach((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      //#endregion [ Nodes ]
    },
    click(event) {
      let node = d3.select(event.explicitOriginalTarget).data()[0];
      if (node.children) {
        node._children = node.children;
        node.children = null;
      } else {
        node.children = node._children;
        node._children = null;
      }
      this.renderData(node);
    },
    zoomed(target) {
      if (!this.allowZoom) return;

      let transform = target.transform;
      this.behaviors.lastTransform = transform;
      this.rendering.chart.attr("transform", transform);
    },
    collapseAll(node) {
      if (node.children) {
        node._children = node.children;
        node._children.forEach(this.collapseAll);
        node.children = null;
      }
    },
    initialExpand(node) {
      let parent = node.parent;
      if (!parent) {
        if (parent._children) {
          parent.children = parent._children;
          parent._children = null;
        }
      }
    },
    drawLinks(source, target) {
      let x = source.x;
      let y = source.y;
      let ex = target.x;
      let ey = target.y;

      let xrvs = ex - x < 0 ? -1 : 1;
      let yrvs = ey - y < 0 ? -1 : 1;

      let rdef = 35;
      let r = Math.abs(ex - x) / 2 < rdef ? Math.abs(ex - x) / 2 : rdef;

      r = Math.abs(ey - y) / 2 < r ? Math.abs(ey - y) / 2 : r;

      let h = Math.abs(ey - y) / 2 - r;
      let w = Math.abs(ex - x) - r * 2;
      //w=0;
      let path = `
            M ${x} ${y}
            L ${x} ${y + h * yrvs}
            L ${x} ${y + h * yrvs + r * yrvs}
            L ${x + w * xrvs + r * xrvs} ${y + h * yrvs + r * yrvs}
            L ${ex}  ${y + h * yrvs + r * yrvs}
            L ${ex} ${ey}`;

      return path;
    },
    onNodeClick(d) {
      console.log(d);
    },
  },
};
</script>

<style scoped>
.chart-container {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  overflow: hidden;
}
.chart-container >>> .svg-chart-container {
  display: inline-block;
  position: relative;
  width: 100%;
  height: 100%;
  background-color: white;
}
.chart-container >>> .link {
  stroke: rgb(26, 26, 26);
  stroke-width: 1.5;
  fill: none;
}
.chart-container >>> .node-rect {
  fill: white;
}
.chart-container >>> .node-button-circle {
  fill: white;
  stroke: rgb(26, 26, 26);
  stroke-width: 1.5;
}
.chart-container >>> .node-button-text {
  color: rgb(26, 26, 26);
  font-size: 16pt;
  font-weight: bold;
  font-family: "Courier New", Courier, monospace;
}
.chart-container >>> .node-foreign-object-div {
  display: grid;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 12pt;
}
.chart-container >>> .grayscale {
  -webkit-filter: grayscale(100%); /* Safari 6.0 - 9.0 */
  filter: grayscale(100%);
}
</style>
