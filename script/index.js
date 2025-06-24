"use strict";

const counties = await d3.json("../res/counties.json")
const florida = await d3.json("../res/florida.json")
const map = await d3.json("../res/map.json")

// div elements
const map_el = document.querySelector("#choropleth")
const line_graph_el = document.querySelector("#line_graph")

// animation button
const animate_map_button = document.querySelector("#animate_map")
animate_map_button.addEventListener("click", animate_map)

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
      cby[y][c]["endorsements per county / county population"] = cby[y][c]["endorsements"] / cby[y][c]["population"] * 100
      cby[y][c]["endorsements per county / state population"] = cby[y][c]["endorsements"] / fby[y]["population"] * 100
      cby[y][c]["endorsements per county / state endorsements"] = cby[y][c]["endorsements"] / fby[y]["endorsements"] * 100
      cby[y][c]["county population / state population"] = cby[y][c]["population"] / fby[y]["population"] * 100

      if (y == 2009) {
         cby[y][c]["endorsement difference"] = 0
         cby[y][c]["endorsement percent difference"] = 0
         cby[y][c]["population difference"] = 0
         cby[y][c]["population percent difference"] = 0
      }
      else {
         cby[y][c]["endorsement difference"] = cby[y][c]["endorsements"] - cby[y - 1][c]["endorsements"]
         cby[y][c]["endorsement percent difference"] = cby[y][c]["endorsement difference"] / cby[y - 1][c]["endorsements"] * 100
         cby[y][c]["population difference"] = cby[y][c]["population"] - cby[y - 1][c]["population"]
         cby[y][c]["population percent difference"] = cby[y][c]["population difference"] / cby[y - 1][c]["population"] * 100
      }
   }
}

const data_types = Object.keys(cby[years[0]][names[0]]).filter(k => !(k == "county" || k == "year"))

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

// selected year, selected data, selected county...
let sy = map_year_el.value
let sd = map_data_el.value
let sc = names[names.indexOf("Highlands")]

map_year_el.addEventListener("change", draw_map)
map_data_el.addEventListener("change", draw_map)

draw_map()
draw_graphs()

function animate_map() {
   let t = 0
   const delay = 500
   for (const year of years) {
      setTimeout(() => {
         map_year_el.value = year
         draw_map()
      }, t)
      t += delay
   }
}

/*
And after trying to get things dynamic... how am I supposed to sort the graphs between linear and percentage? I'm still hand-coding this thing. Not that I'm against that, but this is unintentionally hybrid.
*/
function draw_map() {
   sy = map_year_el.value
   sd = map_data_el.value

   map_el.innerHTML = ""

   const map_plot = Plot.plot({
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
            "fill": d => cby[sy][d["properties"]["NAME"]][sd],
            "tip": "xy"
         })
      ]
   })

   map_el.append(map_plot)
}

/*
I originally envisioned being able to compare counties (even all of them simultaneously), but, as this seemingly simple (probably actually simple) project kept taking longer to realize, I cut it to one county and tied selection to the choropleth.
*/
function draw_graphs() {
   const county = []
   for (const y in cby) {
      for (const c in cby[y]) {
         if (c == sc) {
            county.push(cby[y][c])
         }
      }
   }
   
   line_graph_el.innerHTML = ""

   let line_plot = Plot.plot({
      "title": `Motorcycle Endorsements in ${sc} County`,
      "x": {"type": "point"},
      "y": {"labelAnchor": "center", "labelArrow": "none"},
      "marks": [
         Plot.lineY(county, {
            "x": "year",
            "y": "endorsements",
            "stroke": "orange",
         }),
         Plot.tip(county, Plot.pointerX({
            "x": "year",
            "y": "endorsements",
            "title": d => `year: ${d["year"]}\nendorsements: ${d["endorsements"]}\nendorsement difference: ${d["endorsement difference"]}, ${d["endorsement percent difference"].toFixed(2)}%`
         }))
      ]
   })

   line_graph_el.append(line_plot)
   
   line_plot = Plot.plot({
      "title": `Population of ${sc} County`,
      "x": {"type": "point"},
      "y": {"labelAnchor": "center", "labelArrow": "none"},
      "marks": [
         Plot.lineY(county, {
            "x": "year",
            "y": "population",
            "stroke": "blue",
         }),
         Plot.tip(county, Plot.pointerX({
            "x": "year",
            "y": "population",
            "title": d => `year: ${d["year"]}\npopulation: ${d["population"]}\npopulation difference: ${d["population difference"]}, ${d["population percent difference"].toFixed(2)}%`
         }))
      ]
   })

   line_graph_el.append(line_plot)

   line_plot = Plot.plot({
      "title": `Percent Change in Endorsements and Population in ${sc} County`,
      "x": {"type": "point"},
      "y": {"labelAnchor": "center", "labelArrow": "none", "label": "%"},
      "marks": [
         Plot.ruleY([0]),
         Plot.lineY(county, {
            "x": "year",
            "y": "endorsement percent difference",
            "stroke": "orange"
         }),
         Plot.lineY(county, {
            "x": "year",
            "y": "population percent difference",
            "stroke": "blue"
         }),
         Plot.tip(county, Plot.pointerX({
            "x": "year",
            "y": "endorsement percent difference",
            "title": d => `year: ${d["year"]}\nendorsement difference: ${d["endorsement difference"]}, ${d["endorsement percent difference"].toFixed(2)}%\npopulation difference: ${d["population difference"]}, ${d["population percent difference"].toFixed(2)}%`
         }))
      ]
   })

   line_graph_el.append(line_plot)

   line_plot = Plot.plot({
      "title": `Some Ratios of ${sc} County`,
      "x": {"type": "point"},
      "y": {"labelAnchor": "center", "labelArrow": "none", "label": "%"},
      "marks": [
         Plot.ruleY([0]),
         Plot.lineY(county, {
            "x": "year",
            "y": "endorsements per county / county population",
            "stroke": "magenta",
         }),
         Plot.lineY(county, {
            "x": "year",
            "y": "endorsements per county / state population",
            "stroke": "red",
         }),
         Plot.lineY(county, {
            "x": "year",
            "y": "endorsements per county / state endorsements",
            "stroke": "yellow",
         }),
         Plot.lineY(county, {
            "x": "year",
            "y": "county population / state population",
            "stroke": "green",
         }),
         Plot.tip(county, Plot.pointerX({
            "x": "year",
            "y": "endorsements per county / county population",
            "title": d => `fill me in`
         }))
      ]
   })

   line_graph_el.append(line_plot)
}
