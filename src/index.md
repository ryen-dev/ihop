---
toc: false
sidebar: false
pager: false
# style: styles.css
---

<!-- import style sheet -->

<link rel="stylesheet" href="styles.css">
<div id="map-legend">
  <h3>Happiness Level Legend</h3>
  <div class="legend-item">
    <span class="legend-gradient"></span>
  <p id="legend-text">Low (${truncate(minHappy,1)}) to High (${truncate(maxHappy,1)})</p>  </div>
</div>
<button id="toggle-button"></button>
  <div id='console'>
    <div id='top-siderbar'>
      <h1>International Happiness</h1>
      <div class='session' id='sliderbar'>
        <h2>Year: <label id='active-year'>2015</label></h2>
        <input id='slider' class='row' type='range' min='2005' max='2022' step='1' value='2015' />
      </div>
      <div class='session' id='dataset'>
        <div id="toggle-radio">
        <h2>Dataset:</h2>
          <input type="radio" id="happiness-radio" name="map-type" checked>
          <label for="happiness-radio">Happiness Map</label><br>
          <input type="radio" id="mental-health-radio" name="map-type">
          <label for="mental-health-radio">Mental Health Map</label>
        </div>
      </div>
    </div>
    <div class='radar-wrapper'>
      <h2>Radar Graph:</h2>
      <div id="country-radar"> </div>
    </div>
    <div id='nav'>
      <a href="./about">About</a><br><br>
      <a href="./cartogram">Cartogram</a>
    </div>
  </div>
<div class="map-wrapper">
      <div id='map'></div>
    </div>

```js
function showHeroPopup() {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.classList.add("overlay");
  document.body.appendChild(overlay);

  // Create popup
  const heroPopup = document.createElement("div");
  heroPopup.classList.add("hero-popup");

  // Add hero content to the popup
  heroPopup.innerHTML = `
    <div class="hero-popup-content">
      <h1>hello. are <i>you</i> happy?</h1>
      <h2>Imagine a staircase, with steps numbered from 0 to 10. The top of these steps is <span style="color: #f4f444; -webkit-text-stroke-width: .1px; -webkit-text-stroke-color: black;">nirvana</span> whereas the bottom is literal <span style="color: #bf1515;">torture</span>. What step are you on? What step is everyone else on?</h2>
      <h2>Our objective with this visulization is to allow you to try and get a better understanding of what factors can play into happiness levels of a country</h2>
      <button id="close-hero-popup">Go</button>
    </div>
  `;

  document.body.appendChild(heroPopup);

  // Add event listener to close the popup when the close button is clicked
  const closeButton = document.getElementById("close-hero-popup");
  closeButton.addEventListener("click", function () {
    heroPopup.remove();
    overlay.remove(); // Remove overlay when closing popup
    // Set a cookie to indicate that the popup has been closed
    document.cookie =
      "heroPopupClosed=true; expires=Fri, 31 Dec 9999 23:59:59 GMT";
  });
}

// Function to check if the hero popup should be displayed based on the cookie
function checkHeroPopup() {
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const heroPopupCookie = cookies.find((cookie) =>
    cookie.startsWith("heroPopupClosed=")
  );

  if (!heroPopupCookie) {
    showHeroPopup();
  }
}

// Call the function to check and display the hero popup when the webpage is first opened
checkHeroPopup();
```

```js
var world_countries_geojson_with_happiness = FileAttachment(
  "./data/world_countries_geojson_with_mental_health.json"
).json();
var min_max = FileAttachment("./data/min_max.json").json();
```

```js
import { radar, blankRadar } from "./components/radar.js";
import { debounce } from "./components/debounce.js";
import { updateMapLayer } from "./components/updateMapLayer.js";
import { mapboxToken } from "./credentials.js";

var slider = document.getElementById("slider");
var radioButtons = document.getElementById("mental-toggle");
var activeYearLabel = document.getElementById("active-year");
var happinessRadio = document.getElementById("happiness-radio");
var mentalHealthRadio = document.getElementById("mental-health-radio");
var legendText = document.getElementById("legend-text");
// get current value from slider html element

var year = 2015;

var radarSize = 400;

let minHappy = min_max[year]["lifeladder"][0];
let maxHappy = min_max[year]["lifeladder"][1];

var currentSelected = world_countries_geojson_with_happiness.features[0];

var mentalData = false;
var activeRadarCountries = []; 

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/ryanmattt/clvkng9fz01by01ph6ciw4soh",
  center: [-40, 0],
  zoom: 1.4,
  projection: "equalEarth",
  pitchWithRotate: false,
  touchPitch: false,
  touchZoomRotate: false,
  dragRotate: false,
  attributionControl: false,
  accessToken:
    mapboxToken,
});
blankRadar(radarSize);

let hoveredPolygonId = null;

map.on("load", () => {
  map.addSource("states", {
    type: "geojson",
    data: world_countries_geojson_with_happiness,
  });

  map.addLayer({
    id: "state-fills",
    type: "fill",
    source: "states",
    layout: {},
    paint: {
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.5,
        1,
      ],
    },
  });
  updateMapLayer(year, min_max, mentalData, map, paintInProgress);

  // Debounce the slider input event listener
  const debouncedUpdateMapLayer = debounce(updateMapLayer, 25); // Adjust the delay (100ms in this example)

  // Add the debounced event listener to the slider
  slider.addEventListener("input", function (e) {
    year = parseInt(e.target.value);
    activeYearLabel.innerText = year;
    legendText.innerText = `Low (${truncate(min_max[year]["lifeladder"][0],1)}) High (${truncate(min_max[year]["lifeladder"][1],1)})`;
    debouncedUpdateMapLayer(year, min_max, mentalData, map, paintInProgress); // Update the map layer after a delay
  });

  happinessRadio.addEventListener("change", function () {
    if (happinessRadio.checked) {
      mentalData = false;
      slider.setAttribute("max", "2022");
      slider.setAttribute("min", "2005");
      year = Math.min(year, 2022);
      activeYearLabel.innerText = year;
      updateMapLayer(year, min_max, mentalData, map, paintInProgress);
      legendText.innerText = `Low (${truncate(min_max[year]["lifeladder"][0],1)}) High (${truncate(min_max[year]["lifeladder"][1],1)})`;
    debouncedUpdateMapLayer(year, min_max, mentalData, map, paintInProgress);
    }
  });

  mentalHealthRadio.addEventListener("change", function () {
    if (mentalHealthRadio.checked) {
      mentalData = true;
  //       let popupContent = document.getElementById("country-radar");

  // popupContent.innerHTML = "";

      slider.setAttribute("max", "2023");
      slider.setAttribute("min", "2021");
      year = Math.max(year, 2021);
      activeYearLabel.innerText = year;
      updateMapLayer(year, min_max, mentalData, map, paintInProgress);
      legendText.innerText = `Low (${40}) High (${100})`;
      debouncedUpdateMapLayer(year, min_max, mentalData, map, paintInProgress);
    }
  });

  var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    maxWidth: "auto",
    maxHeight: "auto",
  });

  map.on("mousemove", "state-fills", (e) => {
    if (e.features.length > 0) {
      if (hoveredPolygonId !== null) {
        map.setFeatureState(
          { source: "states", id: hoveredPolygonId },
          { hover: false }
        );
        map.getCanvas().style.cursor = "pointer";
      }
      hoveredPolygonId = e.features[0].id;
      var coordinates = e.lngLat;

      // Extract datapoints from feature properties
      var country_name = e.features[0].properties.name_long;
      var happinessString = e.features[0].properties.happiness_values;
      var happinessObj = JSON.parse(happinessString);
      if (!mentalData && happinessObj && happinessObj[year]) {
        var happiness_values = happinessObj[year];
        happiness_values["yearFrom"] = year;
        happiness_values.name = country_name;

        document.getElementById("country-radar").addEventListener("click", function (event) {
          activeRadarCountries = [];
          blankRadar(radarSize);
        });
        var plot = radar([...activeRadarCountries, happiness_values], min_max, radarSize);

        popup
          .setLngLat(coordinates)
          .setHTML(`<h3>${country_name}</h3>`)
          .addTo(map);
      } else if (
        mentalData &&
        e.features[0].properties.mentalhealth_values != undefined
      ) {
        popup
          .setLngLat(coordinates)
          .setHTML(`<h3>${country_name}</h3>`)
          .addTo(map);
      } else {
        popup
          .setLngLat(coordinates)
          .setHTML(`<h3>${country_name}</h3>No Data Available`)
          .addTo(map);
      }
      map.setFeatureState(
        { source: "states", id: hoveredPolygonId },
        { hover: true }
      );
    }
  });

  map.on("mouseleave", "state-fills", () => {
    if (hoveredPolygonId !== null) {
      map.setFeatureState(
        { source: "states", id: hoveredPolygonId },
        { hover: false }
      );

      map.getCanvas().style.cursor = "";
    }
    hoveredPolygonId = null;
    popup.remove();
  });


  map.on("click", "state-fills", (e) => {
  if (e.features.length > 0) {
    // Get the clicked feature
    let clickedFeature = e.features[0];
    let happinessValuesFeature = JSON.parse(clickedFeature.properties.happiness_values);
    if(happinessValuesFeature[year] === undefined) {
      return;
    }
    let happinessValues = happinessValuesFeature[year];
    happinessValues["yearFrom"] = year;
    happinessValues.name = clickedFeature.properties.name_long;

    // Check if the clicked feature reprersents a country
    if (clickedFeature.layer.id === "state-fills" && !activeRadarCountries.includes(happinessValues)) {
        activeRadarCountries.push(happinessValues);
      }
  }
});
});

let paintInProgress = false;



```

```js
var distanceFromLeft = "20.5vw";

const toggleButton = document.getElementById("toggle-button");
const consoleElement = document.getElementById("console");

toggleButton.addEventListener("click", function () {
  toggleButton.classList.toggle("open");
  consoleElement.classList.toggle("open");

  // If the sidebar is open, move it to the left, otherwise, move it off-screen to the left
  if (!consoleElement.classList.contains("open")) {
    consoleElement.style.left = "1vw";
    toggleButton.style.left = distanceFromLeft;
  } else {
    consoleElement.style.left = "-" + distanceFromLeft;
    toggleButton.style.left = ".5vw";
  }
});

// Close the console when clicking outside of it
document.addEventListener("click", function (event) {
  const isClickInsideConsole = consoleElement.contains(event.target);
  const isClickOnToggleButton = toggleButton.contains(event.target);

  if (isClickInsideConsole && isClickOnToggleButton) {
    toggleButton.classList.remove("open");
    consoleElement.classList.remove("open");
    consoleElement.style.left = "-" + distanceFromLeft;
    toggleButton.style.left = ".5vw";
  }
});

function truncate(num, digits) {
  var re = new RegExp("^-?\\d+(?:.\\d{0," + (digits || -1) + "})?");
  return num.toString().match(re)[0];
}

```

```js
```