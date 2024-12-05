// import mapboxgl from "npm:mapbox-gl";

export function updateMapLayer(year, min_max, mentalData, map, paintInProgress) {
  
  if (!paintInProgress) {
    paintInProgress = true;

    let paintColors;

    if (!mentalData) {
      const [minHappy, maxHappy] = min_max[year]["lifeladder"];
      paintColors = [
        "case",
        [
          "all",
          ["has", "happiness_values"],
          ["has", String(year), ["get", "happiness_values"]],
        ],
        [
          "interpolate",
          ["linear"],
          [
            "get",
            "lifeladder",
            ["get", String(year), ["get", "happiness_values"]],
          ],
          minHappy,
          "#a50026",
          (minHappy + maxHappy) / 2,
          "#ffffbf",
          maxHappy,
          "#006837",
        ],
        "#FFFFFF",
      ];
    } else {
      paintColors = [
        "case",
        [
          "all",
          ["has", "mentalhealth_values"],
          ["has", String(year), ["get", "mentalhealth_values"]],
        ],
        [
          "interpolate",
          ["linear"],
          [
            "get",
            "Mental_Health_Quotient",
            ["get", String(year), ["get", "mentalhealth_values"]],
          ],
          40,
          "#a50026",
          70,
          "#ffffbf",
          100,
          "#006837",
        ],
        "#FFFFFF",
      ];
    }

    // Apply the paint colors to the map layer
    map.setPaintProperty("state-fills", "fill-color", paintColors);

    // Reset the flag asynchronously after a short delay
    setTimeout(() => {
      paintInProgress = false;
    }, 50); // Adjust the delay as needed
  }
}
