import React from 'react';
import { Map, GoogleApiWrapper, Marker } from 'google-maps-react';

class MapContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      locations: this.props.currentLocations,
      title: '',
      directionsService: new google.maps.DirectionsService(),
      directionsDisplay: new google.maps.DirectionsRenderer({ draggable: true, markerOptions: { draggable: true } }),
      distance: null
    }

    this.handleMapReady = this.handleMapReady.bind(this);
    this.addNewMarker = this.addNewMarker.bind(this);
    this.updateDrag = this.updateDragAndDist.bind(this);
    this.deletePoint = this.deletePoint.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateTitle = this.updateTitle.bind(this);

    this.state.directionsDisplay.addListener('directions_changed', () => (this.updateDragAndDist(this.state.directionsDisplay.getDirections())));
  }

  componentDidMount() {
    this.props.requestRoutes(this.props.currentUser.id);
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.updateRoute({ route: { total_distance: this.state.distance, title: this.state.title, routeId: this.props.routeId }, locations: this.state.locations })
      .then(() => this.props.history.push(`/${this.props.currentUser.id}/routes`));
  }

  updateTitle(e) {
    this.setState({ title: e.currentTarget.value })
  }

  updateDragAndDist(result, option) {
    let temp = [];
    let myroute = result.routes[0];
    let dist = 0;
    for (let i = 0; i < myroute.legs.length; i++) {
      temp.push({ location: { lat: myroute.legs[i].start_location.lat(), lng: myroute.legs[i].start_location.lng() } })
      dist += myroute.legs[i].distance.value;
      if (i === myroute.legs.length - 1) {
        temp.push({ location: { lat: myroute.legs[i].end_location.lat(), lng: myroute.legs[i].end_location.lng() } })
      }
    }

    dist = (dist * 0.000621371).toFixed(2);

    this.setState({ locations: temp, distance: dist });
  }

  addNewMarker(mapProps, map, e) {
    let joined = this.state.locations.concat([{ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } }]);
    this.setState({ locations: joined })
    if (this.state.locations.length > 1) {
      this.calculateAndDisplayRoute(map);
    };
  }

  deletePoint() {

    if (this.state.locations.length === 2) {
      let temp = this.state.locations[0];
      this.setState({ locations: [temp] });
      this.state.directionsDisplay.set('directions', null);
    } else {
      let endIdx = this.state.locations.length - 1;
      let temp = this.state.locations.slice(0, endIdx);
      this.setState({ locations: temp }, () => {
        let waypoints = this.state.locations.slice();
  
        let origin = waypoints.shift().location;
        let destination = waypoints.pop().location;
  
        this.state.directionsService.route({
          origin: origin,
          destination: destination,
          waypoints: waypoints,
          travelMode: 'WALKING'
        }, (response, status) => {
          if (status === 'OK') {
            this.state.directionsDisplay.setDirections(response);
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });
  
        this.updateDragAndDist(this.state.directionsDisplay.getDirections(), "delete")
      })
    }

  }

  handleMapReady(mapProps, map) {
    this.setState({ locations: this.props.currentLocations, title: this.props.currentRoute.title }, 
    () => {
      if (this.state.locations.length > 1) {
        this.calculateAndDisplayRoute(map);
      }}
    )
  }

  calculateAndDisplayRoute(map) {

    this.state.directionsDisplay.setMap(map);

    let waypoints = this.state.locations.slice();

    let origin = waypoints.shift().location;
    let destination = waypoints.pop().location;

    this.state.directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      travelMode: 'WALKING'
    }, (response, status) => {
      if (status === 'OK') {
        this.state.directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }

  render() {
    
    if (this.props.currentLocations.length < 1) {
      return null
    }

    return (
      <div className="route-form-main">

        <div className="route-map-div">
          <Map
            google={this.props.google}
            className={"map"}
            zoom={10}
            initialCenter={this.props.currentLocations[0].location}
            style={{ width: '75%', height: '100%', position: 'relative', display: 'block' }}
            onReady={this.handleMapReady}
            onClick={this.addNewMarker}
          >
          </Map>
        </div>

        <div className="route-left-bar">

          <h3 className="routing-preferences">Routing Preferences</h3>
          
          <input className="route-title-input" placeholder="Title" type="text" value={this.state.title} onChange={this.updateTitle} />
          
          <button className="route-delete-pt" onClick={this.deletePoint}>Delete Last Location</button>
          
          <form onSubmit={this.handleSubmit} className="route-form">
            <button className="route-create-btn" type="submit">Update Route</button>
          </form>
         
          <div className="route-instructions">Click on map to place marker, drag to move. Route must be comprised of a title and at least two location points in order to save.</div>
          {this.state.distance ? <div className="route-distance-label">{this.state.distance}mi</div> : <div></div>}
        
        </div>



      </div>
    );
  }
}

export default GoogleApiWrapper({ apiKey: window.googleAPIKey })(MapContainer);