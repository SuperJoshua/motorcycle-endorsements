"use strict";

const counties = await d3.json("../res/counties.json")
const florida = await d3.json("../res/florida.json")
const map = await d3.json("../res/map.json")

// div elements
const map_el = document.querySelector("#choropleth")
const line_percent_el = document.querySelector("#line_percent")
const line_quantity_el = document.querySelector("#line_quantity")

// select elements
const map_data_el = document.querySelector("#map_data")
const map_year_el = document.querySelector("#map_year")

const years = florida.map(d => d["year"]).sort()
const names = [... new Set(counties.map(d => d["county"]))]

/*
What is this mess? This is me trying to keep the file size down by calculating all of these values from the few, rather than having them all precalculated in a big file.
*/
// Begin mess...
// florida by year...
const fby = {}
let fby_index = 0
for (const y of years) {
   fby[y] = florida[fby_index]
   fby_index += 1
}

// counties by year...
const cby = {}
for (const y of years) {
   cby[y] = {}
   for (const name of names) {
      cby[y][name] = counties.filter(d => d["year"] == y && d["county"] == name)[0]
   }
}

for (const y in cby) {
   for (const c in cby[y]) {
      cby[y][c]["endorsements per county / county population"] = cby[y][c]["endorsements"] / cby[y][c]["population"]
      cby[y][c]["endorsements per county / state population"] = cby[y][c]["endorsements"] / fby[y]["population"]
      cby[y][c]["endorsements per county / state endorsements"] = cby[y][c]["endorsements"] / fby[y]["endorsements"]
      cby[y][c]["county population / state population"] = cby[y][c]["population"] / fby[y]["population"]

      if (y == 2009) {
         cby[y][c]["endorsement difference"] = 0
         cby[y][c]["endorsement percentage difference"] = 0
         cby[y][c]["population difference"] = 0
         cby[y][c]["population percentage difference"] = 0
      }
      else {
         cby[y][c]["endorsement difference"] = cby[y][c]["endorsements"] - cby[y - 1][c]["endorsements"]
         cby[y][c]["endorsement percentage difference"] = cby[y][c]["endorsement difference"] / cby[y - 1][c]["endorsements"]
         cby[y][c]["population difference"] = cby[y][c]["population"] - cby[y - 1][c]["population"]
         cby[y][c]["population percentage difference"] = cby[y][c]["population difference"] / cby[y - 1][c]["population"]
      }
   }
}

const data_types = Object.keys(cby[years[0]][names[0]]).filter(k => !(k == "county" || k == "year"))
console.log(data_types)
const counties_by_name = {}
for (const name of names) {
   counties_by_name[name] = counties.filter(d => d["county"] == name)
}

// End mess... At least, the former mess.

// add options
for (const y of years) {
   const o = document.createElement("option")
   o.value = y
   o.innerText = y
   map_year_el.append(o)
}

for (const d of data_types) {
   const o = document.createElement("option")
   o.value = d
   o.innerText = d
   map_data_el.append(o)
}

// selected year, selected data...
let sy = "2009" || map_year_el.value
let sd = "endorsements" || map_data_el.value
console.log(map_year_el.value, map_data_el.value)

draw_map()
draw_graph()

function draw_map() {
   map_el.innerHTML = ""
   
   const map_plot = Plot.plot({
      //"height": 600,
      //"width": 600,
      "aspectRatio": 1,
      "caption": "Click on a county to populate the line graphs.",
      "color": {
         "legend": true,
         "type": "linear"
      },
      "x": {"axis": null},
      "y": {"axis": null},
      "marks": [
         Plot.geo(map, {
            "fill": d => cby[sy][d["properties"]["NAME"]][sd]
         })
         /*
         Plot.tip(map, Plot.pointer({
            "fill": d => cby["2009"][d["properties"]["NAME"]]["endorsements"],
            "title": d => `county: ${cby["2009"][d["properties"]["NAME"]]["county"]}\nyear: ${cby["2009"][d["properties"]["NAME"]]["year"]}\nendorsements: ${cby["2009"][d["properties"]["NAME"]]["endorsements"]}`
         }))
         */
      ]
   })

   map_el.append(map_plot)
}

function draw_graph() {
   line_quantity_el.innerHTML = ""
   
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

   line_quantity_el.append(graph_plot)
}
