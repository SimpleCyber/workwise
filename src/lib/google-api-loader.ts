declare global {
  interface Window {
    gapi: any;
  }
}

export const loadGoogleAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google API can only be loaded in browser"));
      return;
    }

    if (window.gapi) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load("client:auth2", {
        callback: resolve,
        onerror: reject,
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};
