import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import data from './data/hs-trail.json';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX;

export default class App extends Component {
  state = {
    lng: -76.13,
    lat: 40.25,
    zoom: 9.9,
  };

  componentDidMount() {
    const { lng, lat, zoom } = this.state;

    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [lng, lat],
      zoom,
    });

    map.on('move', () => {
      const { lng, lat } = map.getCenter();

      this.setState({
        lng: lng.toFixed(4),
        lat: lat.toFixed(4),
        zoom: map.getZoom().toFixed(2),
      });
    });

    map.on('load', () => {
      map.addSource('trail', {
        type: 'geojson',
        data,
      });

      map.addLayer({
        id: 'trail',
        type: 'line',
        source: 'trail',
      });
    });
  }

  render() {
    return (
      <div>
        <div
          ref={el => (this.mapContainer = el)}
          className="absolute top right left bottom"
        />
      </div>
    );
  }
}
