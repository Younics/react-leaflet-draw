import { PropTypes } from "prop-types";
import Draw from "leaflet-draw"; // eslint-disable-line
import isEqual from "lodash.isequal";

import { LayersControl } from "react-leaflet";
import { Map } from "leaflet";

const eventHandlers = {
  onEdited: "draw:edited",
  onDrawStart: "draw:drawstart",
  onDrawStop: "draw:drawstop",
  onDrawVertex: "draw:drawvertex",
  onEditStart: "draw:editstart",
  onEditMove: "draw:editmove",
  onEditResize: "draw:editresize",
  onEditVertex: "draw:editvertex",
  onEditStop: "draw:editstop",
  onDeleteStart: "draw:deletestart",
  onDeleteStop: "draw:deletestop"
};

export default class EditControl extends LayersControl {
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
      "topright",
      "topleft",
      "bottomright",
      "bottomleft"
    ])
  };

  static contextTypes = {
    map: PropTypes.instanceOf(Map),
    layerContainer: PropTypes.shape({
      addLayer: PropTypes.func.isRequired,
      removeLayer: PropTypes.func.isRequired
    })
  };

  onDrawCreate = e => {
    const { onCreated } = this.props;
    const { layerContainer } = this.context;

    layerContainer.addLayer(e.layer);
    if (typeof onCreated === "function") onCreated(e);
  };

  onDeleted = e => {
    const { onDeleted } = this.props;

    if (typeof onDeleted === "function") onDeleted(e);
  };

  onDeleteStart = e => {
    const { onDeleteStart } = this.props;

    if (typeof onDeleteStart === "function") onDeleteStart(e);
  };

  onDeleteStop = e => {
    const { onDeleteStop } = this.props;

    if (typeof onDeleteStop === "function") onDeleteStop(e);
  };

  onDrawStart = e => {
    const { onDrawStart } = this.props;

    if (typeof onDrawStart === "function") onDrawStart(e);
  };

  onDrawStop = e => {
    const { onDrawStop } = this.props;

    if (typeof onDrawStop === "function") onDrawStop(e);
  };

  componentWillMount() {
    const { map } = this.context;

    this.updateDrawControls();

    map.on("draw:created", this.onDrawCreate);
    map.on("draw:deleted", this.onDeleted);
    map.on("draw:deletestart", this.onDeleteStart);
    map.on("draw:deletestop", this.onDeleteStop);
    map.on("draw:drawstart", this.onDrawStart);
    map.on("draw:drawstop", this.onDrawStop);

    for (const key in eventHandlers) {
      if (this.props[key]) {
        map.on(eventHandlers[key], this.props[key]);
      }
    }
  }

  componentDidMount() {
    const { onMounted } = this.props;

    super.componentDidMount();
    if (typeof onMounted === "function") onMounted(this.leafletElement);
  }

  componentWillUnmount() {
    const { map } = this.context;
    this.leafletElement.remove(map);

    map.off("draw:created", this.onDrawCreate);
    map.off("draw:deleted", this.onDeleted);
    map.on("draw:deletestart", this.onDeleteStart);
    map.on("draw:deletestop", this.onDeleteStop);
    map.on("draw:drawstart", this.onDrawStart);
    map.on("draw:drawstop", this.onDrawStop);

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

    const { map } = this.context;

    this.leafletElement.remove(map);
    this.updateDrawControls();
    this.leafletElement.addTo(map);

    return null;
  }

  updateDrawControls = () => {
    const { layerContainer } = this.context;
    const { draw, edit, position } = this.props;
    const options = {
      edit: {
        ...edit,
        featureGroup: layerContainer
      }
    };

    if (draw) {
      options.draw = draw;
    }

    if (position) {
      options.position = position;
    }

    this.leafletElement = new L.Control.Draw(options); // eslint-disable-line
  };
}
