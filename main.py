import shapefile
from shapely.geometry import Point
from shapely.geometry import shape
from pyproj import Proj, transform

shp = shapefile.Reader("./data/DCP_WOS_SLR2100s75in")
all_shapes = shp.shapes()
all_records = shp.records()

p1 = Proj(init="epsg:4326")
p2 = Proj(init="epsg:2263", preserve_units=True)
x1, y1 = -73.971278, 40.716483
point = transform(p1, p2, x1, y1)

for i in range(0, len(all_shapes) - 2):
    boundary = shape(all_shapes[i])
    name = all_records[i][2]
    print("Checking %s, %d..." % (name, i))
    if Point(point).within(boundary):
        print("It is within the boundary")
