import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import turfHelpers from '@turf/helpers';
import turflineSlice from '@turf/line-slice';
import turflineDistance from '@turf/line-distance';

import trail from './data/hs-trail.json';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX;

export default class App extends Component {
  state = {
    pt1: null,
    pt2: null,
    listenForPt2: false,
    segment: null,
    segmentLength: 0,
    layerIDs: ['point1', 'point2', 'segment']
  };

  componentDidMount() {
    // Init Map
    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/outdoors-v9',
      center: [-76.13, 40.25],
      zoom: 9.9,
    });

    // Add Controls
    map.addControl(new mapboxgl.NavigationControl());

    // Load Map
    this.mapOnLoad(map);

    // Handle dbl click
    this.mapOnDblClick(map);

    // Show popup on trail click
    this.trailOnHover(map);
  }

  setTrailPopup = pt => {
    const popupMsg = this.state.listenForPt2 ? 'Double click to add ending point' : 'Double click to add starting point'
    return new mapboxgl.Popup({ closeButton: false, offset: 10 })
      .setLngLat(pt.lngLat)
      .setHTML(popupMsg);
  };

  addPointToMap = (map, lng, lat, id) => {
    map.addLayer({
      id,
      type: 'symbol',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [lng, lat],
              },
            },
          ],
        },
      },
      layout: {
        'icon-image': 'marker-15',
        'icon-allow-overlap': true,
      },
    });
  }

  addSegmentToMap = (map, data, id) => {
    map.addLayer({
      id,
      type: 'line',
      source: {
        type: 'geojson',
        data,
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#fff',
        'line-width': 3,
        'line-dasharray': [2, 2]
      },
    });
  }

  measureSegment = (startCoords, endCoords, feature) => {
    const start = turfHelpers.point(startCoords);
    const stop = turfHelpers.point(endCoords);
    const segment = turflineSlice(start, stop, feature);
    const segmentLength = turflineDistance(segment, 'miles');
    this.setState({ segment, segmentLength });
  };

  mapOnDblClick = map => {
    map.doubleClickZoom.disable();
    map.on('dblclick', pt => {
      // listen for two double clicks
      if (!this.state.listenForPt2) {
        this.setState({ pt1: pt.lngLat, listenForPt2: true });
        // if there is a segment on map
        // remove it before adding a new starting point
        if (this.state.segment) {
          this.state.layerIDs.map(item => {
            map.removeSource(item);
            map.removeLayer(item);
            return null;
          })
        }
        this.addPointToMap(map, pt.lngLat.lng, pt.lngLat.lat, this.state.layerIDs[0]);
      } else {
        this.setState({ pt2: pt.lngLat, listenForPt2: false });
        this.addPointToMap(map, pt.lngLat.lng, pt.lngLat.lat, this.state.layerIDs[1]);
      }

      // if we have both points calc the segment length
      if (this.state.pt1 && this.state.pt2) {
        // get segment
        this.measureSegment(
          [this.state.pt1.lng, this.state.pt1.lat],
          [this.state.pt2.lng, this.state.pt2.lat],
          trail.features[0],
        );
        console.log(this.state);
        // add segment to map
        this.addSegmentToMap(map, this.state.segment, this.state.layerIDs[2]);
        // reset points to listen for next doubleclick
        this.setState({ pt1: null, pt2: null, listenForPt2: false });
      }
    });
  };

  trailOnHover = map => {
    let hoverPopup = null;
    map.on('mouseenter', 'trail', pt => {
      map.getCanvas().style.cursor = 'pointer'; // eslint-disable-line no-param-reassign
      hoverPopup = this.setTrailPopup(pt);
      hoverPopup.addTo(map);
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'trail', () => {
      map.getCanvas().style.cursor = ''; // eslint-disable-line no-param-reassign
      hoverPopup.remove();
    });
  };

  mapOnLoad = map => {
    map.on('load', () => {
      map.addSource('trail', {
        type: 'geojson',
        data: trail,
      });

      map.addLayer({
        id: 'trail',
        type: 'line',
        source: 'trail',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#1E824C',
          'line-width': 4,
        },
      });
    });
  };

  render() {
    return (
      <div>
        <div
          ref={el => (this.mapContainer = el)} // eslint-disable-line no-return-assign
          className="absolute top right left bottom"
        />
      </div>
    );
  }
}
