"use strict";

const stats = await d3.json("../res/stats.json")
const map = await d3.json("../res/florida.json")

const map_el = document.querySelector("#choropleth")
const graph_el = document.querySelector("#line_graph")

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

const counties_by_name = {}
for (const name of names) {
   counties_by_name[name] = counties.filter(d => d["region"] == name)
}

/*
# endorsements per county
# population per county
# endorsements per county / population per county %
# endorsements per county / population per state %
# endorsements per county / endorsements per state %
# population per county / population per state %
*/

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
         /*Plot.geo(map, Plot.pointer({
            "stroke": "white",
            "strokeWidth": 1,
            "fill": d => counties_by_year["2009"][d["properties"]["NAME"]]["endorsements"]
         })),*/
         Plot.geo(map, {
            //"tip": "xy",
            "fill": d => counties_by_year["2009"][d["properties"]["NAME"]]["endorsements"],
            "channels": {
               "county": "county",
               "endorsements": "endorsements"
            },
            "tip": {
               "format": {
                  "county": true,
                  "endorsements": false
               }
            }
         })
      ]
   })

   map_el.append(map_plot)
}

function draw_graph() {
   graph_el.innerHTML = ""
   
   
   
   const graph_plot = Plot.plot({
      //"width": 600,
      //"height": 600,
      "y": {"transform": d => d / 1000},
      "marks": [
         Plot.lineY(counties_by_name["Highlands"], {
            "x": d => new Date(d["year"], 6, 1),
            "y": "endorsements",
            "stroke": "region",
            //"tip": "xy"
            /*
            "channels": {
               "population": "population",
               "x": {
                  "label": "year",
                  "value": 100
               }
            },
            "tip" : {
               "format": {
                  "x": d => `${d.getFullYear()} mother!`,
                  "y": d => `${d * 1000} father!`,
                  "population": true
               }
            }
            */
         }),
         Plot.tip(counties_by_name["Highlands"], Plot.pointer({
            "x": d => new Date(d["year"], 6, 1),
            "y": "endorsements",
            "stroke": "region",
            "title": d => `year: ${d["year"]}\nendorsements: ${d["endorsements"]}`
         })),
         Plot.axisX({
            "anchor": "bottom",
            "labelAnchor": "center",
            "label": "year", "labelArrow":
            "none",
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
