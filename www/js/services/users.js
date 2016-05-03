/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
 */

(function () {
	'use strict';

	angular
		.module('translate-chat')
		.factory('Friends', function ($q, $sqliteService) {

      return {
        getAll: function () {
          var query = 'Select * FROM Users';
          return $q.when($sqliteService.getItems(query));
        },
        add: function (user) {
          var query = 'INSERT INTO Users (Name) VALUES (?)';
          return $q.when($sqliteService.executeSql(query, [user.Name]));
        }
      };
    });
}());
