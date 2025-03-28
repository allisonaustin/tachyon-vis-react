import { Col, Layout, Row, Spin } from "antd";
import React, { useEffect, useState } from 'react';
import './App.css';
import DR from './components/DRView.js';
import FeatureView from './components/FeatureView.js';
import MRDMD from './components/MrDMDView.js';
import TimelineView from './components/TimelineView.js';

const { Header, Content } = Layout;

function App() {
  const [FCs, setFCs] = useState(null);
  const [DRTData, setDRTData] = useState(null);
  const [mgrData, setMgrData] = useState(null);
  const [perfData, setPerfData] = useState([]);
  const [triggerData, setTriggerData] = useState([]);
  const [nodeData, setNodeData] = useState(null);
  const [zScores, setzScores] = useState(null);
  const [baselines, setBaselines] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState('mgr/novadaq-far-mgr-01-full.json');
  const [selectedPoints, setSelectedPoints] = useState(["novadaq-far-farm-06", "novadaq-far-farm-07","novadaq-far-farm-08", "novadaq-far-farm-09","novadaq-far-farm-10","novadaq-far-farm-12","novadaq-far-farm-130","novadaq-far-farm-131", "novadaq-far-farm-133","novadaq-far-farm-142","novadaq-far-farm-150", "novadaq-far-farm-16","novadaq-far-farm-164", "novadaq-far-farm-170","novadaq-far-farm-180","novadaq-far-farm-181","novadaq-far-farm-184", "novadaq-far-farm-189", "novadaq-far-farm-20","novadaq-far-farm-28", "novadaq-far-farm-35","novadaq-far-farm-59","novadaq-far-farm-61","novadaq-far-farm-78","novadaq-far-farm-92"]);
  const [selectedDims, setSelectedDims] = useState(['bytes_out', 'cpu_system', 'proc_run', 'proc_total']);
  const [bStart, setBStart] = useState('2024-02-21 14:47:30Z')
  const [bEnd, setBEnd] = useState('2024-02-21 22:00:00Z')
  const [recompute, setRecompute] = useState(0)
  const [baselineEdit, setBaselineEdit] = useState(false);
  
  useEffect(() => {
    Promise.all([ 
        getMgrData(selectedFile),
        getNodeData(selectedDims),
        getDRTimeData()
      ])
      .then(() => {
        console.log("Data fetched successfully");
        getMrDMD();
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []); // TODO: dependency on [selectedDims]

  const getNodeData = async (selectedCols) => {
    try {
      const response = await fetch(`http://127.0.0.1:5010/nodeData/${selectedCols}`);
      const data = await response.json();
      if (response.ok) { 
        setNodeData(data)
      } else {
        setNodeData(null);   
        setError("Failed to fetch data. Please check that the server is running.");
      }
    } catch (error) {
      setNodeData(null)
      setError("Failed to fetch data. Please check that the server is running.");
      console.error(error);     
    }
  };

  const getDRTimeData = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5010/drTimeData`);
      const data = await response.json();
      
      if (response.ok) {
        setDRTData(data.dr_features);
        setFCs(data.feat_contributions);
        setError(null); 
      } else {
        setDRTData(null);  
        setError("Failed to fetch DR data. Please check that the server is running.");
      }

    } catch (error) {
      setDRTData(null);    
      setError("Failed to fetch DR data. Please check that the server is running.");
      console.error(error);     
    }
  };

  const getMrDMD = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5010/mrdmd/${selectedPoints}/${bStart}/${bEnd}/${selectedDims}/${recompute}`);
      const data = await response.json();
      if (response.ok) { 
        setzScores(data.zscores)
        setBaselines(data.baselines)
      } else {
        setzScores(null);   
        setBaselines(null)
        setError("Failed to fetch data. Please check that the server is running.");
      }
    } catch (error) {
      setzScores(null)
      setBaselines(null)
      setError("Failed to fetch data. Please check that the server is running.");
      console.error(error);     
    }
  };

  const getMgrData = async (filePath) => {
    if (!filePath) return;
    try {
      const response = await fetch(`http://127.0.0.1:5010/mgrData`);
      const data = await response.json();
      if (response.ok) {
        setMgrData(data);  
        setError(null); 
        const trigFilt = Object.keys(data)
          .filter((key) => (
              key.includes('P1') &&
              (key.includes('Data Driven') || (key.includes('Trigger'))) &&
              !key.includes('Activity') &&
              !key.includes('prescale')
            ))
          .reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
          }, {});
      // Filter data for performance (keys not containing 'P1')
      const perfFilt = Object.keys(data)
        .filter((key) => !key.includes('P1'))
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      setTriggerData(trigFilt);
      setPerfData(perfFilt);
      } else {
        setMgrData(null);  
        setTriggerData(null);   
        setPerfData(null);   
        setError("Failed to fetch data. Please check that the server is running.");
      }
    } catch (error) {
      setMgrData(null);    
      setTriggerData(null);
      setPerfData(null);
      setError("Failed to fetch data. Please check that the server is running.");
      console.error(error);     
    }
  };

  const onFileChange = (newFile) => {
    setSelectedFile(newFile); 
    getMgrData(newFile);
  };

  return (
    <Layout style={{ height: "100vh", padding: "10px" }}>
      <Content style={{ marginTop: "10px" }}>
          <Row gutter={[8, 8]}>
            <Col span={14}>
              {((!nodeData) || (!mgrData)) ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                <TimelineView 
                    mgrData={mgrData}
                    bStart={bStart}
                    bEnd={bEnd}
                    nodeDataStart={new Date(nodeData?.data[0]?.timestamp)}
                    nodeDataEnd={new Date(nodeData?.data[nodeData?.data.length - 1]?.timestamp)}
                  />
                  )}
                {((!nodeData) && (!baselines)) ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <FeatureView 
                    data={nodeData} 
                    timeRange={[new Date(bStart), new Date(bEnd)]}
                    selectedDims={selectedDims}
                    selectedPoints={selectedPoints}
                    fcs={FCs}
                    setSelectedDims={setSelectedDims}
                    baselines={baselines}
                    setBaselineEdit={setBaselineEdit}
                  />
              )}
            </Col>
              <Col span={8}>
                {((!DRTData) && (!FCs)) ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <div>
                      <DR 
                        data={DRTData} 
                        type="time" 
                        setSelectedPoints={setSelectedPoints} 
                        selectedPoints={selectedPoints} 
                      />
                  </div>
                  )}
                  {(!zScores) ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
                      <Spin size="large" />
                    </div> ) : (
                    <MRDMD 
                      data={zScores} 
                  />
                  )}
              </Col>
          </Row>
      </Content>
    </Layout>
  );
}

export default App;
