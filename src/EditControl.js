import { PropTypes } from 'prop-types';
import Draw from 'leaflet-draw'; // eslint-disable-line
import isEqual from 'lodash-es/isEqual';

import { MapControl, withLeaflet } from 'react-leaflet';
import leaflet, { Map, Control } from 'leaflet';

const eventHandlers = {
  onEdited: 'draw:edited',
  onDrawStart: 'draw:drawstart',
  onDrawStop: 'draw:drawstop',
  onDrawVertex: 'draw:drawvertex',
  onEditStart: 'draw:editstart',
  onEditMove: 'draw:editmove',
  onEditResize: 'draw:editresize',
  onEditVertex: 'draw:editvertex',
  onEditStop: 'draw:editstop',
  onDeleteStart: 'draw:deletestart',
  onDeleteStop: 'draw:deletestop'
};

class EditControl extends MapControl {
  static propTypes = {
    ...Object.keys(eventHandlers).reduce((acc, val) => {
      acc[val] = PropTypes.func;
      return acc;
    }, {}),
    onCreated: PropTypes.func,
    onMounted: PropTypes.func,
    onDeleted: PropTypes.func,
    draw: PropTypes.shape({
      polyline: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      polygon: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      rectangle: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      circle: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      marker: PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
    }),
    edit: PropTypes.shape({
      edit: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      remove: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      poly: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      allowIntersection: PropTypes.bool
    }),
    position: PropTypes.oneOf([
      'topright',
      'topleft',
      'bottomright',
      'bottomleft'
    ]),
    leaflet: PropTypes.shape({
      map: PropTypes.instanceOf(Map),
      layerContainer: PropTypes.shape({
        addLayer: PropTypes.func.isRequired,
        removeLayer: PropTypes.func.isRequired
      })
    })
  };

  createLeafletElement(props) {
    return createDrawElement(props);
  }

  onDrawCreate = e => {
    const { onCreated } = this.props;
    const { layerContainer } = this.props.leaflet;

    layerContainer.addLayer(e.layer);
    if (typeof onCreated === 'function') onCreated(e);
  };

  onDeleted = e => {
    const { onDeleted } = this.props;

    if (typeof onDeleted === 'function') onDeleted(e);
  };

  onDeleteStart = e => {
    const { onDeleteStart } = this.props;

    if (typeof onDeleteStart === 'function') onDeleteStart(e);
  };

  onDeleteStop = e => {
    const { onDeleteStop } = this.props;

    if (typeof onDeleteStop === 'function') onDeleteStop(e);
  };

  onDrawStart = e => {
    const { onDrawStart } = this.props;

    if (typeof onDrawStart === 'function') onDrawStart(e);
  };

  onDrawStop = e => {
    const { onDrawStop } = this.props;

    if (typeof onDrawStop === 'function') onDrawStop(e);
  };

  componentDidMount() {
    super.componentDidMount();
    const { map } = this.props.leaflet;
    const { onMounted } = this.props;

    for (const key in eventHandlers) {
      if (this.props[key]) {
        map.on(eventHandlers[key], this.props[key]);
      }
    }

    map.on(leaflet.Draw.Event.CREATED, this.onDrawCreate);
    map.on(leaflet.Draw.Event.DELETED, this.onDeleted);
    map.on(leaflet.Draw.Event.DELETESTART, this.onDeleteStart);
    map.on(leaflet.Draw.Event.DELETESTOP, this.onDeleteStop);
    map.on(leaflet.Draw.Event.DRAWSTART, this.onDrawStart);
    map.on(leaflet.Draw.Event.DRAWSTOP, this.onDrawStop);

    if (typeof onMounted === 'function') onMounted(this.leafletElement);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    const { map } = this.props.leaflet;

    map.off(leaflet.Draw.Event.CREATED, this.onDrawCreate);
    map.off(leaflet.Draw.Event.DELETED, this.onDeleted);
    map.off(leaflet.Draw.Event.DELETESTART, this.onDeleteStart);
    map.off(leaflet.Draw.Event.DELETESTOP, this.onDeleteStop);
    map.off(leaflet.Draw.Event.DRAWSTART, this.onDrawStart);
    map.off(leaflet.Draw.Event.DRAWSTOP, this.onDrawStop);

    for (const key in eventHandlers) {
      if (this.props[key]) {
        map.off(eventHandlers[key], this.props[key]);
      }
    }
  }

  componentDidUpdate(prevProps) {
    // super updates positions if thats all that changed so call this first
    super.componentDidUpdate(prevProps);

    if (
      isEqual(this.props.draw, prevProps.draw) ||
      this.props.position !== prevProps.position
    ) {
      return false;
    }

    const { map } = this.props.leaflet;

    this.leafletElement.remove(map);
    this.leafletElement = createDrawElement(this.props);
    this.leafletElement.addTo(map);

    return null;
  }
}

function createDrawElement(props) {
  const { layerContainer } = props.leaflet;
  const { draw, edit, position } = props;
  const options = {
    edit: {
      ...edit,
      featureGroup: layerContainer
    }
  };

  if (draw) {
    options.draw = { ...draw };
  }

  if (position) {
    options.position = position;
  }

  return new Control.Draw(options);
}

export default withLeaflet(EditControl);
