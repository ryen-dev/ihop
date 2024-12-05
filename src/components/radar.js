import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import { html } from "npm:htl";

export function blankRadar(size) {
  

  let popupContent = document.getElementById("country-radar");
  if (!popupContent) {
    popupContent = document.createElement("div");
    popupContent.id = "country-radar";
    document.body.appendChild(popupContent);
  }


  const plotContainer = document.createElement("div");
  plotContainer.style.width = size;
  plotContainer.style.height = size;

  // Clear previous content of the container
  popupContent.innerHTML = "<br>";

  popupContent.appendChild(plotContainer);

  const plot = Plot.plot({
    width: size,
    height: size,
    projection: {
      type: "azimuthal-equidistant",
      rotate: [0, -90],
      // Note: 0.625° corresponds to max. length (here, 0.5), plus enough room for the labels
      domain: d3.geoCircle().center([0, 90]).radius(0.625)(),
    },
    color: { legend: true },
    marks: [
      // grey discs
      Plot.geo([0.5, 0.4, 0.3, 0.2, 0.1], {
        geometry: (r) => d3.geoCircle().center([0, 90]).radius(r)(),
        stroke: "black",
        fill: "black",
        strokeOpacity: 0.3,
        fillOpacity: 0.03,
        strokeWidth: 0.5,
      }),
    ]
  });

  plotContainer.appendChild(plot);
}

export function radar(country_objects, min_max, size) {
  let scaledValues = scaleObjectValues(country_objects, min_max);
  
  let points = scaledValues.flatMap(({ name, year, ...values }) =>
    Object.entries(values).map(([key, value]) => ({
      name: `${name} ${year}`,
      key,
      value,
    }))
  );
  let longitude = d3
    .scalePoint(new Set(Plot.valueof(points, "key")), [180, -180])
    .padding(0.5)
    .align(1);


  let popupContent = document.getElementById("country-radar");
  if (!popupContent) {
    popupContent = document.createElement("div");
    popupContent.id = "country-radar";
    document.body.appendChild(popupContent);
  }


  const plotContainer = document.createElement("div");
  plotContainer.style.width = size;
  plotContainer.style.height = size;

  // Clear previous content of the container
  popupContent.innerHTML = "";

  popupContent.appendChild(plotContainer);


  const plot = Plot.plot({
    width: size,
    height: size,
    projection: {
      type: "azimuthal-equidistant",
      rotate: [0, -90],
      // Note: 0.625° corresponds to max. length (here, 0.5), plus enough room for the labels
      domain: d3.geoCircle().center([0, 90]).radius(0.625)(),
    },
    color: { legend: true },
    marks: [
      // grey discs
      Plot.geo([0.5, 0.4, 0.3, 0.2, 0.1], {
        geometry: (r) => d3.geoCircle().center([0, 90]).radius(r)(),
        stroke: "black",
        fill: "black",
        strokeOpacity: 0.3,
        fillOpacity: 0.03,
        strokeWidth: 0.5,
      }),

      // white axes
      Plot.link(longitude.domain(), {
        x1: longitude,
        y1: 90 - 0.57,
        x2: 0,
        y2: 90,
        stroke: "white",
        strokeOpacity: 0.5,
        strokeWidth: 2.5,
      }),

      // axes labels
      Plot.text(longitude.domain(), {
        x: longitude,
        y: 90 - 0.57,
        text: Plot.identity,
        lineWidth: 5,
        fontSize: 11,
      }),

      // areas
      Plot.area(points, {
        x1: ({ key }) => longitude(key),
        y1: ({ value }) => 90 - value,
        x2: 0,
        y2: 90,
        fill: "name",
        stroke: "name",
        curve: "cardinal-closed",
        fillOpacity: 0.1,
      }),

      // points
      Plot.dot(points, {
        x: ({ key }) => longitude(key),
        y: ({ value }) => 90 - value,
        fill: "name",
        stroke: "white",
      }),

      // interactive labels
      Plot.text(
        points,
        Plot.pointer({
          x: ({ key }) => longitude(key),
          y: ({ value }) => 90 - value,
          text: (d) => `${truncate(d.value,3)}`,
          textAnchor: "start",
          dx: 4,
          fill: "black",
          stroke: "white",
          maxRadius: 10,
          fontSize: 20,
        })
      ),

      // interactive opacity on the areas
      () => html`style>
        g[aria-label=area] path {fill-opacity: 0.1; transition: fill-opacity .2s;}
        g[aria-label=area]:hover path:not(:hover) {fill-opacity: 0.05; transition: fill-opacity .2s;}
        g[aria-label=area] path:hover {fill-opacity: 0.3; transition: fill-opacity .2s;}
      </style>`,
    ],
  });

  plotContainer.appendChild(plot);
}

function scaleObjectValues(country, min_max) {
  let min_max_active = min_max["2005"];
  let min = 0;
  let max = 0.54;
  let scalingRules = {
    "Log GDP per capita": [
      min_max_active["Log GDP per capita"][0],
      min_max_active["Log GDP per capita"][1],
    ],
    "Social Support": [
      min_max_active["Social Support"][0],
      min_max_active["Social Support"][1],
    ],
    "Life Expectancy": [
      min_max_active["Life Expectancy"][0],
      min_max_active["Life Expectancy"][1],
    ],
    "Freedom in Life Choices": [
      min_max_active["Freedom in Life Choices"][0],
      min_max_active["Freedom in Life Choices"][1],
    ],
    "Perceived Corruption": [
      min_max_active["Perceived Corruption"][0],
      min_max_active["Perceived Corruption"][1],
    ],
    "Positive Weight": [
      min_max_active["Positive Weight"][0],
      min_max_active["Positive Weight"][1],
    ],
    "Negative Weight": [
      min_max_active["Negative Weight"][0],
      min_max_active["Negative Weight"][1],
    ],
    "lifeladder": [
      0,
      10
    ]
  };

  // Function to scale a single value
  function scaleValue(value, min, max, newMin, newMax) {
    return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
  }

  // Iterate over each element in the array
  return country.map((obj) => {

      let outputObj = {};
      outputObj.name = obj.name;
      outputObj.year = obj.year;
    // Iterate over each property in the object
    for (let key in obj) {
        min_max_active = min_max[obj.year];
      // Check if the property is in the scaling rules
      if (scalingRules.hasOwnProperty(key)) {
        let [localMin, localMax] = scalingRules[key];
        // Scale the value
        outputObj[key] = Math.abs(scaleValue(obj[key], localMin, localMax, min, max));
      }
    }

    return outputObj;
  });

}



function truncate(num, digits) {
  var re = new RegExp("^-?\\d+(?:.\\d{0," + (digits || -1) + "})?");
  return num.toString().match(re)[0];
}