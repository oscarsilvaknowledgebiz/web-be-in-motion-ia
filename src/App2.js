import React, { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./utilities";
import useWebSocket, { ReadyState } from 'react-use-websocket';

function App2() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    const [countDown, setCountDown] = useState(0)
    const [countDown2, setCountDown2] = useState(0)
    const [msg, setMsg] = useState("")
    const [msgCalibrate, setMsgCalibrate] = useState(false)
    const [calcShow, setCalcShow] = useState(0)

    var countDownVar = 0
    var countDownVar2 = 0
    var msgCurrent = ""

    //Public API that will echo messages sent to it back to the client
    //var socketUrl = 'ws://localhost:8000/ws';
    //const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

    var flag_movement = false
    var flag_movement_2 = false
    var flag_down_error = false
    var flag_initial_position = false

    //var countDown = 0

    var currentPoseLeftKnee = null
    var currentPoseLeftHip = null
    var currentPoseLeftAnkle = null
    var currentPoseRightAnkle = null
    
    var currentPoseLeftShoulder = null
    var currentPoseLeftWrist = null

    var currentPoseRightShoulder = null
    var currentPoseRightWrist = null

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

    function checkAnkle() {
        setCalcShow(Math.abs(currentPoseLeftAnkle - currentPoseRightAnkle))
        if ((currentPoseLeftAnkle - currentPoseRightAnkle) > 10) {
            return true
        } else {
            return false
        }
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

            currentPoseLeftKnee = pose.keypoints[13].position.y
            currentPoseLeftHip = pose.keypoints[11].position.y
            currentPoseLeftAnkle = pose.keypoints[15].position.y
            currentPoseRightAnkle = pose.keypoints[16].position.y

            currentPoseLeftShoulder = pose.keypoints[5].position.y
            currentPoseLeftWrist = pose.keypoints[9].position.y

            console.warn(pose)

            currentPoseRightShoulder = pose.keypoints[6].position.y
            currentPoseRightWrist = pose.keypoints[10].position.y

            idlePosition()

            //Check if points is visible
            if (pose.keypoints[5].score > 0.40 && pose.keypoints[9].score > 0.40) {

                if (msgCurrent == "Braços não visiveis") {
                    setMsg("Sua posição está boa")
                    msgCurrent = "Sua posição está boa"
                }

                // if (checkAnkle()) {
                //     setMsg("Não toque o pé esquerdo no chão")
                //     msgCurrent = "Não toque o pé esquerdo no chão"
                // } 
                else {
                    setMsg("")
                    msgCurrent = ""
                }

                var calc = currentPoseLeftWrist - currentPoseLeftShoulder

                if (calc < .50) {
                    flag_movement = true
                }

                else {
                    if (flag_movement) {
                        countDownVar = countDownVar + 1
                        setCountDown(countDownVar)
                        setMsg("Perfeito")
                        msgCurrent = "Perfeito"
                    }
                    flag_movement = false
                }

                var calc2 = currentPoseRightWrist - currentPoseRightShoulder

                if (calc2 < .50) {
                    flag_movement_2 = true
                }

                else {
                    if (flag_movement_2) {
                        countDownVar2 = countDownVar2 + 1
                        setCountDown2(countDownVar2)
                        setMsg("Perfeito")
                        msgCurrent = "Perfeito"
                    }
                    flag_movement_2 = false
                }

                //handleClickSendMessage()

                console.log(countDown)

                // drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);
            } else {
                setMsg("Braços não visiveis")
                msgCurrent = "Braços não visiveis"
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
        if (msgCurrent == "Desceu demasiado")
            return "red"
        else if (msgCurrent == "Sua posição está boa")
            return "orange"
        else if (msgCurrent == "Joelho, quadril e pés não visiveis")
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
                        <h3 style={{ color: "gray" }}>Esquerdo: </h3>
                        <h3>{countDown + "/10"}</h3>
                    </div>
                    <div style={{ flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
                        <h3 style={{ color: "gray" }}>Direito: </h3>
                        <h3>{countDown2 + "/10"}</h3>
                    </div>
                    <div style={{ flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
                        <h4 style={{ color: "orange" }}>{msg}</h4>
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

export default App2;