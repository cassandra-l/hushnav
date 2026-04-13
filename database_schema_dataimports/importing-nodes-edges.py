import osmnx as ox
import geopandas as gpd
from sqlalchemy import create_engine
from geoalchemy2 import Geometry

# config
db_link = "postgresql://postgres:hushnav123@hushnav-db.c764wq4a45jm.ap-southeast-2.rds.amazonaws.com:5432/postgres"
engine = create_engine(db_link)

# downloading only the walkable network for city of melbourne
# this includes CBD, carlton, docklands, east melbourne, kensington, southbank, south melbourne, west melbourne, and parkville
G = ox.graph_from_place('City of Melbourne, Victoria, Australia', network_type='walk')
nodes, edges = ox.graph_to_gdfs(G)

#ensure the columns match node schema in the RDS
nodes_df = nodes.reset_index()[['osmid', 'y', 'x', 'geometry']]
nodes_df.columns = ['node_id', 'lat', 'lon', 'geom_node']
nodes_df = nodes_df.set_geometry('geom_node')

# create unique IDs and match edge schema in the RDS
edges_df = edges.reset_index()[['u', 'v', 'length', 'geometry']]
edges_df['edge_id'] = range(1, len(edges_df) + 1)
edges_df = edges_df.rename(columns={'geometry': 'geom_edge'})
edges_df = edges_df.set_geometry('geom_edge')

# push to AWS RDS with 'to_postgis'
nodes_df.to_postgis(
    'node',
    engine,
    if_exists='append',
    index=False,
    dtype={'geometry': Geometry('POINT', srid=4326)}
)

edges_df.to_postgis(
    'edge',
    engine,
    if_exists='append',
    index=False,
    dtype={'geometry': Geometry('LINESTRING', srid=4326)}
)