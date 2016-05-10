/**
 * @author Hana Lee
 * @since 2016-05-03 17:45
 */
(function () {
  'use strict';

  /**
   * @typedef {Object} UserData
   * @type {{user_id: null, user_name: null, user_face: null, device_token: null, device_id: null, device_type: null, device_version: null, socket_id: null, online: boolean, connection_time: null, created: null}}
   */
  var userData = {
    user_id : null,
    user_name : null,
    user_face : null,
    device_token : null,
    device_id : null,
    device_type : null,
    device_version : null,
    socket_id : null,
    online : false,
    connection_time : null,
    created : null
  };

  /**
   * @typedef {Object} Setting
   * @type {{id: null, text: null, value: null, type: null}}
   */
  var setting = {
    setting_key : null,
    setting_name : null,
    setting_value : null,
    setting_type : null
  };

  return {
    userData : userData,
    setting : setting
  };
}());
