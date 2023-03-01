'use strict';
var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');

/**
 * Returns the reference on the consequent operation
 *
 * uuid String 
 * returns inline_response_200_10
 **/
exports.getActionProfileConsequentOperationReference = function (url) {
    return new Promise(async function (resolve, reject) {
        var response = {};
        var value = await fileOperation.readFromDatabaseAsync(url);
        response['application/json'] = {
            "action-profile-1-0:consequent-operation-reference": value
        };
        if (Object.keys(response).length > 0) {
            resolve(response[Object.keys(response)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Returns whether to be presented in new browser window
 *
 * uuid String 
 * returns inline_response_200_9
 **/
exports.getActionProfileDisplayInNewBrowserWindow = function (url) {
    return new Promise(async function (resolve, reject) {
        var response = {};
        var value = await fileOperation.readFromDatabaseAsync(url);
        response['application/json'] = {
            "action-profile-1-0:display-in-new-browser-window": value
        };
        if (Object.keys(response).length > 0) {
            resolve(response[Object.keys(response)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Returns the list of input values
 *
 * uuid String 
 * returns inline_response_200_8
 **/
exports.getActionProfileInputValueListt = function (url) {
    return new Promise(async function (resolve, reject) {
        var response = {};
        var value = await fileOperation.readFromDatabaseAsync(url);
        console.log(value)
        response['application/json'] = {
            "action-profile-1-0:input-value-list": value
        };


        if (Object.keys(response).length > 0) {
            resolve(response[Object.keys(response)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Returns the Label of the Action
 *
 * uuid String 
 * returns inline_response_200_7
 **/
exports.getActionProfileLabel = function (url) {
    return new Promise(async function (resolve, reject) {
        var response = {};
        var value = await fileOperation.readFromDatabaseAsync(url);
        response['application/json'] = {
            "action-profile-1-0:label": value
        };
        if (Object.keys(response).length > 0) {
            resolve(response[Object.keys(response)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Returns the name of the Operation
 *
 * uuid String 
 * returns inline_response_200_6
 **/
exports.getActionProfileOperationName = function (url) {
    return new Promise(async function (resolve, reject) {
        var response = {};
        var value = await fileOperation.readFromDatabaseAsync(url);
        response['application/json'] = {
            "action-profile-1-0:operation-name": value
        };
        if (Object.keys(response).length > 0) {
            resolve(response[Object.keys(response)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Configures the reference on the consequent operation
 *
 * body Actionprofileconfiguration_consequentoperationreference_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putActionProfileConsequentOperationReference = function (url, body) {
    return new Promise(async function (resolve, reject) {
        try {

            await fileOperation.writeToDatabaseAsync(url, body, false);
            resolve();
        } catch (error) {
            reject();
        }
    });
}

