import { saveSvgAsPng } from "save-svg-as-png";

var graphHelper = (function() {
  return {
    // adapted from https://jsfiddle.net/c19664p3/10/
    saveAsPng: function(d3, fileName) {
      let styles = getCSSStyles();
      let d3Select = "";

      if (styles) d3Select = [Object.keys(styles)].join();

      if (d3Select) {
        // add CSS inline to each element based on their class
        d3.selectAll(d3Select).each(function() {
          handleInlineCSS(this, styles, true);
        });
      }

      let options = {
        backgroundColor: "#ffffff",
        canvg: window.canvg, // IE & Edge
      };

      saveSvgAsPng(d3.select("svg").node(), `${fileName}.png`, options).then(
        () => {
          //clear inline CSS from each element based on their class
          if (d3Select) {
            d3.selectAll(d3Select).each(function() {
              handleInlineCSS(this, styles, false);
            });
          }
        }
      );

      function getCSSStyles() {
        let selectorList = [];

        // main svg node
        let parent = d3.select("svg").node();

        // add parent classes to the list
        selectorList = getClasses(parent.classList, selectorList);

        // add children classes to the list
        let children = parent.getElementsByTagName("*");
        for (let i = 0; i < children.length; i++) {
          selectorList = getClasses(children[i].classList, selectorList);
        }

        // return a map with classes and their respective properties and values
        return extractClassCSS(selectorList);
      }

      function getClasses(classes, selectorList) {
        if (!selectorList) selectorList = [];

        for (let c = 0; c < classes.length; c++) {
          if (!contains(`.${classes[c]}`, selectorList))
            selectorList.push(`.${classes[c]}`);
        }

        return selectorList;
      }

      function contains(str, arr) {
        return arr.indexOf(str) === -1 ? false : true;
      }

      function handleInlineCSS(element, styles, add) {
        // all element's classes
        let classArray = element.classList;

        for (let i = 0; i < classArray.length; i++) {
          let index = Object.keys(styles).indexOf(`.${classArray[i]}`);

          // check if the style map has that class
          if (index != -1) {
            let className = Object.keys(styles)[index];

            // get all props and values from class
            let props = styles[className];

            let iterator = props.keys();
            let prop = iterator.next().value;

            // go through each of them to set inline CSS in the element
            while (prop) {
              if (add) {
                let val = props.get(prop);
                element.style[prop] = val;
              } else {
                element.style.removeProperty(prop);
              }
              prop = iterator.next().value;
            }
          }
        }
      }

      function extractClassCSS(selectorList) {
        let rules = [];

        for (let i = 0; i < document.styleSheets.length; i++) {
          let s = document.styleSheets[i];

          try {
            if (!s.cssRules) continue;
          } catch (e) {
            if (e.name !== "SecurityError") throw e; // for Firefox
            continue;
          }

          let cssRules = s.cssRules;
          for (let r = 0; r < cssRules.length; r++) {
            try {
              let classArray = cssRules[r].selectorText.split(" ");

              for (let i = 0; i < classArray.length; i++) {
                if (contains(classArray[i], selectorList)) {
                  //get style props and values
                  let properties = cssRules[r].cssText
                    .split("{")[1]
                    .split("}")[0]
                    .trim()
                    .split(";");

                  // create Map of [prop] = value
                  let styles = new Map();
                  for (let j = 0; j < properties.length; j++) {
                    let prop = properties[j].split(":")[0];
                    let val = properties[j].split(":")[1];
                    if (prop) styles.set(prop.trim(), val.trim());
                  }

                  // set style Map to class name
                  rules[classArray[i]] = styles;
                }
              }
            } catch (e) {
              continue; //suppress error
            }
          }
        }

        return rules;
      }
    },
  };
})();

export default graphHelper;
