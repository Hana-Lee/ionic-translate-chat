/**
 * @author Hana Lee
 * @since 2016-05-03 23:13
 */
(function () {
  'use strict';

  angular.module('translate-chat').factory('UserService', UserService);

  UserService.$inject = ['$q', 'SqliteService', 'DeviceService', 'SocketService', 'QUERIES'];

  /* @ngInject */
  function UserService($q, SqliteService, DeviceService, SocketService, QUERIES) {
    var currentUser;

    return {
      get : get,
      createUserOnServer : createUserOnServer,
      createUserOnLocal : createUserOnLocal,
      retrieveAlreadyRegisteredUserByDeviceIdOnServer : retrieveAlreadyRegisteredUserByDeviceIdOnServer,
      retrieveAlreadyRegisteredUserByDeviceIdOnLocal : retrieveAlreadyRegisteredUserByDeviceIdOnLocal,
      getAllUserFromServer : getAllUserFromServer,
      getByUserId : getByUserId
    };

    function get() {
      var deferred = $q.defer();
      if (!currentUser) {
        var deviceId = localStorage.getItem('translate-chat-device-id');
        if (!deviceId) {
          DeviceService.getId();
        }
        SqliteService.getFirstItem(QUERIES.SELECT_USER_BY_DEVICE_ID, [deviceId])
          .then(function (result) {
            currentUser = result;
            deferred.resolve(result);
          }, function (error) {
            console.error('select user by device id error : ', error);
            deferred.reject(error);
          });
      } else {
        deferred.resolve(currentUser);
      }
      return deferred.promise;
    }

    function _settingLocalStorage(userData) {
      localStorage.setItem('translate-chat-user-id', userData.user_id);
      localStorage.setItem('translate-chat-user-name', userData.user_name);
      localStorage.setItem('translate-chat-device-id', userData.device_id);
      localStorage.setItem('translate-chat-device-token', userData.device_token);
      localStorage.setItem('translate-chat-user-info', JSON.stringify(userData));
    }

    function createUserOnServer(userData) {
      var deferred = $q.defer();

      var deviceId = DeviceService.getId();
      var deviceType = DeviceService.getType();
      var deviceVersion = DeviceService.getVersion();
      var deviceToken = DeviceService.getToken();

      var params = {
        user_name : userData.user_name, device_id : deviceId,
        device_type : deviceType, device_version : deviceVersion,
        user_face : 'assets/img/sarah.png', device_token : deviceToken,
        online : 1
      };

      SocketService.emit('createUser', params);
      SocketService.on('createdUser', function (data) {
        SocketService.removeListener('createdUser');
        if (data.error) {
          deferred.reject(data);
        } else {
          _settingLocalStorage(data.result);
          currentUser = data.result;
          deferred.resolve(data.result);
        }
      });
      return deferred.promise;
    }

    function createUserOnLocal(userData) {
      var deferred = $q.defer();

      $q.when(SqliteService.executeSql(
        QUERIES.INSERT_USER,
        [
          userData.user_id, userData.user_name, userData.user_face, userData.device_token,
          userData.device_id, userData.device_type, userData.device_version,
          userData.socket_id, userData.online, userData.connection_time, userData.created
        ]
      )).then(function () {
        _settingLocalStorage(userData);
        currentUser = userData;
        deferred.resolve(userData);
      }, function (error) {
        deferred.reject(error);
      });

      return deferred.promise;
    }

    function retrieveAlreadyRegisteredUserByDeviceIdOnServer() {
      var deferred = $q.defer();
      var deviceId = DeviceService.getId();
      SocketService.emit('retrieveAlreadyRegisteredUserByDeviceId', {device_id : deviceId});
      SocketService.on('retrievedAlreadyRegisteredUserByDeviceId', function (data) {
        SocketService.removeListener('retrievedAlreadyRegisteredUserByDeviceId');

        if (data.error) {
          deferred.reject(data);
        } else {
          this.user = data.result;
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function retrieveAlreadyRegisteredUserByDeviceIdOnLocal() {
      var deferred = $q.defer();
      var deviceId = DeviceService.getId();

      $q.when(SqliteService.getFirstItem(QUERIES.SELECT_USER_BY_DEVICE_ID, [deviceId]))
        .then(function (result) {
          currentUser = result;
          deferred.resolve(result);
        }, function (error) {
          console.log('select user by device id error : ', JSON.stringify(error));
          deferred.reject(error);
        });

      return deferred.promise;
    }

    function getAllUserFromServer(userData) {
      var deferred = $q.defer();
      SocketService.emit('retrieveAllUsers');
      SocketService.on('retrievedAllUsers', function (data) {
        SocketService.removeListener('retrievedAllUsers');

        var userList = [];
        if (data.error) {
          deferred.reject(data);
        } else {
          data.result.forEach(function (user) {
            if (user.user_id !== userData.user_id) {
              userList.push(user);
            }
          }.bind(this));
          deferred.resolve(userList);
        }
      });

      return deferred.promise;
    }

    function _getByUserIdFromServer(userId) {
      var deferred = $q.defer();
      SocketService.emit('retrieveUserByUserId', {user_id : userId});
      SocketService.on('retrievedUserByUserId', function (data) {
        SocketService.removeListener('retrievedUserByUserId');

        if (data.error) {
          deferred.reject(data);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function _getByUserIdFromLocal(userId) {
      return $q.when(SqliteService.getFirstItem(QUERIES.SELECT_USER_BY_USER_ID, [userId]));
    }

    function getByUserId(userId) {
      var deferred = $q.defer();

      _getByUserIdFromLocal(userId).then(function (result) {
        deferred.resolve(result);
      }, function (localError) {
        console.error('get user by user id from local error : ', localError);
        _getByUserIdFromServer(userId).then(function (result) {
          deferred.resolve(result);
        });
      }).catch(function (error) {
        console.error('get user by user id error : ', error);
        deferred.reject(error);
      });

      return deferred.promise;
    }
  }

})();

