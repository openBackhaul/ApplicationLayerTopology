/**
 * @file This class provides a stub for the consequent action list  
 **/

'use strict';

class ConsequentAction {

  static label;
  static request;

  /**
   * @constructor 
   * @param {String} label label of the consequent action.
   * @param {String} request url that needs to be addressed to perform the consequent action.
   **/
  constructor(label, request) {
    this.label = label;
    this.request = request;
  }

}

module.exports = ConsequentAction;