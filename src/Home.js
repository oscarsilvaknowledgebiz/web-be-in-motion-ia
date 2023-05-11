import React, { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    return (
        <div style={{
            height: "100vh",
            justifyContent: "center",
            alignItems: "center",
            display: "flex"
        }}>
            <button style={{
                height: 50,
                width: 100,
                margin: 10
            }} title={"Teste"} onClick={() => navigate("exemple1")}>
                <span>Squat</span>
            </button>
            <button style={{
                height: 50,
                width: 100,
                margin: 10
            }} title={"Teste"} onClick={() => navigate("exemple2")}>
                <span>Front Elevation</span>
            </button>
        </div>
    );
}

export default Home;