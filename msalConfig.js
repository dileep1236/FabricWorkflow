import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: "017898f4-eac9-481a-a01d-7ec68216956c",
    authority: "https://login.microsoftonline.com/d3523db7-f84a-4a24-a815-cd4ba4691c9c",
    redirectUri: "http://localhost:3000",
  }
};

const msalInstance = new PublicClientApplication(msalConfig);


async function initializeMsal() {
  await msalInstance.initialize(); // Ensure it's initialized
}

export { msalInstance, initializeMsal };

