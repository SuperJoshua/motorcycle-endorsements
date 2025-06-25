# Florida Motorcycle Endorsements 2009 through 2023

## Overview

This is a project that occurred to me, while looking up information on titling my bike, before moving to Florida, as being a fun way to apply what I'd been learning. What sparked it was a curious entry on the motorcycle endorsements table that I've mentioned below, in the Notes.

## Considerations

All of the temporal data is in years, regardless of anything more specific. This, naturally, makes the visualization fuzzy, at best. This is especially true with the population data, since a census isn't taken every year, and it is already being interpolated. This is all done for simplicity, to put everything on a common, unreliable footing.

The last year that motorcycle endorsements were recorded for OOS (out of state?) on the referenced table was 2011. Since OOS isn't a county, on top of it being very lacking in statistical information, it was discarded.

I have no idea what Unknown is supposed to be -- it's certainly not a county in Florida (though it would be a pretty amusing name). Were the drivers able to get endorsements without being assigned to a county? I also left this row out.

However, endorsements are endorsements, so I left the totals. I'm guessing what used to be OOS was grouped with Unknown after 2011. These together, along with the county endorsements, make up Florida endorsements for each year. Looking closely, you might wonder "Hey, why doesn't this add up?" Now, you know. That is, you know as much as I do.

## Notes

Highlands county had a remarkable increase in endorsements in 2016, with a swift drop in 2017 -- this seems like a data entry error, though, if it is, it's not clear how. This is also the reason for pursuing this project.

During the course of graphing, I noticed another anomaly. Jefferson county had a sharp increase in endorsements in 2015, with a similarly precipitous drop the following year.

## Technologies

[Plot](https://observablehq.com/plot/) (and, intrinsically, [D3](https://d3js.org/)) was used for the visualizations.

The map of Florida was extracted from [US Census data](https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html), after converting it to geojson with [MyGeodata](https://mygeodata.cloud/). I found out, later, that Mike (D3) also made [software for such a conversion](https://github.com/mbostock/shapefile). Next time, I should try that, since the software that I used has a pretty limited trial. Or, maybe, just use [another option](https://mapshaper.org/). 

## Citations

See cite.txt
