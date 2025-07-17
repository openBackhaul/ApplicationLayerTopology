# Automatic Link Creation Tool
This tool automates the creation of application-layer links by reading link configurations from a CSV file and calling a specified API to establish the relationships. 
It supports batch processing with configurable delay and outputs the results (including success/failure) into a timestamped CSV file.

## Prerequisites
Ensure the following are installed:
- Node.js (v14 or above recommended)
- connectivity to internet to download the npm packages

## How to Setup ?
### 1. Navigate to the tool's directory:
cd server/tools/AutomaticLinkCreation

### 2. Install required dependencies:
npm install

### 3. Configuration (package.json)
Update the following fields in the local package.json:
```json
"application-layer-topology": {
  "base-url": "http://<ipaddress:port>",
  "link-creation-api": "/v1/add-operation-client-to-link",
  "operation-key": "<current-operation-key-of-/v1/add-operation-client-to-link>",
  "link-creation-delay-in-ms": 1000
},
"input-file": "./input.csv"
```
**Explanation**:
 - base-url: Base URL of the ApplicationLayerTopology application
 - link-creation-api: Path to the API endpoint for creating links
 - operation-key: current operation key of the /v1/add-operation-client-to-link
 - link-creation-delay-in-ms: Delay between API calls to avoid overloading
 - input-file: Path to the CSV file containing link data

### 4. Input File (input.csv)
The input file must be in CSV format with the following headers:
servingApplicationName,servingApplicationReleaseNumber,operationName,consumingApplicationName,consumingApplicationReleaseNumber

**Example:**
```csv
servingApplicationName,servingApplicationReleaseNumber,operationName,consumingApplicationName,consumingApplicationReleaseNumber
ExecutionAndTraceLog,2.1.2,/v1/record-service-request,RegistryOffice,2.1.2
OamLog,2.1.2,/v1/record-oam-request,RegistryOffice,2.1.2
OamLog,3.1.2,/v1/record-oam-request,RegistryOffice,2.1.2
```

## How to execute the tool:
node index.js

## Output
A new CSV file like output_17_7_2025-10_30.csv will be generated in the same directory.

The file will contain all input columns plus:
result: true or false indicating success
reasonOfFailure: If applicable
attemptedOn: Timestamp of the attempt

**Example Output**
```csv
servingApplicationName,servingApplicationReleaseNumber,operationName,consumingApplicationName,consumingApplicationReleaseNumber,result,reasonOfFailure,attemptedOn
ExecutionAndTraceLog,2.1.2,/v1/record-service-request,RegistryOffice,2.1.2,true,not applicable,17.7.2025-13:14:28:126
OamLog,2.1.2,/v1/record-oam-request,RegistryOffice,2.1.2,true,not applicable,17.7.2025-13:14:39:592
OamLog,3.1.2,/v1/record-oam-request,RegistryOffice,2.1.2,false,ALT_SERVING_APPLICATION_RELEASE_NUMBER_UNKNOWN,17.7.2025-13:14:49:792
```

## Error Handling
All API call failures are logged to the console.
If a request fails, the reason is captured in the output CSV under reasonOfFailure.

