import { msalInstance, initializeMsal } from "./msalConfig"


import React, { useState } from "react";
const loginRequest = {
  scopes: ["https://app.powerbi.com/.default"]
};
function SiginIn(){
  const [accessToken, setToken] = useState(null);
  async function signIn() {
    await initializeMsal(); // Wait for initialization
    const response = await msalInstance.loginPopup(loginRequest);
    console.log("Access Token:", response.accessToken);
  }
  
  async function callFabricApi() {
    if (!accessToken) return alert("Please sign in first!");

    fetch("https://fabric.microsoft.com/api", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(response => response.json())
      .then(data => console.log("API Response:", data))
      .catch(error => console.error("API error:", error));
  }

  return (
    <div>
      <h1>React + MSAL Authentication</h1>
      <button onClick={signIn}>Sign In</button>
      <button onClick={callFabricApi} disabled={!accessToken}>Call Fabric API</button>
      {accessToken && <p>Token acquired!</p>}
    </div>
  );
}
  export default SiginIn