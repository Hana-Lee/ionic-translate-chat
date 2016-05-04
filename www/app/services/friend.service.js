/**
 * @author Hana Lee
 * @since 2016-05-04 15:14
 */
(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('FriendService', FriendService);

  FriendService.$inject = ['$q', 'SqliteService', 'SocketService'];

  /* @ngInject */
  function FriendService($q, SqliteService, SocketService) {
    return {
      add : add,
      addToServer : addToServer,
      addToLocal : addToLocal,
      getAll : getAll
    };

    function add(userData, friend) {
      var deferred = $q.defer();

      addToServer(userData, friend).then(function (serverResult) {
        console.log('create friend on server success : ', serverResult);
        addToLocal(userData, friend).then(function (localResult) {
          console.log('create friend on local success : ', localResult);
          deferred.resolve(localResult);
        }, function (localError) {
          console.error('create friend on local error : ', localError);
          deferred.reject(localError);
        });
      }, function (serverError) {
        console.error('create friend on server error : ', JSON.stringify(serverError));
        deferred.reject(serverError);
      });

      return deferred.promise;
    }

    function addToServer(userData, friend) {
      var deferred = $q.defer();

      SocketService.emit('createFriend', {user : userData, friend : friend});
      SocketService.on('createdFriend', function (data) {
        SocketService.removeListener('createdFriend');
        console.log('creation friend on server', data);
        if (data.error) {
          deferred.reject(data);
        } else {
          deferred.resolve(data);
        }
      });

      return deferred.promise;
    }

    function addToLocal(userData, friend) {
      var deferred = $q.defer();

      $q.when(SqliteService.executeSql(translateChat.QUERIES.INSERT_FRIEND, [userData.user_id, friend.user_id]))
        .then(function (result) {
          deferred.resolve(result);
        }, function (error) {
          console.error('create friend on local error : ', JSON.stringify(error));
          deferred.reject(error);
        });

      return deferred.promise;
    }

    function getAll(userData) {
      var deferred = $q.defer();

      $q.when(SqliteService.getItems(translateChat.QUERIES.SELECT_ALL_FRIENDS_BY_USER_ID, [userData.user_id]))
        .then(function (result) {
          console.log('get all friend : ', result);
          deferred.resolve(result);
        }, function (error) {
          console.error('get all friend error : ', error);
          deferred.reject(error);
        });

      return deferred.promise;
    }
  }

})();
