/**
 * @author Hana Lee
 * @since 2016-05-03 23:13
 */
(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('UserService', UserService);

  UserService.$inject = [
    '$q', 'DeviceService', 'SocketService', 'STORAGE_KEYS'
  ];

  function UserService($q, DeviceService, SocketService, STORAGE_KEYS) {
    var currentUser = {};

    if (localStorage.getItem(STORAGE_KEYS.USER)) {
      currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    }

    return {
      get : get,
      createUser : createUser,
      getAll : getAll,
      updateOnlineState : updateOnlineState,
      updateUserName : updateUserName,
      updateUserFace : updateUserFace
    };

    function get() {
      return currentUser;
    }

    function createUser(userData) {
      var deferred = $q.defer();
      _getUserByUserNameFromServer(userData).then(
        function (getResult) {
          if (getResult) {
            _checkToken(getResult);
            _createUserOnLocal(getResult);
            updateOnlineState(true);
            deferred.resolve(getResult);
          } else {
            _createUserOnServer(userData)
              .then(function (createdResult) {
                _checkToken(createdResult);
                _createUserOnLocal(createdResult);
                deferred.resolve(createdResult);
              }, function (error) {
                console.error('create user on server error : ', error);
                deferred.reject(error);
              });
          }
        },
        function (error) {
          console.error('get user by user name from server error : ', error);
          deferred.reject(error);
        }
      );

      return deferred.promise;
    }

    function _checkToken(userData) {
      var token = DeviceService.getToken();
      console.log('check token : ', token, userData);
      if (userData.device_token !== token) {
        userData.device_token = token;
        DeviceService.updateToken(userData, token);
      }
    }

    function _createUserOnServer(userData) {
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
          currentUser = data.result;
          deferred.resolve(data.result);
        }
      });
      return deferred.promise;
    }

    function _createUserOnLocal(userData) {
      _saveUserOnLocalStorage(userData);
      SocketService.emit('updateSocketId', {user_id : currentUser.user_id});
    }

    function _saveUserOnLocalStorage(userData) {
      currentUser = userData;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    }

    function _getUserByUserNameFromServer(userData) {
      var deferred = $q.defer();
      SocketService.emit('retrieveUserByUserName', userData);
      SocketService.on('retrievedUserByUserName', function (data) {
        if (data.error) {
          deferred.reject(data);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function getAll(userData) {
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

    function updateOnlineState(state) {
      var params = {
        user_id : currentUser.user_id,
        online : state ? 1 : 0
      };
      SocketService.emit('updateUserOnlineState', params);
    }

    function updateUserName(userData) {
      var deferred = $q.defer();

      SocketService.emit('updateUserName', {user : userData});
      SocketService.on('updatedUserName', function (data) {
        SocketService.removeListener('updatedUserName');

        if (data.error) {
          deferred.reject(data);
        } else {
          _saveUserOnLocalStorage(userData);
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function updateUserFace(userData) {
      var deferred = $q.defer();

      SocketService.emit('updateUserFace', {user : userData});
      SocketService.on('updatedUserFace', function (data) {
        SocketService.removeListener('updatedUserFace');

        if (data.error) {
          deferred.reject(data);
        } else {
          _saveUserOnLocalStorage(userData);
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }
  }

})();

