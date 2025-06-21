"use strict";

const stats = await d3.json("../res/stats.json")
const map = await d3.json("../res/florida.json")

const map_el = document.querySelector("#map")
const graph_el = document.querySelector("#graph")

const counties = stats.filter(d => !(d["region"] == "Florida" || d["region"] == "USA"))
const florida = stats.filter(d => d["region"] == "Florida")
const usa = stats.filter(d => d["region"] == "USA")

const years = florida.map(d => String(d["year"]))
const names = [... new Set(counties.map(d => d["region"]))]

const counties_by_year = {}
for (const year of years) {
   counties_by_year[year] = {}
   for (const name of names) {
      const temp = counties.filter(d => d["year"] == year && d["region"] == name)
      const [endorsements, population] = [temp[0]["endorsements"], temp[0]["population"]]
      counties_by_year[year][name] = {endorsements, population}
   }
}

/*
# endorsements per county
# population per county
# endorsements per county / population per county %
# endorsements per county / population per state %
# endorsements per county / endorsements per state %
# population per county / population per state %
*/

const counties_by_name = {}
for (const name of names) {
   counties_by_name[name] = counties.filter(d => d["region"] == name)
}

const map_plot = Plot.plot({
   //"height": 600,
   //"width": 600,
   "aspectRatio": 1,
   "grid": true,
   "color": {
      "legend": true,
      "label": "population",
      "type": "linear"
   },
   "x": {"axis": null},
   "y": {"axis": null},
   "marks": [
      Plot.geo(map, {"fill": (d) => counties_by_year["2009"][d["properties"]["NAME"]]["population"]})
   ]
})

map_el.append(map_plot)

const graph_plot = Plot.plot({
   //"width": 600,
   //"height": 600,
   "y": {"transform": d => d / 1000},
   "marks": [
      Plot.lineY(counties_by_name["Highlands"], {"x": d => new Date(d["year"], 0), "y": "endorsements", "stroke": "region"}),
      Plot.axisX({"anchor": "bottom", "labelAnchor": "center", "label": "year", "labelArrow": "none", "ticks": years.length}),
      Plot.axisY({"anchor": "left", "labelAnchor": "center", "label": "endorsements ( thousands )", "labelArrow": "none"})
   ]
})

graph_el.append(graph_plot)
