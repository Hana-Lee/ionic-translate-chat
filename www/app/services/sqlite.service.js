/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
 */

(function () {
  'use strict';

  angular.module('translate-chat').factory('SqliteService', SqliteService);

  SqliteService.$inject = ['$q', '$rootScope', '$cordovaSQLite', 'QUERIES'];

  /* @ngInject */
  function SqliteService($q, $rootScope, $cordovaSQLite, QUERIES) {
    var _db;

    return {
      getFirstItem : getFirstItem,
      getItems : getItems,
      preloadDataBase : preloadDataBase,
      executeSql : executeSql
    };

    function _openDatabase() {
      if (window.sqlitePlugin !== undefined) {
        _db = window.sqlitePlugin.openDatabase({
          name : 'translate-chat.db',
          location : 2,
          createFromLocation : 1
        });
      } else {
        _db = window.openDatabase('translate-chat.db', '1.0', 'Database', 200000);
      }
    }

    function _initialize() {
      if (window.sqlitePlugin !== undefined) {
        console.log('window sqlite plugin use');
        if ($rootScope.env.DEVELOPMENT) {
          window.sqlitePlugin.deleteDatabase({name : 'translate-chat.db', location : 2}, function () {
            console.log('delete success');
            _openDatabase();
          }, function () {
            console.log('delete fail');
            _openDatabase();
          });
        } else {
          _openDatabase();
        }
      } else {
        // For debugging in the browser
        console.log('window open database use');
        _openDatabase();
      }
    }

    function getFirstItem(query, parameters) {
      var deferred = $q.defer();
      executeSql(query, parameters).then(function (res) {

        if (res.rows.length > 0) {
          return deferred.resolve(res.rows.item(0));
        }

        return deferred.resolve(null);
      }, function (err) {
        return deferred.reject(err);
      });

      return deferred.promise;
    }

    function getItems(query, parameters) {
      var deferred = $q.defer();
      executeSql(query, parameters).then(function (res) {
        if (res.rows.length > 0) {
          var items = [], i, rowsLength = res.rows.length;
          for (i = 0; i < rowsLength; i++) {
            items.push(res.rows.item(i));
          }
          return deferred.resolve(items);
        }

        return deferred.resolve(null);
      }, function (err) {
        return deferred.reject(err);
      });

      return deferred.promise;
    }

    function preloadDataBase(enableLog) {
      var deferred = $q.defer();

      console.log('preload data base');

      _initialize();

      if (window.sqlitePlugin === undefined) {
        if (enableLog) {
          console.log('%c **** Starting the creation of the database **** ', 'background: #222; color: #bada55');
        }
        _db.transaction(function (tx) {
          var prepareQueries = [
            QUERIES.CREATE_USERS,
            QUERIES.CREATE_FRIENDS,
            QUERIES.CREATE_CHAT_ROOMS,
            QUERIES.CREATE_CHAT_ROOM_SETTINGS,
            QUERIES.CREATE_CHAT_ROOM_USERS,
            QUERIES.CREATE_CHAT_MESSAGES,
            QUERIES.CREATE_UNIQUE_INDEX_CHAT_MESSAGES,
            QUERIES.CREATE_COMPLEX_INDEX1_CHAT_MESSAGES,
            QUERIES.CREATE_COMPLEX_INDEX2_CHAT_MESSAGES,
            QUERIES.CREATE_COMPLEX_INDEX3_CHAT_MESSAGES
          ];
          var i, query, queriesLength = prepareQueries.length;
          for (i = 0; i < queriesLength; i++) {
            query = prepareQueries[i].replace(/\\n/g, '\n');

            if (enableLog) {
              console.log(prepareQueries[i]);
            }
            tx.executeSql(query);
          }
        }, function (error) {
          deferred.reject(error);
        }, function () {
          if (enableLog) {
            console.log('%c **** Completing the creation of the database **** ', 'background: #222; color: #bada55');
          }
          deferred.resolve('OK');
        });
      } else {
        deferred.resolve('OK');
      }

      return deferred.promise;
    }

    function executeSql(query, parameters) {
      return $cordovaSQLite.execute(_db, query, parameters);
    }
  }
}());
