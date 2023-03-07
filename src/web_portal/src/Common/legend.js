import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import ColorPicker from "./ColorPicker";
import Moment from "moment";
import { BiNavigation } from "react-icons/bi";

var valueKey = 1;

function Legend() {
  let setval = useSelector((state) => state.setval);
  let setplace = useSelector((state) => state.setplace);
  let currentLayer = useSelector((state) => state.CurrentLayer);
  let currentLayerDesc = useSelector((state) => state.LayerDescription);
  let hoverLatLon = useSelector((state) => state.Hoverlatlon);
  let currentlayerType = useSelector((state) => state.CurrentLayerType);
  useEffect(() => {
    valueKey = valueKey + 1;
  }, [setval]);

  return (
    <div className="legend-section">
      <div className="container">
        <div
          className="row"
          style={{
            textAlign: "left",
          }}
        >
          
          <div className="w-100"></div>
          <div className="col" style={{ color: "#FFFFFF", fontSize:"24px", marginTop:"20px", marginBottom:"10px" }}>
           {currentLayer === "DPPD" ? "CROP FIRES " : 
           currentLayer === "SOIL_M_DEV" ? "SOIL MOISTURE" : 
           currentLayer === "LST_DPPD" ? "LST"  : 
           currentLayer === "LAI_DPPD" ? "LAI"  : 
           currentLayer === "NO2_DPPD" ? "NO2"  : 
           currentLayer === "NDVI_DPPD" ? "NDVI"  : 
           currentLayer === "PM25_DPPD" ? "PM2.5"  :
           currentLayer === "PM25" ? "PM2.5"  : 
           currentLayer === "SOC_DPPD" ? "SOC"  :
           currentLayer}
          
          </div>
          <div className="w-100"></div>
          <div className="col"><div className="col" style={{ fontSize: "24px", color: "#FFFFFF", marginBottom:"10px" }}>
            <span
              style={currentLayer === "LULC" ? { display: "none" } : {}}
              key={valueKey}
            >

              {currentLayer === "POPULATION" ? parseInt(setval) : setval}{" "}
              <span style={{ fontSize: "18px" }}>{currentLayerDesc.unit}</span>
            </span>
          </div></div>

          <div className="w-100"></div>
          <div className="col"><div className="col" style={{ fontSize: "14px", color: "#FFFFFF" }}>
        
          {Moment(currentLayerDesc.last_updated)
              .format("DD-MM-YYYY")
              .slice(0, 10)}
           
          </div></div>
          <div className="w-100"></div>
          <p>
          {currentlayerType === "Raster" ? (
            <div className="col" style={{ color: "#DEDEDE" }}>
              {hoverLatLon}
              <BiNavigation style={{ transform: "translate(1px, -2px)" }} />
            </div>
          ) : (
            <div className="col" style={{ color: "#DEDEDE" }}>
              {setplace}
            </div>
          )}
          </p>
          <div className="w-100"></div>
          <div className="col">
            <ColorPicker />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Legend;
