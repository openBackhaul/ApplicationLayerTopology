const axios = require("axios");
const RandExp = require('randexp');
const csv = require('csvtojson');
let converter = require('json-2-csv');
const fs = require('node:fs');

const CONFIG = require("./package.json");
const URL = CONFIG['application-layer-topology']['base-url'] + CONFIG['application-layer-topology']['link-creation-api'];
const OPERATION_KEY = CONFIG['application-layer-topology']['operation-key']; 
const linkCreationDelayinMs = CONFIG["application-layer-topology"]["link-creation-delay-in-ms"]

const INPUT_FILE_PATH = CONFIG["input-file"];
var resultArray = [];

(async function() {
  const linkArray = await csv().fromFile(INPUT_FILE_PATH);
  for (let index = 0; index < linkArray.length; index++) {
    let link = linkArray[index];
    let servingApplicationName = link.servingApplicationName;
    let servingApplicationReleaseNumber = link.servingApplicationReleaseNumber;
    let operationName = link.operationName;
    let consumingApplicationName = link.consumingApplicationName;
    let consumingApplicationReleaseNumber = link.consumingApplicationReleaseNumber;
    let result = await createLinks(servingApplicationName, servingApplicationReleaseNumber,operationName, consumingApplicationName, consumingApplicationReleaseNumber);
    let date = new Date();
    link.result = result.isSuccess;
    link.reasonOfFailure = result.reasonOfFailure;
    link.attemptedOn = date.getDate() + "." + (date.getMonth() + 1) + 
    "." + date.getFullYear() + "-" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
    resultArray.push(link);
    await sleep(linkCreationDelayinMs);
}
const output = converter.json2csv(resultArray);
let d = new Date();
let timestamp = d.getDate() + "_" + (d.getMonth() + 1) + "_" + d.getFullYear() + "-" + d.getHours() + "_" + d.getMinutes();
let outputFileName = "./output_" + timestamp +".csv"
fs.writeFileSync(outputFileName, output);
})();

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


async function createLinks(servingApplicationName, servingApplicationReleaseNumber,operationName, consumingApplicationName, consumingApplicationReleaseNumber)
{
    let result = {
        "isSuccess" : false,
        "reasonOfFailure" : "not available"
    };
    try {
        let requestHeader = {
            'user': 'LinkManager',
            'originator': 'LinkManager',
            'x-correlator': getRandomXCorrelator(),
            'trace-indicator': '1',
            'customer-journey': 'Unknown value',
            'operation-key': OPERATION_KEY,
            'Content-Type': 'application/json'
        }

        let requestBody = {
            "serving-application-name": servingApplicationName,
            "serving-application-release-number": servingApplicationReleaseNumber,
            "operation-name": operationName,
            "consuming-application-name": consumingApplicationName,
            "consuming-application-release-number": consumingApplicationReleaseNumber
        };
        let request = {
            method: "post",
            url: URL,
            headers: requestHeader,
            data: requestBody
        }
        result = (await axios(request)).data;
    } catch (error) {
        console.log(error);
    }
    if(result!= undefined && result["client-successfully-added"]!=undefined && result["client-successfully-added"]==true){
        result.isSuccess = true;
        result.reasonOfFailure = "not applicable";
    }else if(result!= undefined && result["client-successfully-added"]!=undefined && result["client-successfully-added"]==false){
        if(result["reason-of-failure"]){
        result.isSuccess = false;
        result.reasonOfFailure = result["reason-of-failure"];
        }
    }
    return result;
}


function getRandomXCorrelator() {
    let randomXCorrelatorString;
    try {
        randomXCorrelatorString = new RandExp(/^[0-9A-Fa-f]{8}(?:-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}$/).gen();
    } catch (error) {
        console.log("error");
        console.log(error);
    }
    return randomXCorrelatorString;
}