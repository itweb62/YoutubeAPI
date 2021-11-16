const port = 5000;
const baseURL = `http://localhost:${port}`;

const keys = require("./secretauth.json");

module.exports = {
  // The secret for the encryption of the jsonwebtoken
  JWTsecret: "mysecret",

  baseURL: baseURL,
  port: port,

  // The credentials and information for OAuth2
  oauth2Credentials: {
    client_id: keys.web.client_id,
    project_id: keys.web.project_id, // The name of your project
    auth_uri: keys.web.auth_uri,
    token_uri: keys.web.token_uri,
    auth_provider_x509_cert_url: keys.web.auth_provider_x509_cert_url,
    client_secret: keys.web.client_secret,
    redirect_uris: ["http://localhost:5000/oauth2callback"],
    scopes: [/*"https://www.googleapis.com/auth/youtube.readonly",*/ "https://www.googleapis.com/auth/youtube" , "https://www.googleapis.com/auth/youtubepartner","https://www.googleapis.com/auth/youtube.force-ssl"]
  }
};