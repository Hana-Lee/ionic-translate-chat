/**
 * @author Hana Lee
 * @since 2016-05-04 15:14
 */
(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('FriendService', FriendService);

  FriendService.$inject = ['$q', 'SocketService'];

  function FriendService($q, SocketService) {
    return {
      add : add,
      getAll : getAll,
      remove : remove
    };

    function add(user, friend, doNotification) {
      var deferred = $q.defer();
      var params = {user : user, friend : friend, notification : doNotification};

      SocketService.emit('createFriend', params);
      SocketService.on('createdFriend', function (data) {
        SocketService.removeListener('createdFriend');

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

      SocketService.emit('retrieveAllFriends', userData);
      SocketService.on('retrievedAllFriends', function (data) {
        SocketService.removeListener('retrievedAllFriends');

        if (data.error) {
          deferred.reject(data);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function remove(user, friend) {
      var deferred = $q.defer();
      SocketService.emit('deleteFriend', {user : user, friend : friend});
      SocketService.on('deletedFriend', function (data) {
        SocketService.removeListener('deletedFriend');

        if (data.error) {
          deferred.reject(data);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }
  }

})();
