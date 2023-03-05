import React, { Component } from "react";
import { connect } from "react-redux";
import { centroid, polygon } from "@turf/turf";
import MANDALBOUNDS from "../Shapes/TS_mandal_boundary.json";
import DISTRICTBOUNDS from "../Shapes/TS_district_boundary.json";
import chroma from "chroma-js";
import BottomNav from "../Common/BottomNav";
import Footer from "../Common/Footer";
import LegendMobile from "../Common/LegendMobile";
import {
  Map,
  TileLayer,
  ZoomControl,
  Marker,
  GeoJSON,
  FeatureGroup,
  Tooltip,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import GeoRaster from "./RGBGeoRaster";
import DrawerModal from "../Common/Drawer";
import CPDrawerModal from "../Common/CPDrawer";
import Header from "../Common/Header";
import Sidebar from "../Common/Sidebar";
import { BiSearch, BiX, BiHomeAlt } from "react-icons/bi";
import { FormGroup, Input } from "reactstrap";
import Circlemarker from "../img/circlemarker.png";
import MK1 from "../img/locationMK.png";
import { Radio, message } from "antd";
import loader from "../img/loader.gif";
import locIcon from "../img/locationICON.png";
import mandalRegions from "./Regions/mandalRegions";
import districtRegions from "./Regions/districtRegions";
import axiosConfig from "../Common/axios_Config";
import { EditControl } from "react-leaflet-draw";
import SearchPlace from "./searchPlaces";
// import { NominatimSearch } from "@terrestris/react-geo";

const MAP_STYLES = {
  position: "relative",
  width: "100%",
  height: "100vh",
};
const geojsonArea = require("@mapbox/geojson-area");
const options = [
  { label: "Raster", value: "Raster" },
  { label: "Vector", value: "Vector" },
];
const LoaderIcon = new L.Icon({
  iconUrl: loader,
  iconSize: [150, 150],
});
const LocIcon = new L.Icon({
  iconUrl: locIcon,
  iconSize: [50, 50],
});
const MarkerIcon = new L.Icon({
  iconUrl: Circlemarker,
  iconSize: [10, 10],
});
const MarkerIcon2 = new L.Icon({
  iconUrl: MK1,
  iconSize: [20, 20],
});
let ltype = "Raster";

const mapStateToProps = (ReduxProps) => {
  return {
    place: ReduxProps.setplace,
    parametervalue: ReduxProps.setval,
    vectorLoader: ReduxProps.VectorLoader,
    rasterLoader: ReduxProps.RasterLoader,
    CurrentLayer: ReduxProps.CurrentLayer,
    CurrentRegion: ReduxProps.CurrentRegion,
    CurrentVector: ReduxProps.CurrentVector,
    MapKey: ReduxProps.MapKey,
    LayerDescription: ReduxProps.LayerDescription,
    vectorColor: ReduxProps.SetColor,
    DevcfvectorColor: ReduxProps.SetDevCFColor,
    DevvectorColor: ReduxProps.SetDevColor,
    currentLayerType: ReduxProps.CurrentLayerType,
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    setVectorColor: (col) => dispatch({ type: "SETCOLOR_SCALE", payload: col }),
    setDevcfvectorColor: (col) =>
      dispatch({ type: "SETDEVCFCOLOR_SCALE", payload: col }),
    setDevvectorColor: (col) =>
      dispatch({ type: "SETDEVCOLOR_SCALE", payload: col }),
    setvalue: (val) => dispatch({ type: "SETVALUE", payload: val }),
    setplace: (plc) => dispatch({ type: "SETPLACE", payload: plc }),
    VectorLoader: () => dispatch({ type: "ENABLEVECTOR" }),
    SetBoundary: (geojson) =>
      dispatch({ type: "SETCURRENTVECTOR", payload: geojson }),
    setRegion: (region) =>
      dispatch({ type: "SETCURRENTREGION", payload: region }),
    setMapKey: () => dispatch({ type: "CHANGEKEYMAP" }),
    setLayerType: (currentlayertype) =>
      dispatch({ type: "SETCURRRENTLAYERTYPE", payload: currentlayertype }),
    showRaster: () => dispatch({ type: "SHOWRASTER" }),
    hideRaster: () => dispatch({ type: "HIDERASTER" }),
  };
};
export class map extends Component {
  constructor(props) {
    super(props);
    this.child = React.createRef();
    this.CPchild = React.createRef();
    this.rasterChild = React.createRef();
    this.vectorChild = React.createRef();
    this.state = {
      RGBViewPort: {
        center: [18.1124, 79.0193],
      },
      boundary: [],
      activeSearch: true,
      active: true,
      currentComodity: "",
      searchPlace: "",
      area: 0.0,
      pointData: false,
      selected_shape: [],
      keyMAP: 1,
      regionkey: 1,
      pointVector: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [55.6761, 12.5683],
            },
            properties: {
              brightness: 330.5,
              scan: 1.16,
              track: 1.07,
              acq_date: "2021-11-02",
              acq_time: 801,
              satellite: "Aqua",
              instrument: "MODIS",
              confidence: 83,
              version: "6.1NRT",
              bright_t31: 296.07,
              frp: 25.58,
              daynight: "D",
              latitude: 12.5683,
              longitude: 55.6761,
            },
          },
        ],
      },
      currentBoundaryPattern: "DISTRICT",
      layerType: "Raster",
      buttonclick: true,
      areaValue: 0.0,
      minVal: 0.0,
      maxVal: 0.0,
      meanVal: 0.0,
      layertransparency: 0.1,
      loaderlatvector: 17.754639747121828,
      loaderlngvector: 79.05833831966801,
      loaderlatraster: 17.754639747121828,
      loaderlngraster: 79.05833831966801,
      locpointerltlng: [60.732421875, 80.67555881973475],
      selectedRegion: "",
      regionList: districtRegions(),
      latnew: 18.1124,
      longnew: 79.0193,
      selectedWeatherMandal: "",
      selectedMandal: "",
      mapZoom: 7.5,
      layerUID: "",
      showlayertype: true,
      midpoint: [],
      editableFG: [],
      baseMap:
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      attribution: "",
      showCustomDraw: false,
      customStatus: false,
      checked: false,
      boundColor: "",
      baseMapselected: "Dark",
      customShape: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [],
            },
          },
        ],
      },
    };
    this.openDrawer = this.openDrawer.bind(this);
    this.toggleClass = this.toggleClass.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.onchangeshape = this.onchangeshape.bind(this);
    this.onChangeLayertype = this.onChangeLayertype.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.searchRegion = this.searchRegion.bind(this);
    this.style = this.style.bind(this);
    this.resetmapzoom = this.resetmapzoom.bind(this);
    this.resetmapzoommobile = this.resetmapzoommobile.bind(this);
    this.Customlayer = this.Customlayer.bind(this);
    this.openCustomDrawer = this.openCustomDrawer.bind(this);
    this.getlayer = this.getlayer.bind(this);
    this.changeRasterLoader = this.changeRasterLoader.bind(this);
    this.getcustomlocation = this.getcustomlocation.bind(this);
    this.toggleLayer = this.toggleLayer.bind(this);
    this.ChangeBasemap = this.ChangeBasemap.bind(this);
    this.handlePointclick = this.handlePointclick.bind(this);
    this.handleSearchClick = this.handleSearchClick.bind(this);
  }
  onEachrua = (rua, layer) => {
    const ruaname = rua.properties.Dist_Name;
    layer.bindPopup(ruaname);
  };
  changeVectorLoader = (lat, lng) => {
    this.setState({
      loaderlatvector: lat,
      loaderlngvector: lng,
    });
  };
  changeRasterLoader = (lat, lng) => {
    this.setState({
      loaderlatraster: lat,
      loaderlngraster: lng,
    });
  };
  formatgeojson(json) {
    var new_json = {
      type: "FeatureCollection",
      name: "Telangana_Distrcit",
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
      },
      features: [json],
    };
    this.setState({
      selected_shape: new_json,
    });
  }

  async getCountEvents(geojson) {
    var bodyParams = {
      geojson: geojson.sourceTarget.feature.geometry,
      startdate: "2021-01-01",
      enddate: "2022-01-20",
    };
    try {
      const res = await axiosConfig.post(`/getpoints`, bodyParams);
      this.setState({
        areaValue: res.data[1].count,
        selectedRegion: geojson.sourceTarget.feature.properties.Dist_Name,
      });
      var area = geojsonArea.geometry(geojson.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState(
        {
          area: parseFloat(area).toFixed(2),
        },
        () => {
          this.child.current.showDrawer();
          this.child.current.setPointsChart();
        }
      );
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  getwarehouseDetails(geojson) {
    this.setState(
      {
        areaValue: geojson.capacity,
        selectedRegion: geojson.district,
      },
      () => {
        this.child.current.showDrawer();
      }
    );
  }
  openDrawer(e) {
    var area = 0.0;
    this.formatgeojson(e.sourceTarget.feature);
    if (this.props.CurrentLayer === "FIREEV") {
      this.getCountEvents(e);
    } else if (this.props.CurrentLayer === "WH") {
    } else if (this.props.CurrentLayer === "CP") {
      // this.CPchild.current.showDrawer();
    } else if (this.props.CurrentLayer === "WEATHER") {
      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
          selectedWeatherMandal: e.sourceTarget.feature.properties.Mandal_Nam,
        },
        () => {
          this.child.current.showDrawer();
          this.child.current.getWeathertrend("6months");
        }
      );
    } else if (this.props.CurrentLayer === "LULC") {
      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.showDrawer();
          this.child.current.getLULC();
        }
      );
    } else if (this.props.CurrentLayer === "DPPD") {
      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
        areaValue: parseFloat(
          e.sourceTarget.feature.properties["Slope Score"]
        ).toFixed(5),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.showDrawer();
          this.child.current.setPointsChart();
        }
      );
    } else if (this.props.CurrentLayer === "LAI_DPPD") {
      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
        areaValue: parseFloat(
          e.sourceTarget.feature.properties["DPPD score"]
        ).toFixed(5),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.showDrawer();
          // this.child.current.gettrendchart();
          this.child.current.settimerange("1Year");
        }
      );
    } else if (this.props.CurrentLayer === "NDVI_DPPD") {
      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
        areaValue: parseFloat(
          e.sourceTarget.feature.properties["DPPD score"]
        ).toFixed(5),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.showDrawer();
          // this.child.current.gettrendchart();
          this.child.current.settimerange("1Year");
        }
      );
    } else if (this.props.CurrentLayer === "LST_DPPD") {
      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
        areaValue: parseFloat(
          e.sourceTarget.feature.properties["DPPD score"]
        ).toFixed(5),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.showDrawer();
          this.child.current.settimerange("1Year");
        }
      );
    } else if (this.props.CurrentLayer === "NO2_DPPD") {
      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
        areaValue: parseFloat(
          e.sourceTarget.feature.properties["Slope Score"]
        ).toFixed(5),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.showDrawer();
          this.child.current.settimerange("1Year");
        }
      );
    } else if (this.props.CurrentLayer === "PM25_DPPD") {
      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
        areaValue: parseFloat(
          e.sourceTarget.feature.properties["Slope Score"]
        ).toFixed(5),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.showDrawer();
          this.child.current.settimerange("1Year");
        }
      );
    } else if (this.props.CurrentLayer === "SOC_DPPD") {
      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
        areaValue: parseFloat(
          e.sourceTarget.feature.properties.deviance
        ).toFixed(5),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.showDrawer();
        }
      );
    } else if (this.props.CurrentLayer === "POPULATION") {
      this.setState(
        {
          areaValue: parseInt(e.sourceTarget.feature.properties.zonalstat.sum),
          minVal: parseFloat(
            e.sourceTarget.feature.properties.zonalstat.min
          ).toFixed(2),
          maxVal: parseFloat(
            e.sourceTarget.feature.properties.zonalstat.max
          ).toFixed(2),
          meanVal: parseFloat(
            e.sourceTarget.feature.properties.zonalstat.mean
          ).toFixed(2),
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.settimerange("6months");
        }
      );

      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
      });

      this.child.current.showDrawer();
    } else if (this.props.CurrentLayer === "RWI") {
      this.setState({
        areaValue: parseFloat(
          e.sourceTarget.feature.properties.zonalstat.mean
        ).toFixed(2),
        minVal: parseFloat(
          e.sourceTarget.feature.properties.zonalstat.min
        ).toFixed(2),
        maxVal: parseFloat(
          e.sourceTarget.feature.properties.zonalstat.max
        ).toFixed(2),
        selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
      });

      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
      });

      this.child.current.showDrawer();
    } else {
      if (e.sourceTarget.feature.properties !== undefined) {
        this.setState(
          {
            areaValue: parseFloat(
              e.sourceTarget.feature.properties.zonalstat.mean
            ).toFixed(2),
            minVal: parseFloat(
              e.sourceTarget.feature.properties.zonalstat.min
            ).toFixed(2),
            maxVal: parseFloat(
              e.sourceTarget.feature.properties.zonalstat.max
            ).toFixed(2),
            selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
          },
          () => {
            this.child.current.settimerange("1Year");
          }
        );
      } else {
        console.log();
      }

      area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
      });

      this.child.current.showDrawer();
    }
  }
  async getCustomPointDetails(geojson) {
    var bodyParams = {
      geojson: geojson.features[0].geometry,
      startdate: "2021-01-01",
      enddate: "2022-01-20",
    };
    try {
      const res = await axiosConfig.post(`/getpoints`, bodyParams);
      var area = geojsonArea.geometry(geojson.features[0].geometry);
      area = area / 1000000;
      this.setState(
        {
          areaValue: res.data[1].count,
          selectedRegion: "Custom",
          area: parseFloat(area).toFixed(2),
        },
        () => {
          this.child.current.setPointsChart();
          this.child.current.showDrawer();
        }
      );
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  async getCustomlayerDetails(geojson) {
    var last_updated_date = new Date(this.props.LayerDescription.last_updated);
    var from_dd = String(last_updated_date.getDate()).padStart(2, "0");
    var from_mm = String(last_updated_date.getMonth() + 1).padStart(2, "0"); //January is 0!
    var from_yyyy = last_updated_date.getFullYear();
    var from_date = from_yyyy + "-" + from_mm + "-" + from_dd;
    var bodyParams = {
      geojson: geojson.features[0].geometry,
      date: from_date,
      parameter: this.props.CurrentLayer,
    };
    try {
      const res = await axiosConfig.post(`/getzstat?`, bodyParams);
      var area = geojsonArea.geometry(geojson.features[0].geometry);
      area = area / 1000000;
      this.setState(
        {
          areaValue: parseFloat(res.data.stat.mean).toFixed(2),
          minVal: parseFloat(res.data.stat.min).toFixed(2),
          maxVal: parseFloat(res.data.stat.max).toFixed(2),
          selectedRegion: "Custom",
          area: parseFloat(area).toFixed(2),
        },
        () => {
          this.child.current.gettrendchart();
          this.child.current.showDrawer();
        }
      );
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }

  openCustomDrawer(geojson) {
    this.setState({
      selected_shape: geojson,
    });
    if (this.props.CurrentLayer === "LULC") {
      var area = geojsonArea.geometry(geojson.features[0].geometry);
      area = area / 1000000;

      if (area > 150) {
        message.info("Maximum query area reached!");
      } else {
        this.child.current.getCUSTOMLULC(geojson);
      }
    } else if (this.props.CurrentLayer === "FIREEV") {
      this.getCustomPointDetails(geojson);
    } else {
      this.getCustomlayerDetails(geojson);
    }
  }
  style(feature) {
    var scale;
    if (this.props.CurrentLayer === "WEATHER") {
      return {
        weight: 1,
        opacity: 1,
        fillOpacity: 0.41,
        fillColor: "#a5a8a8",
        color: "#d65522",
      };
    }
    if (this.props.CurrentLayer === "LULC") {
      return {
        opacity: 1,
        color: "#d65522",
        fillOpacity: 0,
        weight: 0.5,
      };
    }
    if (this.props.CurrentLayer === "FIREEV") {
      return {
        opacity: 1,
        color: "#d65522",
        fillOpacity: 0,
        weight: 0.5,
      };
    }
    if (this.props.CurrentLayer === "CP") {
      return {
        opacity: 1,
        color: "#d65522",
        fillOpacity: 0,
        weight: 0.5,
      };
    }
    if (this.props.CurrentLayer === "WH") {
      return {
        opacity: 1,
        color: "#d65522",
        fillOpacity: 0,
        weight: 0.5,
      };
    } else if (
      this.props.currentLayerType === "Vector" &&
      this.state.layerUID === feature.properties.uid
    ) {
      return {
        opacity: 1,
        color: "#2bf527",
        fillOpacity: 1,
        weight: 6,
      };
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "DPPD"
    ) {
      if (this.props.CurrentRegion === "MANDAL") {
        scale = chroma
          .scale(this.props.DevcfvectorColor)
          .domain([-0.015, -0.01, -0.005, 0, 0.005, 0.01, 0.015]);
      } else {
        scale = chroma
          .scale(this.props.DevcfvectorColor)
          .domain([-0.08, -0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06, 0.08]);
      }

      if (feature.properties.zonalstat === undefined) {
        if (this.props.CurrentLayer === "DPPD") {
          return {
            // fillColor: this.getColor(feature.properties.zonalstat.mean),
            fillColor:
              this.props.CurrentLayer === "DPPD"
                ? scale(feature.properties["Slope Score"])
                : scale(feature.properties.zonalstat.mean),
            weight: 1,
            opacity: 1,
            color: "#d65522",
            fillOpacity: 1,
          };
        } else {
          console.log();
        }
      }
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "SOIL_M_DEV"
    ) {
      if (this.props.CurrentRegion === "MANDAL") {
        scale = chroma
          .scale(this.props.DevvectorColor)
          .domain([-1, -0.07, -0.05, -0.03, 0, 0.03, 0.05, 0.07, 1]);
      } else {
        scale = chroma
          .scale(this.props.DevvectorColor)
          .domain([-0.08, -0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06, 0.08]);
      }
      if (feature.properties.zonalstat !== undefined) {
        if (this.props.CurrentLayer === "SOIL_M_DEV") {
          return {
            // fillColor: this.getColor(feature.properties.zonalstat.mean),
            fillColor: scale(feature.properties.zonalstat.mean),
            weight: 1,
            opacity: 1,
            color: "#d65522",
            fillOpacity: 1,
          };
        } else {
          console.log();
        }
      }
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "LAI_DPPD"
    ) {
      scale = chroma
        .scale(this.props.DevvectorColor)
        .domain([
          -0.004, -0.003, -0.002, -0.001, 0, 0.001, 0.002, 0.003, 0.004,
        ]);
      if (this.props.CurrentLayer === "LAI_DPPD") {
        return {
          // fillColor: this.getColor(feature.properties.zonalstat.mean),
          fillColor:
            this.props.CurrentLayer === "DPPD"
              ? scale(feature.properties["Slope Score"])
              : this.props.CurrentLayer === "LAI_DPPD"
              ? scale(feature.properties["DPPD score"])
              : scale(feature.properties.zonalstat.mean),
          weight: 1,
          opacity: 1,
          color: "#d65522",
          fillOpacity: 1,
        };
      }
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "NDVI_DPPD"
    ) {
      scale = chroma
        .scale(this.props.DevvectorColor)
        .domain([-1, -0.0009, -0.0005, -0.0003, 0, 0.0003, 0.0005, 0.0009, 1]);
      if (this.props.CurrentLayer === "NDVI_DPPD") {
        return {
          // fillColor: this.getColor(feature.properties.zonalstat.mean),
          fillColor:
            this.props.CurrentLayer === "DPPD"
              ? scale(feature.properties["Slope Score"])
              : this.props.CurrentLayer === "NDVI_DPPD"
              ? scale(feature.properties["DPPD score"])
              : scale(feature.properties.zonalstat.mean),
          weight: 1,
          opacity: 1,
          color: "#d65522",
          fillOpacity: 1,
        };
      }
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "LST_DPPD"
    ) {
      scale = chroma
        .scale(this.props.DevvectorColor)
        .domain([-1, -0.0005, -0.0003, 0, 0.0003, 0.0005, 1]);
      if (this.props.CurrentLayer === "LST_DPPD") {
        return {
          // fillColor: this.getColor(feature.properties.zonalstat.mean),
          fillColor:
            this.props.CurrentLayer === "DPPD"
              ? scale(feature.properties["Slope Score"])
              : this.props.CurrentLayer === "LST_DPPD"
              ? scale(feature.properties["DPPD score"])
              : scale(feature.properties.zonalstat.mean),
          weight: 1,
          opacity: 1,
          color: "#d65522",
          fillOpacity: 1,
        };
      }
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "NO2_DPPD"
    ) {
      scale = chroma
        .scale(this.props.DevvectorColor)
        .domain([-1, -0.5, -0.3, 0, 0.3, 0.5, 1]);
      if (this.props.CurrentLayer === "NO2_DPPD") {
        return {
          // fillColor: this.getColor(feature.properties.zonalstat.mean),
          fillColor:
            this.props.CurrentLayer === "NO2_DPPD"
              ? scale(feature.properties["Slope Score"])
              : scale(feature.properties.zonalstat.mean),
          weight: 1,
          opacity: 1,
          color: "#d65522",
          fillOpacity: 1,
        };
      }
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "PM25_DPPD"
    ) {
      scale = chroma
        .scale(this.props.DevvectorColor)
        .domain([-1, -0.05, -0.03, 0, 0.03, 0.05, 1]);
      if (this.props.CurrentLayer === "PM25_DPPD") {
        return {
          // fillColor: this.getColor(feature.properties.zonalstat.mean),
          fillColor:
            this.props.CurrentLayer === "DPPD"
              ? scale(feature.properties["Slope Score"])
              : this.props.CurrentLayer === "PM25_DPPD"
              ? scale(feature.properties["Slope Score"])
              : scale(feature.properties.zonalstat.mean),
          weight: 1,
          opacity: 1,
          color: "#d65522",
          fillOpacity: 1,
        };
      }
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "SOC_DPPD"
    ) {
      scale = chroma
        .scale(this.props.DevvectorColor)
        .domain([-1, -0.7, -0.5, -0.3, 0, 0.3, 0.5, 0.7, 1]);
      if (this.props.CurrentLayer === "SOC_DPPD") {
        return {
          // fillColor: this.getColor(feature.properties.zonalstat.mean),
          fillColor:
            this.props.CurrentLayer === "DPPD"
              ? scale(feature.properties["Slope Score"])
              : this.props.CurrentLayer === "SOC_DPPD"
              ? scale(feature.properties.deviance)
              : scale(feature.properties.zonalstat.mean),
          weight: 1,
          opacity: 1,
          color: "#d65522",
          fillOpacity: 1,
        };
      }
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "RWI"
    ) {
      scale = chroma
        .scale(this.props.vectorColor)
        .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
      if (this.props.CurrentLayer === "RWI") {
        if (feature.properties.zonalstat === undefined) {
        } else {
          return {
            // fillColor: this.getColor(feature.properties.zonalstat.mean),
            fillColor:
              this.props.CurrentLayer === "DPPD"
                ? scale(feature.properties["Slope Score"])
                : this.props.CurrentLayer === "SOC_DPPD"
                ? scale(feature.properties.deviance)
                : scale(feature.properties.zonalstat.mean),
            weight: 1,
            opacity: 1,
            color: "#d65522",
            fillOpacity: 1,
          };
        }
      }
    }
    if (
      this.props.currentLayerType === "Vector" &&
      this.props.CurrentLayer === "LAI"
    ) {
      scale = chroma
        .scale(this.props.vectorColor)
        .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
      if (this.props.CurrentLayer === "LAI") {
        if (feature.properties.zonalstat === undefined) {
        } else {
          return {
            // fillColor: this.getColor(feature.properties.zonalstat.mean),
            fillColor:
              this.props.CurrentLayer === "DPPD"
                ? scale(feature.properties["Slope Score"])
                : this.props.CurrentLayer === "SOC_DPPD"
                ? scale(feature.properties.deviance)
                : scale(feature.properties.zonalstat.mean),
            weight: 1,
            opacity: 1,
            color: "#d65522",
            fillOpacity: 1,
          };
        }
      }
    }
    if (ltype === "Vector") {
      if (this.state.layerUID === feature.properties.uid) {
        return {
          opacity: 1,
          color: "#2bf527",
          fillOpacity: 1,
          weight: 1,
        };
      } else {
        if (feature.properties.zonalstat === undefined) {
          // if(this.props.CurrentLayer === "DPPD"){
          //   return {
          //     // fillColor: this.getColor(feature.properties.zonalstat.mean),
          //     fillColor: this.props.CurrentLayer === "DPPD" ? scale(feature.properties["Slope Score"]) : scale(feature.properties.zonalstat.mean),
          //     weight: 1,
          //     opacity: 1,
          //     color: "#d65522",
          //     fillOpacity: 1,
          //   };
          // }
          // else{
          //   console.log()
          // }
        } else {
          if (feature.properties.zonalstat.mean <= 1) {
            scale = chroma
              .scale(this.props.vectorColor)
              .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
          } else if (
            feature.properties.zonalstat.mean > 10 &&
            feature.properties.zonalstat.mean < 100
          ) {
            scale = chroma
              .scale(this.props.vectorColor)
              .domain([5, 10, 15, 20, 25, 30, 35, 40, 45]);
          } else {
            scale = chroma
              .scale(this.props.vectorColor)
              .domain([0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]);
          }
          return {
            // fillColor: this.getColor(feature.properties.zonalstat.mean),
            fillColor:
              this.props.CurrentLayer === "DPPD"
                ? scale(feature.properties["Slope Score"])
                : this.props.CurrentLayer === "LST_DPPD"
                ? scale(feature.properties["DPPD score"])
                : scale(feature.properties.zonalstat.mean),
            weight: 1,
            opacity: 1,
            color: "#d65522",
            fillOpacity: 1,
          };
        }
      }
    } else {
      if (this.state.layerUID === feature.properties.uid) {
        return {
          opacity: 1,
          color: "#2bf527",
          fillOpacity: 0,
          weight: 6,
        };
      } else {
        // this.props.showRaster();
        return {
          // opacity: 1,
          color: "#d65522",
          weight: 0.5,
          fillOpacity: 0,
        };
      }
    }
  }
  toggleClass() {
    const currentState = this.state.activeSearch;
    this.setState({ activeSearch: !currentState });
    if (window.innerWidth <= 768) {
      this.resetmapzoommobile();
    } else {
      this.resetmapzoom();
    }
  }
  toggleDropdown() {
    const currentState = this.state.active;
    this.setState({ active: !currentState });
  }
  onchangeshape(e) {
    if (e.target.value === "DISTRICT") {
      this.props.showRaster();
      this.props.setRegion("DISTRICT");
      this.map.removeLayer(this.state.editableFG);
      this.props.SetBoundary(DISTRICTBOUNDS);
      this.props.setMapKey();
      this.setState(
        {
          // currentBoundaryPattern: "DISTRICT",
          checked: false,
          regionList: districtRegions(),
          customStatus: false,
          regionkey: this.state.regionkey + 1,
          showlayertype: true,
          locpointerltlng: [60.732421875, 80.67555881973475],
          baseMap:
            "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
          attribution: "",
          baseMapselected: "Dark",
        },
        () => {
          this.getlayer();
        }
      );
    } else if (e.target.value === "MANDAL") {
      this.props.showRaster();
      this.map.removeLayer(this.state.editableFG);
      this.props.setRegion("MANDAL");
      this.props.setMapKey();
      this.props.SetBoundary(MANDALBOUNDS);
      this.setState(
        {
          // currentBoundaryPattern: "MANDAL",
          checked: false,
          regionList: mandalRegions(),
          locpointerltlng: [60.732421875, 80.67555881973475],
          customStatus: false,
          showlayertype: true,
          baseMap:
            "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
          attribution: "",
          baseMapselected: "Dark",
        },
        () => {
          this.getlayer();
        }
      );
    } else if (e.target.value === "CUSTOM") {
      this.props.setMapKey();
      this.props.setRegion("CUSTOM");
      this.setState({
        baseMap: "http://mt1.google.com/vt/lyrs=s&hl=pl&&x={x}&y={y}&z={z}",
        baseMapselected: "Satellite",
        // keyMAP: this.state.keyMAP + 1,
        attribution: "",
        checked: true,
        customStatus: true,
        showlayertype: false,
      });
      this.props.SetBoundary([]);
      if (this.props.LayerDescription.raster_status !== false) {
        this.props.hideRaster();
      }
    }
  }
  onChangeLayertype(e) {
    this.setState(
      {
        layerType: e.target.value,
      },
      () => {
        ltype = e.target.value;
        // this.getlayer();
        if (ltype === "Raster") {
          this.props.setLayerType("Raster");
          this.props.showRaster();
          window.layerType = "Raster";
        } else if (ltype === "Vector") {
          this.props.setLayerType("Vector");
          this.props.hideRaster();
          window.layerType = "Vector";
        }
      }
    );
  }
  onMouseOut() {
    this.props.setvalue(0.0);
    this.props.setplace("");
  }
  async getlayer() {
    this.setState({
      baseMap:
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      attribution: "",
      baseMapselected: "Dark",
    });
    if (this.props.CurrentRegion === "CUSTOM") {
      this.props.setRegion("DISTRICT");
      this.setState({
        regionkey: this.state.regionkey + 1,
        customStatus: false,
      });
    }

    this.changeVectorLoader(17.754639747121828, 79.05833831966801);
    if (this.props.CurrentLayer === "FIREEV") {
      this.setState({
        pointData: true,
      });
      var bodyParams = {
        startdate: "2021-01-01",
        enddate: "2022-01-20",
      };
      try {
        const res = await axiosConfig.post(
          `/getpointsindaterange?`,
          bodyParams
        );
        this.setState({
          pointVector: res.data,
        });
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
        this.changeRasterLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "WH") {
      this.setState({
        pointData: true,
      });
      try {
        const res = await axiosConfig.get(`/warehouses`);
        this.setState(
          {
            pointVector: res.data.data,
          },
          () => {}
        );
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
        this.changeRasterLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "CP") {
      this.setState({
        pointData: true,
      });
      try {
        const res = await axiosConfig.get(`/getmarketyard`);
        this.setState({
          pointVector: res.data.data,
        });
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
        this.changeRasterLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "WEATHER") {
      this.props.SetBoundary(MANDALBOUNDS);
      this.props.setMapKey();
      this.props.setRegion("MANDAL");
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
    } else if (this.props.CurrentLayer === "DPPD") {
      this.props.setLayerType("Vector");
      this.props.hideRaster();
      window.layerType = "Vector";
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "SOIL_M_DEV") {
      this.props.setLayerType("Vector");
      this.props.hideRaster();
      window.layerType = "Vector";
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "NO2_DPPD") {
      this.props.setLayerType("Vector");
      this.props.hideRaster();
      window.layerType = "Vector";
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "LST_DPPD") {
      this.props.setLayerType("Vector");
      this.props.hideRaster();
      window.layerType = "Vector";
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "LAI_DPPD") {
      this.props.setLayerType("Vector");
      this.props.hideRaster();
      window.layerType = "Vector";
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "NDVI_DPPD") {
      this.props.setLayerType("Vector");
      this.props.hideRaster();
      window.layerType = "Vector";
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "PM25_DPPD") {
      this.props.setLayerType("Vector");
      this.props.hideRaster();
      window.layerType = "Vector";
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "SOC_DPPD") {
      this.props.setLayerType("Vector");
      this.props.hideRaster();
      window.layerType = "Vector";
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer === "LULC") {
      if (this.props.CurrentRegion === "MANDAL") {
        this.props.SetBoundary(MANDALBOUNDS);
      }
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      this.props.setMapKey();
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
    } else {
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    }
  }
  onMouseOver(e) {
    if (this.props.CurrentLayer === "POPULATION") {
      this.props.setvalue(
        parseFloat(e.layer.feature.properties.zonalstat.sum / 1000000).toFixed(
          2
        )
      );
    } else if (this.props.CurrentLayer === "DPPD") {
      if (e.layer.feature.properties["Slope Score"] !== undefined) {
        this.props.setvalue(
          parseFloat(e.layer.feature.properties["Slope Score"]).toFixed(5)
        );
      } else {
        console.log();
      }
    } else if (this.props.CurrentLayer === "LST_DPPD") {
      if (e.layer.feature.properties["DPPD score"] !== undefined) {
        this.props.setvalue(
          parseFloat(e.layer.feature.properties["DPPD score"]).toFixed(5)
        );
      } else {
        console.log();
      }
    } else if (this.props.CurrentLayer === "NDVI_DPPD") {
      if (e.layer.feature.properties["DPPD score"] !== undefined) {
        this.props.setvalue(
          parseFloat(e.layer.feature.properties["DPPD score"]).toFixed(5)
        );
      } else {
        console.log();
      }
    } else if (this.props.CurrentLayer === "LAI_DPPD") {
      if (e.layer.feature.properties["DPPD score"] !== undefined) {
        this.props.setvalue(
          parseFloat(e.layer.feature.properties["DPPD score"]).toFixed(5)
        );
      } else {
        console.log();
      }
    } else if (this.props.CurrentLayer === "NO2_DPPD") {
      if (e.layer.feature.properties["Slope Score"] !== undefined) {
        this.props.setvalue(
          parseFloat(e.layer.feature.properties["Slope Score"]).toFixed(5)
        );
      } else {
        console.log();
      }
    } else if (this.props.CurrentLayer === "PM25_DPPD") {
      if (e.layer.feature.properties["Slope Score"] !== undefined) {
        this.props.setvalue(
          parseFloat(e.layer.feature.properties["Slope Score"]).toFixed(5)
        );
      } else {
        console.log();
      }
    } else if (this.props.CurrentLayer === "SOC_DPPD") {
      if (e.layer.feature.properties.deviance !== undefined) {
        this.props.setvalue(
          parseFloat(e.layer.feature.properties.deviance).toFixed(5)
        );
      } else {
        console.log();
      }
    } else if (this.props.CurrentLayer !== "LULC") {
      if (e.layer.feature.properties.zonalstat !== undefined) {
        if (isNaN(e.layer.feature.properties.zonalstat.mean) === true) {
          this.props.setvalue("N/A");
        } else {
          this.props.setvalue(
            parseFloat(e.layer.feature.properties.zonalstat.mean).toFixed(2)
          );
        }
      }
    }

    if (this.props.CurrentRegion === "MANDAL") {
      var mandal_name = e.layer.feature.properties.Mandal_Nam;
      if (typeof mandal_name !== "undefined") {
        this.props.setplace(mandal_name);
      } else {
        this.props.setplace("");
      }
    } else if (this.props.CurrentRegion === "DISTRICT") {
      var district_name = e.layer.feature.properties.Dist_Name;
      if (typeof district_name !== "undefined") {
        this.props.setplace(district_name);
      } else {
        this.props.setplace("");
      }
    }
  }
  searchRegion(e) {
    var selected_region = this.state.regionList[e.target.selectedIndex - 1];
    var current_reg = this.props.CurrentVector.features[e.target.selectedIndex];
    // console.log("SELETED REGION", selected_region);
    this.setState(
      {
        latnew: selected_region.centerPoint[1],
        longnew: selected_region.centerPoint[0],
        mapZoom: 9,
        layerUID: selected_region.uid,
      },
      () => {
        if (this.props.CurrentRegion === "MANDAL") {
          var mandal_name = current_reg.properties.Mandal_Nam;
          if (typeof mandal_name !== "undefined") {
            this.props.setplace(mandal_name);
            if (current_reg.properties.zonalstat !== undefined) {
              this.props.setvalue(
                parseFloat(current_reg.properties.zonalstat.mean).toFixed(2)
              );
            } else {
              this.props.setvalue("N/A");
            }
          } else {
            this.props.setplace("");
            this.props.setvalue(0);
          }
        } else if (this.props.CurrentRegion === "DISTRICT") {
          if (current_reg.properties.Dist_Name === undefined) {
            var district_name = current_reg.properties.Dist_Name;
          } else {
            console.log();
          }
          if (typeof district_name !== "undefined") {
            this.props.setplace(current_reg.properties.Dist_Name);
            if (current_reg.properties.zonalstat !== undefined) {
              this.props.setvalue(
                parseFloat(current_reg.properties.zonalstat.mean).toFixed(2)
              );
            } else {
              this.props.setvalue("N/A");
            }
          } else {
            this.props.setplace("");
            this.props.setvalue(0);
          }
        }
      }
    );
  }
  updateDimensions = () => {
    if (window.innerWidth <= 480) {
      this.setState({
        mapZoom: 6.5,
      });
    } else {
      this.setState({
        mapZoom: 7.5,
      });
    }
  };

  async handleSearchClick(place, map) {
    var lat_new = place.lat;
    var lon_new = place.lon;
    this.setState({
      locpointerltlng: [lat_new, lon_new],
      mapZoom: 9,
      latnew: lat_new,
      longnew: lon_new,
    });
  }

  componentDidMount() {
    this.updateDimensions();
    this.props.setvalue(0.74);
    this.props.setplace("Siddipet");
    this.changeVectorLoader(17.754639747121828, 79.05833831966801);
    this.changeRasterLoader(17.754639747121828, 79.05833831966801);
    this.getlayer();
    this.map = this.mapInstance.leafletElement;
  }
  resetmapzoom() {
    this.map.flyTo([18.1124, 79.0193], 7.5);
  }
  resetmapzoommobile() {
    this.map.flyTo([18.1124, 79.0193], 6.5);
  }
  ChangeBasemap(e) {
    /*
     There are multiple basemaps provided here.User can change map styles.
     Note that only one options can be used at a time.Just uncomment wanted option and you are
     good to go!.
      */
    if (e.target.value === "Dark") {
      /*
      Option 1 - Carto CDN Dark 
      */
      this.setState({
        baseMap:
          "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        attribution: "",
        baseMapselected: "Dark",
      });

      /*
      Option 2 - OSM Layer with base style (NOT DARK THEME)
      */
      // this.setState({
      //   baseMap:
      //     "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      //   attribution: "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors",
      //   baseMapselected: "Dark",
      // });

      /*
      Option 3 - StadiaMaps Dark 
      */
      // this.setState({
      //   baseMap:
      //     "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
      //   attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      //   baseMapselected: "Dark",
      // });
    }
    if (e.target.value === "Satellite") {
      /*
      Option 1 - Google Maps 
      */
      this.setState({
        baseMap: "http://mt1.google.com/vt/lyrs=s&hl=pl&&x={x}&y={y}&z={z}",
        attribution: "",
        baseMapselected: "Satellite",
      });

      /*
      Option 2 - OSM Layer with base style  (NOT SATELLITE THEME)
      */
      // this.setState({
      //   baseMap:
      //     "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      //   attribution: "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors",
      //   baseMapselected: "Dark",
      // });

      /*
      Option 3 - Esri Maps 
      */
      // this.setState({
      //   baseMap:
      //     "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      //   attribution:
      //     "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      //   baseMapselected: "Satellite",
      // });
      /*
      Option 4 - USGS Imagery 
      */
      // this.setState({
      //   baseMap:
      //     "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}",
      //   attribution:
      //     'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
      //   baseMapselected: "Satellite",
      // });
    }
    if (e.target.value === "Grey") {
      /*
      Option 1 - ARCGIS Imagery Grey 
      */
      this.setState({
        baseMap:
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution:
          '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a>',
        baseMapselected: "Grey",
      });

      /*
      Option 2 - OSM Layer with base style  (NOT GREY THEME)
      */
      // this.setState({
      //   baseMap:
      //     "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      //   attribution: "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors",
      //   baseMapselected: "Dark",
      // });

      /*
      Option 3 - Stadia maps Grey 
      */
      // this.setState({
      //   baseMap:
      //     "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
      //   attribution:
      //     '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      //   baseMapselected: "Grey",
      // });
    }
  }
  Customlayer(e) {
    e.layer.on("click", () => {
      this.child.current.showDrawer();
    });
    if (this.state.editableFG === []) {
      this.setState({
        editableFG: e.layer,
      });
    } else {
      this.map.removeLayer(this.state.editableFG);
      this.setState({
        editableFG: e.layer,
      });
    }
    const shapePoints = e.layer._latlngs;
    var newpoints = [];
    shapePoints[0].map((points, index) =>
      newpoints.push([points.lng, points.lat])
    );
    newpoints.push([shapePoints[0][0].lng, shapePoints[0][0].lat]);
    var polygon_point = polygon([newpoints]);
    var polygon_centroid = centroid(polygon_point);
    this.setState(
      {
        customShape: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                centroid: polygon_centroid.geometry.coordinates,
              },
              geometry: {
                type: "Polygon",
                coordinates: [newpoints],
              },
            },
          ],
        },
      },
      () => {
        this.openCustomDrawer(this.state.customShape);
      }
    );
  }
  getcustomlocation(lat, lon) {
    if (lat !== undefined && lon !== undefined) {
      if (lat !== undefined && lon !== undefined) {
        this.setState({
          locpointerltlng: [lat, lon],
          mapZoom: 9,
          latnew: lat,
          longnew: lon,
        });
      }
    }
  }
  toggleLayer(e) {
    if (e.target.value === "show") {
      this.props.showRaster();
    } else {
      this.props.hideRaster();
    }
  }
  handlePointclick(name) {
    if (this.props.CurrentLayer === "CP") {
      this.CPchild.current.showDrawer(name);
    }
  }
  checkRadius(capacity) {
    var radius = 3000 * Math.log(capacity / 100);
    if (radius > 0) {
      return 20 * Math.log(parseInt(radius) / 10000000);
    } else {
      return 5000;
    }
  }

  checkIcon() {
    if (this.props.CurrentLayer === "FIREEV") {
      return MarkerIcon;
    } else {
      return MarkerIcon2;
    }
  }
  render() {
    return (
      <React.Fragment>
        <div className="header">
          <Header />
        </div>
        <Sidebar
          changeCurrentLayer={this.getlayer}
          resetZoom={this.resetmapzoom}
          resetZoommobile={this.resetmapzoommobile}
        />
        <div className="legend-mobile">
          <LegendMobile />
        </div>
        <BottomNav
          className="bottom-navigation"
          changeCurrentLayer={this.getlayer}
          resetZoom={this.resetmapzoommobile}
        />
        <div
          className="btn-home"
          style={{ zIndex: "999" }}
          onClick={this.resetmapzoom}
        >
          <BiHomeAlt />
        </div>
        <div
          className="btn-home-mobile"
          style={{ zIndex: "999" }}
          onClick={this.resetmapzoommobile}
        >
          <BiHomeAlt />
        </div>

        <div className="btn-toggleBaseMap">
          <div class="row">
            <div
              class="col-sm-4"
              style={{
                color: "#FFFFFF",
                position: "relative",
                top: "17px",
                left: "8px",
              }}
            >
              Theme
            </div>
            <div class="col-sm-8">
              <FormGroup>
                <Input
                  type="select"
                  name="select"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    "backdrop-filter": "blur(81.9048px)",
                    borderRadius: "3.65646px",
                    color: "#fff",
                    border: "none",
                    // height: "43px",
                    width: "139px",
                    position: "relative",
                    top: "11px",
                    left: "8px",
                  }}
                  value={this.state.baseMapselected}
                  onChange={this.ChangeBasemap}
                >
                  <option value="Dark">Dark</option>
                  <option value="Satellite">Satellite</option>
                  <option value="Grey">Grey</option>
                </Input>
              </FormGroup>
            </div>
          </div>
        </div>
        <div className="btn-toggle">
          <div class="row">
            <div
              class="col-sm-4"
              style={{
                color: "#FFFFFF",
                position: "relative",
                top: "11px",
                left: "0px",
              }}
            >
              Type
            </div>
            <div class="col-sm-8" style={{ position: "relative", top: "4px" }}>
              <Radio.Group
                options={options}
                onChange={this.onChangeLayertype}
                value={this.state.layerType}
                optionType="button"
                buttonStyle="solid"
                disabled={
                  this.state.showlayertype
                    ? this.props.LayerDescription.vector_status === false
                      ? true
                      : false ||
                        this.props.LayerDescription.raster_status === false
                      ? true
                      : false
                    : true
                }
              />
            </div>
          </div>
        </div>
        <div
          // className={
          //   this.state.activeSearch ? "selection" : "selection-collapsed"
          // }
          className="selection"
        >
          <div class="row">
            <div
              class="col-sm-4"
              style={{
                color: "#FFFFFF",
                position: "relative",
                top: "17px",
                left: "20px",
              }}
            >
              Boundary
            </div>
            <div class="col-sm-8">
              {" "}
              <FormGroup
              // style={
              //   this.state.layerType === "Vector" ? { cursor: "not-allowed" } : {}
              // }
              >
                <Input
                  type="select"
                  name="select"
                  style={{
                    position: "relative",
                    top: "11px",
                    left: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    "backdrop-filter": "blur(81.9048px)",
                    /* Note: backdrop-filter has minimal browser support */

                    borderRadius: "3.65646px",
                    color: "#fff",
                    border: "none",
                    width: "139px",
                  }}
                  disabled={
                    this.props.CurrentLayer === "WEATHER" ? true : false
                    // || this.state.layerType === "Vector"
                    // ? true
                    // : false
                  }
                  key={this.state.regionkey}
                  value={this.props.CurrentRegion}
                  onChange={(e) => this.onchangeshape(e)}
                >
                  <option value="DISTRICT" key="DISTRICT">
                    District
                  </option>
                  <option value="MANDAL" key="MANDAL">
                    Mandal
                  </option>
                  <option
                    key="CUSTOM"
                    value="CUSTOM"
                    disabled={
                      this.props.LayerDescription.showcustom === false
                        ? true
                        : false
                    }
                  >
                    Custom
                  </option>
                </Input>
              </FormGroup>
            </div>
          </div>
        </div>

        <div
          // className={
          //   this.state.activeSearch ? "search-card" : "search-card-collapsed"
          // }
          className="search-card-collapsed"
        >
          <div className="row" style={{ padding: "0px" }}>
          <div className="col" style={{ padding: "0px" }}>
              {/* {this.state.activeSearch ? (
                <BiSearch className="search-icon" onClick={this.toggleClass} />
              ) : (
                <BiX className="search-close" onClick={this.toggleClass} />
              )} */}
               <BiSearch className="search-icon" onClick={this.toggleClass} />
            </div>
            <div className="col search" style={{ paddingLeft: "0px" }}>
              <div
                style={
                  this.state.customStatus === true ? { display: "none" } : {}
                }
              >
                <select
                  className="search-input"
                  onChange={this.searchRegion}
                  placeholder="Search Region"
                  style={{ width: 230, fontSize: "11px" }}
                >
                  <option className="search-list">Select Region</option>
                  {this.state.regionList.length > 0 &&
                    this.state.regionList.map((item, index) => (
                      <option
                        className="search-list"
                        value={item.dname}
                        key={index}
                      >
                        {item.dname}
                      </option>
                    ))}
                </select>
              </div>
              <div
                style={
                  this.state.customStatus === true ? {} : { display: "none" }
                }
              >
                <div style={{ marginLeft: "50px", marginTop: "7px" }}>
                  {/* 
                  By default, Google Search API is used. Another opensource search option 
                  is also provided(Nominatim). If needed, uncomment NominatimSearch function
                  and comment SearchPlace component. While using Nominatim please ensure that line 39
                  (import function) is also uncommented !.
                  */}
                  <SearchPlace searchArea={this.getcustomlocation} />
                  {/* 
                   <NominatimSearch
                      className="nominatim-search"
                      placeholder="Search field location"
                      type="text"
                      countryCodes="in"
                      onSelect={this.handleSearchClick}
                    ></NominatimSearch> 
                     */}
                </div>
              </div>
            </div>
          </div>
        </div>
        {this.props.CurrentLayer === "CP" ? (
          <CPDrawerModal ref={this.CPchild} district={this.state} />
        ) : (
          <DrawerModal ref={this.child} district={this.state} />
        )}

        <div className="footer-links">
          <Footer />
        </div>
        <Map
          ref={(e) => {
            this.mapInstance = e;
          }}
          className="map"
          style={MAP_STYLES}
          viewport={this.state.RGBViewPort}
          maxZoom={18}
          minZoom={6}
          zoomSnap={0.25}
          zoomDelta={0.25}
          zoom={this.state.mapZoom}
          center={[this.state.latnew, this.state.longnew]}
          zoomControl={false}
        >
          <Marker
            position={[this.state.loaderlatvector, this.state.loaderlngvector]}
            icon={LoaderIcon}
          ></Marker>
          <Marker position={this.state.locpointerltlng} icon={LocIcon} />
          <Marker
            position={[this.state.loaderlatraster, this.state.loaderlngraster]}
            icon={LoaderIcon}
          ></Marker>

          <GeoJSON
            style={this.style}
            data={this.props.CurrentVector.features}
            onMouseOver={
              this.props.currentLayerType === "Vector"
                ? this.onMouseOver
                : console.log()
            }
            onMouseOut={
              this.props.currentLayerType === "Vector"
                ? this.onMouseOver
                : console.log()
            }
            icon={"text"}
            onclick={this.openDrawer}
            key={this.props.MapKey}
            zIndex={999}
          />

          {this.state.pointVector.features.map((point, index) => (
            <Marker
              position={[point.properties.latitude, point.properties.longitude]}
              radius={4}
              fillOpacity={1}
              fillColor={"#d10a25"}
              stroke={false}
              icon={MarkerIcon2}
              key={index}
              direction="top"
              onClick={(e) => {
                this.handlePointclick(point.properties.name);
              }}
            >
              {this.props.CurrentLayer === "FIREEV" ? (
                <Tooltip
                  style={
                    this.props.CurrentLayer === "FIREEV"
                      ? {}
                      : { display: "none" }
                  }
                >
                  <a href={() => false}>
                    FRP : {point.properties.frp}
                    <br />
                    Date : {point.properties.acq_date}
                  </a>
                </Tooltip>
              ) : (
                <Tooltip
                  style={
                    this.props.CurrentLayer === "WH"
                      ? {}
                      : { display: "none" } &&
                        this.props.CurrentLayer === "FIREEV"
                      ? { display: "none" }
                      : {}
                  }
                >
                  <a
                    href={() => false}
                    style={
                      this.props.CurrentLayer === "CP"
                        ? { display: "none" }
                        : { textAlign: "left" }
                    }
                  >
                    Capacity : {point.properties.capacity} MT
                    <br />
                    Warehouse Name : {point.properties.warehouse}
                    <br />
                    District : {point.properties.district}
                  </a>
                  <a
                    href={() => false}
                    style={
                      this.props.CurrentLayer === "CP"
                        ? {}
                        : { display: "none" }
                    }
                  >
                    Market Yard : {point.properties.name}
                  </a>
                </Tooltip>
              )}
            </Marker>
          ))}

          <GeoRaster
            onRef={(ref) => (this.rasterChild = ref)}
            changeLoader={this.changeRasterLoader}
          />

          <ZoomControl position="bottomright" className="btn-zoomcontrol" />
          <TileLayer
            url={this.state.baseMap}
            attribution={this.state.attribution}
          />
          <LayersControl position="topright"></LayersControl>
          <div style={{ zIndex: -999 }}>
            <FeatureGroup>
              <EditControl
                position="topright"
                onCreated={this.Customlayer}
                style={{ marginBottom: "179px" }}
                draw={{
                  rectangle: this.state.customStatus,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                  polygon: this.state.customStatus,
                }}
                edit={{
                  edit: false,
                  remove: this.state.customStatus,
                }}
              />
            </FeatureGroup>
          </div>
        </Map>
      </React.Fragment>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(map);
