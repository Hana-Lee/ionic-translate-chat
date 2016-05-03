/**
 * @author Hana Lee
 * @since 2016-05-03 23:13
 */
(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('UserService', UserService);

  UserService.$inject = ['$q', '$sqliteService', 'Device', 'Socket'];

  /* @ngInject */
  function UserService($q, $sqliteService, Device, Socket) {
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
          Device.getId();
        }
        $sqliteService.getFirstItem(translateChat.QUERIES.SELECT_USER_BY_DEVICE_ID, [deviceId])
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

    function createUserOnServer(userData) {
      var deferred = $q.defer();

      Socket.emit('createUser', userData);
      Socket.on('createdUser', function (data) {
        Socket.removeListener('createdUser');
        if (data.error) {
          deferred.reject(data);
        } else {
          localStorage.setItem('translate-chat-user-id', data.result.user_id);
          localStorage.setItem('translate-chat-user-name', data.result.user_name);
          localStorage.setItem('translate-chat-device-id', data.result.device_id);
          localStorage.setItem('translate-chat-device-token', data.result.device_token);
          localStorage.setItem('translate-chat-user-info', JSON.stringify(data.result));
          currentUser = data.result;
          deferred.resolve(data.result);
        }
      });
      return deferred.promise;
    }

    function createUserOnLocal(userData) {
      var deferred = $q.defer();

      $q.when($sqliteService.executeSql(
        translateChat.QUERIES.INSERT_USER,
        [
          userData.user_id, userData.user_name, userData.user_face, userData.device_token,
          userData.device_id, userData.device_type, userData.device_version,
          userData.socket_id, userData.online, userData.connection_time, userData.created
        ]
      )).then(function () {
        deferred.resolve(userData);
      }, function (error) {
        deferred.reject(error);
      });

      return deferred.promise;
    }

    function retrieveAlreadyRegisteredUserByDeviceIdOnServer(userData) {
      var deferred = $q.defer();

      Socket.emit('retrieveAlreadyRegisteredUserByDeviceId', userData);
      Socket.on('retrievedAlreadyRegisteredUserByDeviceId', function (data) {
        Socket.removeListener('retrievedAlreadyRegisteredUserByDeviceId');

        if (data.error) {
          deferred.reject(data);
        } else {
          this.user = data.result;
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function retrieveAlreadyRegisteredUserByDeviceIdOnLocal(userData) {
      var deferred = $q.defer();

      $q.when($sqliteService.getFirstItem(translateChat.QUERIES.SELECT_USER_BY_DEVICE_ID, [userData.device_id]))
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
      Socket.emit('retrieveAllUsers');
      Socket.on('retrievedAllUsers', function (data) {
        Socket.removeListener('retrievedAllUsers');

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
      Socket.emit('retrieveUserByUserId', {user_id : userId});
      Socket.on('retrievedUserByUserId', function (data) {
        Socket.removeListener('retrievedUserByUserId');

        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function _getByUserIdFromLocal(userId) {
      return $q.when($sqliteService.getFirstItem(translateChat.QUERIES.SELECT_USER_BY_USER_ID, [userId]));
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

