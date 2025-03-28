import { Checkbox, List } from "antd";
import React from 'react';
import FeatureContributionBarGraph from "./FeatureContributionBarGraph";

export default function FeatureSelect({ data, processed, selectedPoints, selectedDims, setSelectedDims, featureData, setFeatureData, fcs }) {
    const handleCheckboxChange = (key) => {
    const existingColumns = Object.keys(featureData);
    if (!existingColumns.includes(key)) {
        fetch(`http://127.0.0.1:5010/nodeData/${key}`)
            .then(response => response.json())
            .then(newData => {
                if (newData.data.length === featureData[Object.keys(featureData)[0]].length) {
                    const processedColumn = newData.data.map(row => ({
                        value: row[key],  
                        timestamp: new Date(row.timestamp), 
                        nodeId: row.nodeId
                    }));    
                    setFeatureData(featureData => ({
                        ...featureData,
                        [key]: processedColumn  // new column
                    }));
                } else {
                    console.error(`Data length mismatch: expected ${processed[Object.keys(processed)[0]].length}, got ${newData.data.length}`);
                }
            })
            .catch(error => console.error('Error fetching data:', error));
    }
    setSelectedDims(prevSelectedDims => {
        if (prevSelectedDims.includes(key)) {
            return prevSelectedDims.filter(dim => dim !== key);
        } else {
            return [...prevSelectedDims, key];
        }
    });
  }

  return (
    <List
      style={{ width: "100%", maxWidth: 500, overflowY: "scroll", maxHeight: 450, marginRight: "10px" }}
      bordered
      dataSource={data.features}
      renderItem={(key, index) => {
      return (
          <List.Item key={key} style={{ display: "flex", alignItems: "center", padding: "5px 10px" }}>
          
          <div style={{display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex'}}>
                  <Checkbox
                      // TODO: refactor checkbox state so FeatureContributionBarGraph doesn't rerender on checkbox change
                      checked={selectedDims.includes(key)}
                      onChange={() => handleCheckboxChange(key)}
                      style={{ marginRight: "10px" }}
                  />
                  <span style={{ flexGrow: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {key}
                  </span>
              </div>
              <FeatureContributionBarGraph graphId={`${key.replace(/\s/g, "_")}-feat-graph`} feature={key}
                //TODO: fix issue with less FCs than available data features
                fcData={!fcs || data.features.indexOf(key) === -1 || data.features.indexOf(key) >= fcs.agg_feat_contrib_mat.length ? []
                            : fcs.order_col.map(clusterId => ({
                                cluster: clusterId,
                                value: fcs.agg_feat_contrib_mat[data.features.indexOf(key)][clusterId]
                            }))}/>
          </div>
          </List.Item>
      );
      }}
    />
  )
}