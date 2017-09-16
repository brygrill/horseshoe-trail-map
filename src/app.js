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
    this.trailOnClick(map);
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
      } else {
        this.setState({ pt2: pt.lngLat, listenForPt2: false });
      }

      // if we have both points calc the segment length
      if (this.state.pt1 && this.state.pt2) {
        this.measureSegment(
          [this.state.pt1.lng, this.state.pt1.lat],
          [this.state.pt2.lng, this.state.pt2.lat],
          trail.features[0],
        );
        console.log(this.state);
        this.setState({ pt1: null, pt2: null, listenForPt2: false });
      }
    });
  };

  trailOnClick = map => {
    map.on('click', 'trail', pt => {
      console.log(pt);
      // new mapboxgl.Popup()
      //   .setLngLat(pt.lngLat)
      //   .setHTML('Horseshoe Trail')
      //   .addTo(map);
    });
    map.on('mouseenter', 'trail', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'trail', () => {
      map.getCanvas().style.cursor = '';
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
