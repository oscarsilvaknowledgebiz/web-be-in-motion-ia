import React from "react";

export default function Calibration({ value }) {
    return (
        <h1 style={{position: "absolute", top: 0}}>{value == null ? "Calibrando" : "Calibrado"}</h1>
    )
}