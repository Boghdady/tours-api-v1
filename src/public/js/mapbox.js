console.log('hello from client side');
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);


mapboxgl.accessToken = 'pk.eyJ1IjoiYWhtZWRib2doZGFkeSIsImEiOiJjazU4cGQxYWwwZDd2M25wZmt4OTZleWVwIn0.UE8I47d5VtJDemDNPSOH_w';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ahmedboghdady/ck58piauo0p301cp2gk1c9ynd',
  scrollZoom:false
  // center:[-118.113491, 34.111745],
  // zoom: 6,
  // interactive: false
});

// The are that will displayed on the map
const bounds = new mapboxgl.LngLatBounds();
locations.forEach( loc => {
  // Create marker
  const el = document.createElement('div');
  el.className = 'marker';
 // Add marker for each location
  new mapboxgl.Marker({
    element:el,
    anchor: 'bottom'
  }).setLngLat(loc.coordinates).addTo(map);

  // Add popup
  new mapboxgl.Popup({offset:30})
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Extend map bounds to include the current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top:200,
    bottom: 150,
    left: 100,
    right: 100
  }
});