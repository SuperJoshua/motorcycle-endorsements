"use strict";

/*
I still don't understand the reasoning behind not being able to load local files. That, or I don't understand how to do it properly. I'd like to be able to load JSON from a relative path -- which does work, by the way, on my computer, but not after I upload it to GitHub -- since my solution, below, is frowned on. But it doesn't make practical sense for me to have to fetch it from a server. It'd be like getting rid of all books and having to go to a store or library any time that I wanted to read anything.
*/
import {counties} from "../res/counties.js"
import {florida} from "../res/florida.js"
import {map} from "../res/map.js"

// div elements
const map_el = document.querySelector("#choropleth")
map_el.addEventListener("click", draw_graphs)
const line_graph_el = document.querySelector("#line_graph")

// animation button
const animate_map_button = document.querySelector("#animate_map")
animate_map_button.addEventListener("click", animate_map)

// select elements
const map_data_el = document.querySelector("#map_data")
map_data_el.addEventListener("change", draw_map)
const map_year_el = document.querySelector("#map_year")
map_year_el.addEventListener("change", draw_map)

/*
What is this mess? This is me trying to keep the file size down by calculating all of these values from the few, rather than having them all precalculated in a big file.
*/
const years = florida.map((d) => d["year"]).sort()
const names = [... new Set(counties.map((d) => d["county"]))]

// Florida by year...
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
      cby[y][name] = counties.filter((d) => d["year"] == y && d["county"] == name)[0]
   }
}

// calculate extra values
for (const y in cby) {
   for (const c in cby[y]) {
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

      cby[y][c]["endorsements per county / county population"] = cby[y][c]["endorsements"] / cby[y][c]["population"] * 100
      cby[y][c]["endorsements per county / state population"] = cby[y][c]["endorsements"] / fby[y]["population"] * 100
      cby[y][c]["endorsements per county / state endorsements"] = cby[y][c]["endorsements"] / fby[y]["endorsements"] * 100
      cby[y][c]["county population / state population"] = cby[y][c]["population"] / fby[y]["population"] * 100
      cby[y][c]["state endorsements"] = fby[y]["endorsements"]
      cby[y][c]["state population"] = fby[y]["population"]
   }
}

const data_types = Object.keys(cby[years[0]][names[0]]).filter((k) => !(k == "county" || k == "year"))

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

function animate_map() {
   let t = 0
   const delay = 200
   for (const year of years) {
      setTimeout(() => {
         map_year_el.value = year
         draw_map()
      }, t)
      t += delay
   }
}

/*
And after trying to get things dynamic... how am I supposed to discriminate between linear and percentage? I'm still hand-coding this thing. Not that I'm against that, but this is unintentionally hybrid.
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
         "scheme": "Greens",
         "type": "linear"
      },
      "x": {"axis": null},
      "y": {"axis": null},
      "marks": [
         Plot.geo(map, {
            "fill": (d) => cby[sy][d["properties"]["NAME"]][sd],
            "stroke": "black",
            "channels": {
               "county": {
                  "label": "county",
                  "value": "NAME"
               }
            },
            /*
            While I managed to get the tip stuff working for the line charts, geo just plain doesn't seem to want to work with me.
            */
            "tip": "xy"
         })
      ]
   })

   /*
   I could definitely do without the "click-to-stick" feature, but, looking at the issue on Github -- https://github.com/observablehq/plot/issues/1832 -- there seems to be no simple way to do that yet. So, I'll leave it alone.
   
   I still have a weird bug, here, too, where I'm informed that map_plot.value = null. It looks likes this occurs when the mouse cursor passes from outside the state into the state. I get it -- there's no value for the "ocean". But how do I fix this? This try-catch block seems to work.
   */
   map_plot.addEventListener("input", () => {
      try {
         sc = map_plot.value.properties.NAME
      }
      catch (err) {
         "ignore"
      }
   })

   map_el.append(map_plot)
}

/*
I originally envisioned being able to compare counties (even all of them simultaneously), but, as this seemingly simple (probably actually simple) project kept taking longer to realize, I cut it to one county and tied selection to the choropleth.

Also, I thought to draw more lines on each graph, but when I did this, the lines were too confusing and indistinct. Graphing them separately exaggerates them -- another problem -- but at least it's clearer.
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
      "title": `Motorcycle Endorsements of ${sc} County`,
      "x": {"type": "point"},
      "y": {"label": null},
      "marks": [
         Plot.lineY(county, {
            "x": "year",
            "y": "endorsements",
            "channels": {
               "endorsement difference": {
                  "label": "difference",
                  "value": "endorsement difference"
               },
               "endorsement percent difference": {
                  "label": "% change",
                  "value": "endorsement percent difference"
               }
            },
            "tip": {
               "format": {
                  "x": true,
                  "y": true,
                  "endorsement difference": true,
                  "endorsement percent difference": (d) => `${d.toFixed(2)} %`
               }
            }
         })
      ]
   })

   line_graph_el.append(line_plot)
   
   line_plot = Plot.plot({
      "marginLeft": 50,
      "title": `Population of ${sc} County`,
      "x": {"type": "point"},
      "y": {"label": null},
      "marks": [
         Plot.lineY(county, {
            "x": "year",
            "y": "population",
            "channels": {
               "population difference": {
                  "label": "difference",
                  "value": "population difference"
               },
               "population percent difference": {
                  "label": "% change",
                  "value": "population percent difference"
               }
            },
            "tip": {
               "format": {
                  "x": true,
                  "y": true,
                  "population difference": true,
                  "population percent difference": (d) => `${d.toFixed(2)} %`
               }
            }
         })
      ]
   })

   line_graph_el.append(line_plot)

   line_plot = Plot.plot({
      "title": `Percent Change in Endorsements of ${sc} County`,
      "x": {"type": "point"},
      "y": {"label": null},
      "marks": [
         Plot.ruleY([0]),
         Plot.lineY(county, {
            "x": "year",
            "y": {
               "label": "% change",
               "value": "endorsement percent difference"
            },
            "channels": {
               "endorsement difference": {
                  "label": "difference",
                  "value": "endorsement difference"
               }
            },
            "tip": {
               "format": {
                  "x": true,
                  "y": (d) => `${d.toFixed(2)} %`,
                  "endorsement difference": true
               }
            }
         })
      ]
   })

   line_graph_el.append(line_plot)

   line_plot = Plot.plot({
      "title": `Percent Change in Population of ${sc} County`,
      "x": {"type": "point"},
      "y": {"label": null},
      "marks": [
         Plot.ruleY([0]),
         Plot.lineY(county, {
            "x": "year",
            "y": {
               "label": "% change",
               "value": "population percent difference"
            },
            "channels": {
               "population difference": {
                  "label": "difference",
                  "value": "population difference"
               }
            },
            "tip": {
               "format": {
                  "x": true,
                  "y": (d) => `${d.toFixed(2)} %`,
                  "population difference": true
               }
            }
         })
      ]
   })

   line_graph_el.append(line_plot)

   line_plot = Plot.plot({
      "title": `Motorcycle Endorsements / Population of ${sc} County`,
      "x": {"type": "point"},
      "y": {"label": null},
      "marks": [
         Plot.ruleY([0]),
         Plot.lineY(county, {
            "x": "year",
            "y": {
               "label": "ratio",
               "value": "endorsements per county / county population"
            },
            "channels": {
               "endorsements": "endorsements",
               "population": "population"
            },
            "tip": {
               "format": {
                  "x": true,
                  "y": (d) => `${d.toFixed(2)} %`,
                  "endorsements": true,
                  "population": true
               }
            }
         })
      ]
   })
   
   line_graph_el.append(line_plot)
   
   line_plot = Plot.plot({
      "title": `Motorcycle Endorsements of ${sc} County / State Population`,
      "x": {"type": "point"},
      "y": {"label": null},
      "marks": [
         Plot.ruleY([0]),
         Plot.lineY(county, {
            "x": "year",
            "y": {
               "label": "ratio",
               "value": "endorsements per county / state population"
            },
            "channels": {
               "endorsements": {
                  "label": "endorsements",
                  "value": "endorsements"
               },
               "state population": {
                  "label": "population",
                  "value": "state population"
               }
            },
            "tip": {
               "format": {
                  "x": true,
                  "y": (d) => `${d.toFixed(2)} %`,
                  "endorsements": true,
                  "state population": true
               }
            }
         })
      ]
   })
   
   line_graph_el.append(line_plot)
   
   line_plot = Plot.plot({
      "title": `Motorcycle Endorsements of ${sc} County / State Endorsements`,
      "x": {"type": "point"},
      "y": {"label": null},
      "marks": [
         Plot.ruleY([0]),
         Plot.lineY(county, {
            "x": "year",
            "y": {
               "label": "ratio",
               "value": "endorsements per county / state endorsements"
            },
            "channels": {
               "endorsements": {
                  "label": "county",
                  "value": "endorsements"
               },
               "state endorsements": {
                  "label": "state",
                  "value": "state endorsements"
               }
            },
            "tip": {
               "format": {
                  "x": true,
                  "y": (d) => `${d.toFixed(2)} %`,
                  "endorsements": true,
                  "state endorsements": true
               }
            }
         })
      ]
   })
   
   line_graph_el.append(line_plot)
   
   line_plot = Plot.plot({
      "title": `Population of ${sc} County / State Population`,
      "x": {"type": "point"},
      "y": {"label": null},
      "marks": [
         Plot.ruleY([0]),
         Plot.lineY(county, {
            "x": "year",
            "y": {
               "label": "ratio",
               "value": "county population / state population"
            },
            "channels": {
               "population": {
                  "label": "county",
                  "value": "population"
               },
               "state population": {
                  "label": "state",
                  "value": "state population"
               }
            },
            "tip": {
               "format": {
                  "x": true,
                  "y": (d) => `${d.toFixed(2)} %`,
                  "population": true,
                  "state population": true
               }
            }
         })
      ]
   })
   
   line_graph_el.append(line_plot)
}

draw_map()
draw_graphs()
