# Parsing Data

### 1. Create CSV in Tabula

Lattice method usually works best.

### 2. Load in CartoDB, then export again as CSV

For some reason this formatting helps on the next step

### 3. Geocode on the command line

Example:

```
csvgeocode brooklyn_cbos_locations.csv out.csv --url "https://maps.googleapis.com/maps/api/geocode/json?address={{address}}&key={{ YOUR_API_KEY }}" --verbose
```

Where `address` is the column name


### 4. Reload to CartoDB, make a copy, clear the_geom

### 5. Add new columns to the copy

1. service_area_type
2. borough (`UPDATE queens_cbo_locations SET borough = queens`)
3. zipcodes
4. neighborhoods
5. community_boards

### 6. Add service areas, clean up fields

### 7. Create service area shapes

1. For Community boards:
  `SELECT * FROM nycd WHERE borocd >= 400 AND borocd < 500`
  then create a new dataset and query
  `UPDATE nycd_queens SET borocd = borocd - 400`

   Add nycd data to the main table then perform:

  <!-- language-sql -->
  ```
  UPDATE queens_cbos
  SET the_geom = (
    SELECT ST_Transform(ST_Union(the_geom_webmercator), 4326) as the_geom
    FROM nycd_queens
    WHERE brooklyn_cbos.community_boards ~ borocd
  )

  WHERE service_area_type IN ('community_board')
  ```

2. For zipcodes:
   Same as community boards

3. For neighborhoods:
   Check to make sure all neighborhood names match up! Then:


```
UPDATE queens_cbos
SET the_geom = (
  SELECT ST_Transform(ST_Union(the_geom_webmercator), 4326) as the_geom
  FROM nyc_neighborhoods
  WHERE queens_cbos.neighborhoods ~ neighborhood
)

WHERE service_area_type IN ('neighborhood')
```

4. For borough-wide, just use the Community boards map without the `WHERE` clause

5. Clean up telephone numbers and organization names

```
UPDATE queens_cbos_locations SET contact_information = regexp_replace(contact_information, '[^\d]', '', 'g')
```
