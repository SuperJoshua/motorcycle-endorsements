"use strict";

const counties = await d3.json("../res/counties.json")
const florida = await d3.json("../res/florida.json")
const map = await d3.json("../res/map.json")
console.log(florida)
const map_el = document.querySelector("#choropleth")
const graph_el = document.querySelector("#line_graph")

/*
What is this mess? This is me trying to keep the file size down by calculating all of these values from the few, rather than having them all precalculated in a big file.
*/
// Begin mess...
const years = florida.map(d => String(d["year"]))
const names = [... new Set(counties.map(d => d["county"]))]

const fby = {}
let fi = 0
for (const y of years) {
   fby[y] = florida[fi]
   fi += 1
}

const counties_by_year = {}
for (const y of years) {
   counties_by_year[y] = {}
   for (const name of names) {
      counties_by_year[y][name] = counties.filter(d => d["year"] == y && d["county"] == name)[0]
   }
}

for (const y in counties_by_year) {
   for (const c in counties_by_year[y]) {
      counties_by_year[y][c]["epc/ppc"] = counties_by_year[y][c]["endorsements"] / counties_by_year[y][c]["population"]
      counties_by_year[y][c]["epc/pps"] = counties_by_year[y][c]["endorsements"] / fby[y]["population"]
      counties_by_year[y][c]["epc/eps"] = counties_by_year[y][c]["endorsements"] / fby[y]["endorsements"]
      counties_by_year[y][c]["ppc/pps"] = counties_by_year[y][c]["population"] / fby[y]["population"]

      if (y == 2009) {
         counties_by_year[y][c]["ediff"] = 0
         counties_by_year[y][c]["ediffp"] = 0
         counties_by_year[y][c]["pdiff"] = 0
         counties_by_year[y][c]["pdiffp"] = 0
      }
      else {
         counties_by_year[y][c]["ediff"] = counties_by_year[y][c]["endorsements"] - counties_by_year[y - 1][c]["endorsements"]
         counties_by_year[y][c]["ediffp"] = counties_by_year[y][c]["ediff"] / counties_by_year[y - 1][c]["endorsements"]
         counties_by_year[y][c]["pdiff"] = counties_by_year[y][c]["population"] - counties_by_year[y - 1][c]["population"]
         counties_by_year[y][c]["pdiffp"] = counties_by_year[y][c]["pdiff"] / counties_by_year[y - 1][c]["population"]
      }
   }
}

const counties_by_name = {}
for (const name of names) {
   counties_by_name[name] = counties.filter(d => d["county"] == name)
}

// End mess... At least, the former mess.

draw_map()
draw_graph()

function draw_map() {
   map_el.innerHTML = ""
   
   const map_plot = Plot.plot({
      //"height": 600,
      //"width": 600,
      "aspectRatio": 1,
      "color": {
         "legend": true,
         "label": "endorsements",
         "type": "linear"
      },
      "x": {"axis": null},
      "y": {"axis": null},
      "marks": [
         Plot.geo(map, {
            "fill": d => counties_by_year["2009"][d["properties"]["NAME"]]["endorsements"]
         })
         /*
         Plot.tip(map, Plot.pointer({
            "fill": d => counties_by_year["2009"][d["properties"]["NAME"]]["endorsements"],
            "title": d => `county: ${counties_by_year["2009"][d["properties"]["NAME"]]["county"]}\nyear: ${counties_by_year["2009"][d["properties"]["NAME"]]["year"]}\nendorsements: ${counties_by_year["2009"][d["properties"]["NAME"]]["endorsements"]}`
         }))
         */
      ]
   })

   map_el.append(map_plot)
}

function draw_graph() {
   graph_el.innerHTML = ""
   
   
   
   const graph_plot = Plot.plot({
      //"width": 600,
      //"height": 600,
      "x": {"type": "point"},
      "y": {"transform": d => d / 1000},
      "marks": [
         Plot.lineY(counties_by_name["Highlands"], {
            //"x": d => new Date(d["year"], 0),
            "x": "year",
            "y": "endorsements",
            "stroke": "county",
         }),
         Plot.tip(counties_by_name["Highlands"], Plot.pointer({
            "x": "year",
            "y": "endorsements",
            "stroke": "county",
            "title": d => `year: ${d["year"]}\nendorsements: ${d["endorsements"]}`
         })),
         Plot.axisX({
            "anchor": "bottom",
            "labelAnchor": "center",
            "label": "year",
            "labelArrow": "none",
            "ticks": years.length
         }),
         Plot.axisY({
            "anchor": "left",
            "labelAnchor": "center",
            "label": "endorsements ( thousands )",
            "labelArrow": "none"
         })
      ]
   })

   graph_el.append(graph_plot)
}
