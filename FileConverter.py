
#sourced from https://stackoverflow.com/questions/48586647/python-script-to-convert-csv-to-geojson

import csv
import json
from collections import OrderedDict
import unicodedata

li = []
with open('airports2.csv', 'r') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    for id,ident,type,name,latitude_deg,longitude_deg,elevation_ft,continent,iso_country,iso_region,municipality,scheduled_service,gps_code,iata_code,local_code,home_link,wikipedia_link,keywords in reader:
        d = OrderedDict()
        if type=="large_airport" and "Air Force" not in name and "air base" not in name.lower():
            d['type'] = 'Feature'
            d['geometry'] = {
                'type': 'Point',
                'coordinates': [float(longitude_deg), float(latitude_deg)]
            }
            d['properties'] = {
                'name': name,
                'country': iso_country,
                'region': iso_region,
                'municipality': municipality,
                'iata': iata_code
            }
            li.append(d)

d = OrderedDict()
d['type'] = 'FeatureCollection'
d['features'] = li
with open('airports.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(d, sort_keys=False, indent=4, ensure_ascii=False))