/**
 * @author Hana Lee
 * @since 2016-05-04 15:14
 */
(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('FriendService', FriendService);

  FriendService.$inject = ['$q', 'SocketService', 'STORAGE_KEYS'];

  function FriendService($q, SocketService, STORAGE_KEYS) {
    var friends = [];
    if (localStorage.getItem(STORAGE_KEYS.FRIENDS)) {
      friends = JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDS));
    }

    return {
      add : add,
      addToServer : addToServer,
      addToLocal : addToLocal,
      getAll : getAll
    };

    function add(user, friend) {
      var deferred = $q.defer();

      addToServer(user, friend).then(function (result) {
        addToLocal(friend);
        deferred.resolve(result);
      }, function (error) {
        deferred.reject(error);
      });

      return deferred.promise;
    }

    function addToServer(user, friend) {
      var deferred = $q.defer();

      SocketService.emit('createFriend', {user : user, friend : friend});
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

    function addToLocal(friend) {
      friends.push(friend);
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
    }

    function getAll(userData) {
      var deferred = $q.defer();

      SocketService.emit('retrieveAllFriends', userData);
      SocketService.on('retrievedAllFriends', function (data) {
        SocketService.removeListener('retrievedAllFriends');
        if (data.error) {
          deferred.reject(data);
        } else {
          friends = data.result;
          localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
          deferred.resolve(friends);
        }
      });

      return deferred.promise;
    }
  }

})();
