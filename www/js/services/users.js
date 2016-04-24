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
/*global angular, Friends */
(function () {
	'use strict';

	angular
		.module('translate-chat')
		.factory('Friends', function ($q, $sqliteService) {

      return {
        getAll: function () {
          var query = "Select * FROM Users";
          return $q.when($sqliteService.getItems(query));
        },
        add: function (user) {
          var query = "INSERT INTO Users (Name) VALUES (?)";
          return $q.when($sqliteService.executeSql(query, [user.Name]));
        }
      };
    });
}());
