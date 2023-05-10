import React, { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./utilities";
import useWebSocket, { ReadyState } from 'react-use-websocket';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [countDown, setCountDown] = useState(0)
  const [msg, setMsg] = useState("")
  const [msgCalibrate, setMsgCalibrate] = useState(false)

  var countDownVar = 0

  //Public API that will echo messages sent to it back to the client
  //var socketUrl = 'ws://localhost:8000/ws';
  //const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  var flag_movement = false
  var flag_down_error = false
  var flag_initial_position = false

  //var countDown = 0

  var currentPoseLeftKnee = null
  var currentPoseLeftHip = null

  var calibrationLeftKnee = null
  var calibrationLeftHip = null

  useEffect(() => {
    calibrate()
    runPosenet();
  }, [])

  function calibrate() {
    setTimeout(() => {
      console.warn("CALIBRADO")
      calibrationLeftKnee = currentPoseLeftKnee
      calibrationLeftHip = currentPoseLeftHip
      setMsgCalibrate(true)
    }, 5000);
  }

  //const handleClickSendMessage = useCallback(() => sendMessage(countDown), []);

  // const connectionStatus = {
  //   [ReadyState.CONNECTING]: 'Connecting',
  //   [ReadyState.OPEN]: 'Open',
  //   [ReadyState.CLOSING]: 'Closing',
  //   [ReadyState.CLOSED]: 'Closed',
  //   [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  // }[readyState];

  //  Load posenet
  const runPosenet = async () => {
    const net = await posenet.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.8,
    });
    //
    setInterval(() => {
      detect(net);
    }, 200);
  };

  function idlePosition() {
    var negativeValue = calibrationLeftHip - 30
    var positiveValue = calibrationLeftHip + 30
    if (currentPoseLeftHip > negativeValue && currentPoseLeftHip < positiveValue)
      flag_initial_position = true
    else
      flag_initial_position = false
  }

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Make Detections
      const pose = await net.estimateSinglePose(video);

      console.log(pose.keypoints[13])

      currentPoseLeftKnee = pose.keypoints[13].position.y
      currentPoseLeftHip = pose.keypoints[11].position.y

      idlePosition()

      //Check if points is visible
      if (pose.keypoints[13].score > 0.50 && pose.keypoints[11].score > 0.50) {

        if (msg == "Joelho e quadril não visiveis")
          setMsg("Sua posição está boa")

        var calc = calibrationLeftKnee - currentPoseLeftHip

        if (calc < 30 && calc > 0) {
          flag_movement = true
        }

        // else if (calc < 0) {
        //   setMsg("Desceu demasiado")
        //   flag_down_error = true
        // }

        else {
          if (flag_movement) {
            countDownVar = countDownVar + 1
            setCountDown(countDownVar)
            setMsg("Perfeito")
          }
          flag_movement = false
        }

        //handleClickSendMessage()

        console.log(countDown)

        // drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);
      } else {
        setMsg("Joelho e quadril não visiveis")
      }
    }
  };

  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    drawKeypoints(pose["keypoints"], 0.6, ctx);
    drawSkeleton(pose["keypoints"], 0.7, ctx);
  };

  function colorMsg() {
    if (msg == "Desceu demasiado")
      return "red"
    else if (msg == "Sua posição está boa")
      return "orange"
    else if (msg == "Joelho e quadril não visiveis")
      return "red"
    else
      return "green"
  }

  return (
    <div className="App">
      <header className="App-header">
        <div style={{
          position: "absolute",
          right: 50,
          backgroundColor: "white",
          height: 480,
          width: 320,
          borderRadius: 20
        }}>
          <view >
            <img
              src="logo-colored.png" style={{ maxHeight: 200, maxWidth: 200 }} />
          </view>
          <h2>Resultados</h2>
          <div style={{ flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
            <h3 style={{ color: "gray" }}>Contagem: </h3>
            <h3>{countDown + "/10"}</h3>
          </div>
          <div style={{ flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
            <h3 style={{ color: "gray" }}>Status: </h3>
            <h3>{msgCalibrate ? "Calibrado" : "Calibrando"}</h3>
          </div>
          <div style={{ flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
            <h4 style={{ color: colorMsg }}>{msg}</h4>
          </div>
        </div>
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 200,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
            borderRadius: 20
          }}
        />

        {/* <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        /> */}
      </header>
    </div>
  );
}

export default App;