/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
 */

(function () {
  'use strict';

  angular.module('translate-chat').service('$sqliteService', function ($q, $rootScope, $cordovaSQLite) {
    var self = this;
    var _db;

    function _openDatabase(type) {
      if (type === 'browser') {
        _db = window.openDatabase('translate-chat.db', '1.0', 'Database', 200000);
      } else {
        _db = window.sqlitePlugin.openDatabase({
          name : 'translate-chat.db',
          location : 2,
          createFromLocation : 1
        });
      }
    }

    self.db = function () {
      if (!_db) {
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
          _openDatabase('browser');
        }
      }
      return _db;
    };

    self.getFirstItem = function (query, parameters) {
      var deferred = $q.defer();
      self.executeSql(query, parameters).then(function (res) {

        if (res.rows.length > 0) {
          return deferred.resolve(res.rows.item(0));
        }

        return deferred.reject('There aren\'t items matching');
      }, function (err) {
        return deferred.reject(err);
      });

      return deferred.promise;
    };

    self.getFirstOrDefaultItem = function (query, parameters) {
      var deferred = $q.defer();
      self.executeSql(query, parameters).then(function (res) {

        if (res.rows.length > 0) {
          return deferred.resolve(res.rows.item(0));
        }

        return deferred.resolve(null);
      }, function (err) {
        return deferred.reject(err);
      });

      return deferred.promise;
    };

    self.getItems = function (query, parameters) {
      var deferred = $q.defer();
      self.executeSql(query, parameters).then(function (res) {
        var items = [], i;
        for (i = 0; i < res.rows.length; i++) {
          items.push(res.rows.item(i));
        }
        return deferred.resolve(items);
      }, function (err) {
        return deferred.reject(err);
      });

      return deferred.promise;
    };

    self.preloadDataBase = function (enableLog) {
      var deferred = $q.defer();

      console.log('preload data base');

      if (window.sqlitePlugin === undefined) {
        if (enableLog) {
          console.log('%c **** Starting the creation of the database **** ', 'background: #222; color: #bada55');
        }
        self.db().transaction(function (tx) {
          var i, query, queriesLength = translateChat.prepareQueries.length;
          for (i = 0; i < queriesLength; i++) {
            query = translateChat.prepareQueries[i].replace(/\\n/g, '\n');

            if (enableLog) {
              console.log(translateChat.prepareQueries[i]);
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
        self.db();
        deferred.resolve('OK');
      }

      return deferred.promise;
    };

    self.executeSql = function (query, parameters) {
      return $cordovaSQLite.execute(self.db(), query, parameters);
    };
  });
}());
