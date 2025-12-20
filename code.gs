"use strict";

function doGet(e) {
  const template = HtmlService.createTemplateFromFile("index");

  template.username = e.parameter.username ?? "";
  template.password = e.parameter.password ?? "";
  return template
    .evaluate()
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setFaviconUrl("https://github.com/ryo-hozumi/portfolio/blob/main/images/favicon-32x32.png?raw=true&.png")
    .setTitle("Sign in - Portfolio | Ryo Hozumi");
}

function doPost(e) {
  const template = HtmlService.createTemplateFromFile("home");

  template.username = e.parameter.username;
  return template
    .evaluate()
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setFaviconUrl("https://github.com/ryo-hozumi/portfolio/blob/main/images/favicon-32x32.png?raw=true&.png")
    .setTitle("Portfolio | Ryo Hozumi");
}

function setCredentials(username, rawPassword, role) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const property = JSON.parse(scriptProperties.getProperty("CREDENTIALS"));
  const credentials = property ? { ...property } : {};
  const savedData = storePassword(rawPassword);

  credentials[username] = {
    salt: savedData.salt,
    hash: savedData.hash,
    iterations: savedData.iterations,
    role: role
  };
  scriptProperties.setProperty("CREDENTIALS", JSON.stringify(credentials));
}

function verifyCredentials(username, password) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const credentials = JSON.parse(scriptProperties.getProperty("CREDENTIALS"));

  if (Object.hasOwn(credentials, username)) {
    const storedSalt = credentials[username].salt;
    const storedHash = credentials[username].hash;
    const storedIterations = credentials[username].iterations;
    const result = verifyPassword(password, storedSalt, storedHash, storedIterations);

    if (result) {
      return true;
    }
  }
  return false;
}

function logVisitorData(title, data) {
  console.log(title, data);
  if (Object.hasOwn(data, "response_status")) {
    if (/^4\d{2}$/.test(data.response_status)) {
      throw new Error("Client error response");
    }
    if (/^5\d{2}$/.test(data.response_status)) {
      throw new Error("Server error response");
    }
  }
}