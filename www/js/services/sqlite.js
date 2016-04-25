/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
 */
/*jslint
 browser  : true,
 continue : true,
 devel    : true,
 indent   : 2,
 maxerr   : 50,
 nomen    : true,
 plusplus : true,
 regexp   : true,
 vars     : true,
 white    : true,
 todo     : true,
 unparam  : true,
 node     : true
 */
/*global angular, translateChat */
(function () {
  'use strict';

  angular.module('translate-chat').service('$sqliteService', function ($q, $rootScope, $cordovaSQLite) {
    var self = this;
    var _db;

    self.db = function () {
      if (!_db) {
        if (window.sqlitePlugin !== undefined) {
          console.log('window sqlite plugin use');
          // window.sqlitePlugin.deleteDatabase({name : 'translate-chat.db', location : 2}, function () {
          //   console.log('delete success');
          //   _db = window.sqlitePlugin.openDatabase({name : "translate-chat.db", location : 2, createFromLocation : 1});
          //   $rootScope.$emit('db_init_done');
          // }, function () {
          //   console.log('delete fail');
          //   _db = window.sqlitePlugin.openDatabase({name : "translate-chat.db", location : 2, createFromLocation : 1});
          //   $rootScope.$emit('db_init_done');
          // });
          _db = window.sqlitePlugin.openDatabase({name : "translate-chat.db", location : 2, createFromLocation : 1});
          $rootScope.$emit('db_init_done');
        } else {
          // For debugging in the browser
          console.log('window open database use');
          _db = window.openDatabase("translate-chat.db", "1.0", "Database", 200000);
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

        return deferred.reject("There aren't items matching");
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

      //window.open("data:text/plain;charset=utf-8," + JSON.stringify({ data: window.queries.join('').replace(/\\n/g, '\n') }));
      if (window.sqlitePlugin === undefined) {
        if (enableLog) {
          console.log('%c ***************** Starting the creation of the database ***************** ', 'background: #222; color: #bada55');
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
            console.log('%c ***************** Completing the creation of the database ***************** ', 'background: #222; color: #bada55');
          }
          deferred.resolve("OK");
        });
      } else {
        self.db();
        deferred.resolve("OK");
      }

      return deferred.promise;
    };

    self.executeSql = function (query, parameters) {
      return $cordovaSQLite.execute(self.db(), query, parameters);
    };
  });
}());
