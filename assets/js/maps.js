const mapStyle = [{
  'featureType': 'administrative',
  'elementType': 'all',
  'stylers': [{
    'visibility': 'on',
  },
  {
    'lightness': 33,
  },
  ],
},
{
  'featureType': 'landscape',
  'elementType': 'all',
  'stylers': [{
    'color': '#f2e5d4',
  }],
},
{
  'featureType': 'poi.park',
  'elementType': 'geometry',
  'stylers': [{
    'color': '#c5dac6',
  }],
},
{
  'featureType': 'poi.park',
  'elementType': 'labels',
  'stylers': [{
    'visibility': 'on',
  },
  {
    'lightness': 20,
  },
  ],
},
{
  'featureType': 'road',
  'elementType': 'all',
  'stylers': [{
    'lightness': 20,
  }],
},
{
  'featureType': 'road.highway',
  'elementType': 'geometry',
  'stylers': [{
    'color': '#c5c6c6',
  }],
},
{
  'featureType': 'road.arterial',
  'elementType': 'geometry',
  'stylers': [{
    'color': '#e4d7c6',
  }],
},
{
  'featureType': 'road.local',
  'elementType': 'geometry',
  'stylers': [{
    'color': '#fbfaf7',
  }],
},
{
  'featureType': 'water',
  'elementType': 'all',
  'stylers': [{
    'visibility': 'on',
  },
  {
    'color': '#acbcc9',
  },
  ],
},
];

function initMap() {
    // Create the map.
    const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 7,
    center: {lat: 52.36642190000001, lng: -1.2777807},
    styles: mapStyle,
    });

    // Load the stores GeoJSON onto the map.
    map.data.loadGeoJson('businesses.json', {idPropertyName: 'storeid'});

    // Define the custom marker icons, using the store's "category".
    map.data.setStyle((feature) => {
    return {
        icon: {
        url: `images/${feature.getProperty('service')}.png`,
        scaledSize: new google.maps.Size(32, 32),
        },
    };
    });

    const infoWindow = new google.maps.InfoWindow();

    // Show the information for a store when its marker is clicked.
    map.data.addListener('click', (event) => {
    const name = event.feature.getProperty('businessName');
    const gmapURL = event.feature.getProperty('businessGmapURL');
    const websiteURL = event.feature.getProperty('businessWebsite');
    const position = event.feature.getGeometry().get();
    const content = `
        <div style="margin:10px;">
        <h2><b>${name}</b></h2>
        <h4><a href="${websiteURL}" target="_blank">Business website</a></h4>
        <h4><a href="${gmapURL}" target="_blank">Google Maps location</a></h4>
        </div>
        `;

    infoWindow.setContent(content);
    infoWindow.setPosition(position);
    infoWindow.setOptions({pixelOffset: new google.maps.Size(0, -30)});
    infoWindow.open(map);
    });

    // Add legend
    const services = ['food', 'haircut', 'groceries', 'other']
    const legend = document.getElementById('legend');
    for (var id in services) {
      var div = document.createElement('div');
      div.innerHTML = '<img src="images/' + services[id] + '.png"> ' + services[id];
      div.classList.add('legendItem')
      legend.appendChild(div);
    }
    map.controls[google.maps.ControlPosition.RIGHT].push(legend);

    if (legend.classList.contains('hidden')) {
      legend.classList.remove('hidden');
    }

    // Build and add the search bar
    const card = document.createElement('div');
    const titleBar = document.createElement('div');
    const title = document.createElement('div');
    const container = document.createElement('div');
    const input = document.createElement('input');
    const options = {
        types: [],
        componentRestrictions: {country: 'gb'},
    };

    card.setAttribute('id', 'pac-card');
    title.setAttribute('id', 'title');
    title.textContent = 'Find your nearest business';
    titleBar.appendChild(title);
    container.setAttribute('id', 'pac-container');
    input.setAttribute('id', 'pac-input');
    input.setAttribute('type', 'text');
    input.setAttribute('placeholder', 'Enter an address');
    container.appendChild(input);
    card.appendChild(titleBar);
    card.appendChild(container);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

    // Make the search bar into a Places Autocomplete search bar and select
    // which detail fields should be returned about the place that
    // the user selects from the suggestions.
    const autocomplete = new google.maps.places.Autocomplete(input, options);

    autocomplete.setFields(
        ['address_components', 'geometry', 'name']);

    // Set the origin point when the user selects an address
    const originMarker = new google.maps.Marker({map: map});
    originMarker.setVisible(false);
    let originLocation = map.getCenter();

    autocomplete.addListener('place_changed', async () => {
    originMarker.setVisible(false);
    originLocation = map.getCenter();
    const place = autocomplete.getPlace();

    if (!place.geometry) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert('No address available for input: \'' + place.name + '\'');
        return;
    }

    // Recenter the map to the selected address
    originLocation = place.geometry.location;
    map.setCenter(originLocation);
    map.setZoom(9);

    originMarker.setPosition(originLocation);
    originMarker.setVisible(true);

    // Use the selected address as the origin to calculate distances
    // to each of the store locations
    const rankedStores = await calculateDistances(map.data, originLocation);
    showStoresList(map.data, rankedStores);

    return;
    });
}

async function calculateDistances(data, origin) {
  const stores = [];
  const destinations = [];

  // Build parallel arrays for the store IDs and destinations
  data.forEach((store) => {
    const storeNum = store.getProperty('storeid');
    const storeLoc = store.getGeometry().get();

    stores.push(storeNum);
    destinations.push(storeLoc);
  });

  // Retrieve the distances of each store from the origin
  // The returned list will be in the same order as the destinations list
  const getDistanceMatrix =
    (srvc, params) => new Promise((resolve, reject) => {
      srvc.getDistanceMatrix(params, (response, status) => {
        if (status != google.maps.DistanceMatrixStatus.OK) {
          reject(response);
        } else {
          const distances = [];
          const results = response.rows[0].elements;
          for (let j = 0; j < results.length; j++) {
            const element = results[j];
            const distanceText = element.distance.text;
            const distanceVal = element.distance.value;
            const distanceObject = {
              storeid: stores[j],
              distanceText: distanceText,
              distanceVal: distanceVal,
            };
            distances.push(distanceObject);
          }

          resolve(distances);
        }
      });
    });
  const service = new google.maps.DistanceMatrixService();

  const distancesList = await getDistanceMatrix(service, {
    origins: [origin],
    destinations: destinations,
    travelMode: 'DRIVING',
    unitSystem: google.maps.UnitSystem.IMPERIAL,
  });

  distancesList.sort((first, second) => {
    return first.distanceVal - second.distanceVal;
  });

  return distancesList;
}

function showStoresList(data, stores) {
  if (stores.length == 0) {
    console.log('empty stores');
    return;
  }

  let panel = document.createElement('div');
  // If the panel already exists, use it. Else, create it and add to the page.
  if (document.getElementById('panel')) {
    panel = document.getElementById('panel');
    // If panel is already open, close it
    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
    }
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
    }
  } else {
    panel.setAttribute('id', 'panel');
    // const body = document.body;
    var map = document.getElementById('map');
    // map.parentNode.insertBefore(panel, map);
    map.appendChild(panel);
  }

  // Clear the previous details
  while (panel.lastChild) {
    panel.removeChild(panel.lastChild);
  }

  var x = document.createElement('div');
  x.setAttribute('class', 'close fas fa-window-close fa-2x');
  panel.appendChild(x);

  $('.close').click(function () {
    panel.classList.add('hidden');
  });

  stores.forEach((store) => {
    // Add store details with text formatting
    const name = document.createElement('p');
    name.classList.add('place');
    const currentStore = data.getFeatureById(store.storeid);
    name.textContent = currentStore.getProperty('businessName');
    panel.appendChild(name);
    const distanceText = document.createElement('p');
    distanceText.classList.add('distanceText');
    distanceText.textContent = store.distanceText + " - ";
    panel.appendChild(distanceText);
    
    const website = document.createElement('a');
    website.href = currentStore.getProperty('businessWebsite')
    website.target = '_blank'
    const websiteLink = document.createElement('i');
    websiteLink.classList.add('fas')
    websiteLink.classList.add('fa-globe')
    website.appendChild(websiteLink)
    distanceText.appendChild(website)

    const gmap = document.createElement('a');
    gmap.href = currentStore.getProperty('businessGmapURL')
    gmap.target = '_blank'
    const gmapLink = document.createElement('i');
    gmapLink.classList.add('fab')
    gmapLink.classList.add('fa-google')
    gmap.style = "padding-left: 8px;"
    gmap.appendChild(gmapLink)
    distanceText.appendChild(gmap)

    const ruler = document.createElement('hr');
    panel.appendChild(ruler);
  });

  // Open the panel
  panel.classList.add('open');

  return;
}