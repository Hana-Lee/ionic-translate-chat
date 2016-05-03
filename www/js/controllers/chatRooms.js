/**
 * @author Hana Lee
 * @since 2016-04-23 20:50
 */

/*globals Camera, FileUploadOptions, FileTransfer, Autolinker */
angular.module('translate-chat.chatRooms-controller', [])
  .controller('ChatRoomsCtrl',
    function ($scope, $rootScope, $state, $stateParams, MessageService, $ionicActionSheet,
              $ionicScrollDelegate, $timeout, Chats, $ionicModal,
              $ionicTabsDelegate, Socket, UserService, $ionicHistory, _, SettingService,
              $cordovaToast, ImageFileUploader, $cordovaCamera, md5) {
      'use strict';

      var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
      var footerBar;
      var scroller;
      var txtInput;
      var keyboardHeight = 0;
      var isAndroid = ionic.Platform.isAndroid();
      var chatRoomId = $stateParams.chatRoomId;
      var backViewId = $stateParams.backViewId;
      var user = UserService.get();
      $scope.imageUploadUrl = 'http://192.168.200.114:3000/api/image';

      $scope.user = {};
      $scope.toUser = {};
      $scope.settingsList = [{
        id : 'translate_ko',
        text : '한국어를 번역',
        checked : false
      }, {
        id : 'show_picture',
        text : '사진 보기',
        checked : false
      }];

      user.then(function (result) {
        $scope.user = result;
        console.log('user ', $scope.user);
        Chats.getToUser({user_id : $scope.user.user_id, chat_room_id : chatRoomId}).then(
          function (result) {
            $scope.toUser = result;
            console.log('to user', result);
            var params = {
              user_id : $scope.user.user_id,
              online : 1
            };
            Socket.emit('updateUserOnlineState', params);

            SettingService.getSettingsList({
              user_id : $scope.user.user_id,
              chat_room_id : chatRoomId
            }).then(function (result) {
              if (result) {
                $scope.settingsList[0].checked = result.translate_ko ? true : false;
                $scope.settingsList[1].checked = result.show_picture ? true : false;
              }
            }, function (error) {
              console.error('get settings list error : ', error);
            });
          }, function (error) {
            console.error('get to user error : ', JSON.stringify(error));
          });
      });

      $scope.messages = [];

      $scope.input = {
        message : localStorage['userMessage-' + $scope.toUser.user_id] || ''
      };

      var _seed = null;

      function createUID(value) {
        if (!_seed) {
          _seed = (new Date()).valueOf();
        }
        _seed++;

        return md5.createHash(_seed + value);
      }

      function keyboardPluginAvailable() {
        return window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard;
      }

      function keyboardShowHandler(event) {
        console.log('keyboardShowHandler');
        keyboardHeight = event.keyboardHeight;

        $rootScope.hideTabs = true;

        $timeout(function () {
          if (isAndroid) {
            scroller.style.bottom = footerBar.clientHeight + 'px';
          } else {
            scroller.style.bottom = footerBar.clientHeight + keyboardHeight + 'px';
          }
          viewScroll.scrollBottom(false);
        }, 0);
      }

      function keyboardHideHandler(/*event*/) {
        console.log('Goodnight, sweet prince');
        keyboardHeight = 0;

        $timeout(function () {
          scroller.style.bottom = footerBar.clientHeight + 'px';
          viewScroll.scrollBottom(false);
        }, 0);
      }

      function keydownHandler(event) {
        console.log('key down handler', event.keyCode);
        if (keyboardPluginAvailable()) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (event.keyCode === 13) {
          event.preventDefault();
          event.stopPropagation();

          if (txtInput.val().replace(/\s+/g, '') !== '') {
            $scope.sendMessage();
          } else {
            txtInput.val('');
          }
        }
      }

      function getMessages() {
        // the service is mock but you would probably pass the toUser's GUID here
        MessageService.getUserMessages(chatRoomId).then(function (data) {
          $scope.doneLoading = true;
          $scope.messages = data;

          $timeout(function () {
            viewScroll.scrollBottom(false);
          }, 0);
        }, function (error) {
          console.error('get user messages error : ', error);
        });
      }

      $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        $ionicTabsDelegate.showBar(false);
        viewData.enableBack = true;
        var currentViewStateName = $ionicHistory.viewHistory().currentView.stateName;
        var backView = _.find($ionicHistory.viewHistory().views, function (view) {
          return view.viewId === backViewId;
        });
        console.log('back view ', backView);
        if (backView && (currentViewStateName !== backView.stateName)) {
          $ionicHistory.backView(backView);
        } else {
          $rootScope.$ionicGoBack = function () {
            $state.go('tab.friends');
          };
        }
      });

      $scope.$on('$ionicView.enter', function () {
        console.log('ChatRooms $ionicView.enter');

        Socket.on('new_message', function (data) {
          $scope.doneLoading = true;
          if (data.error) {
            console.error('new message receive error : ', data.error);
          } else {
            var fromUserId = $scope.toUser.user_id;
            if (data.result.user_name === $scope.user.user_name) {
              fromUserId = $scope.user.user_id;
            }

            $scope.messages.push({
              user_id : fromUserId,
              created : new Date(),
              text : data.result.text,
              type : data.result.type
            });

            $timeout(function () {
              viewScroll.scrollBottom(false);
            }, 0);
          }
        });

        window.addEventListener('native.keyboardshow', keyboardShowHandler);
        window.addEventListener('native.keyboardhide', keyboardHideHandler);

        if (keyboardPluginAvailable()) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }

        getMessages();

        $timeout(function () {
          footerBar = document.body.querySelector('#userMessagesView .bar-footer');
          scroller = document.body.querySelector('#userMessagesView .scroll-content');
          txtInput = angular.element(footerBar.querySelector('textarea'));

          txtInput.on('keydown', keydownHandler);
        }, 0);
      });

      $scope.$on('$ionicView.leave', function () {
        console.log('leaving UserMessages view, destroying interval');

        window.removeEventListener('native.keyboardshow', keyboardShowHandler);
        window.removeEventListener('native.keyboardhide', keyboardHideHandler);

        if (keyboardPluginAvailable()) {
          cordova.plugins.Keyboard.disableScroll(false);
        }

        var params = {
          user_id : $scope.user.user_id,
          online : 0
        };
        Socket.emit('updateUserOnlineState', params);
      });

      $scope.$on('$ionicView.beforeLeave', function () {
        $ionicTabsDelegate.showBar(true);

        if (!$scope.input.message || $scope.input.message === '') {
          localStorage.removeItem('userMessage-' + $scope.toUser.user_id);
        }
      });

      $scope.$watch('input.message', function (newValue/*, oldValue*/) {
        localStorage['userMessage-' + $scope.toUser.user_id] = newValue || '';
      });

      $ionicModal.fromTemplateUrl('templates/show-image-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        console.log('show image modal init done');
        $scope.showPictureModal = modal;
      });

      $scope.showPictureSrc = null;
      $scope.showPicture = function (message) {
        // $scope.showPictureSrc = $scope.imageUploadUrl + '/' + message.text;
        $scope.showPictureSrc = message.text;
        $scope.showPictureModal.show();
      };

      $scope.hidePicture = function () {
        $scope.showPictureModal.hide();
        $scope.showPictureSrc = null;
      };

      $scope.retrievePicture = function (event) {
        event.preventDefault();

        if (ionic.Platform.isNativeBrowser) {
          var fileButton = document.querySelector('#image-file-picker');
          angular.element(fileButton).bind('change', function () {
            var imageFile = $scope.imageFile;
            ImageFileUploader.uploadImageFileToUrl(imageFile, $scope.imageUploadUrl).then(function () {
              var message = {
                user_id : $scope.user.user_id,
                created : new Date(),
                user_name : $scope.user.user_name,
                user_face : $scope.user.user_face,
                type : 'image',
                to_user : $scope.toUser,
                text : imageFile.fileName
              };

              $scope.input.message = '';

              $timeout(function () {
                Socket.emit('new_message', {
                  type : message.type, text : message.text,
                  friends : [message.to_user]
                });
              }, 1);
            }, function (error) {
              console.error('upload image file to server error : ', error);
            });
          });
          fileButton.click();
        } else {
          var options = {
            destinationType : Camera.DestinationType.NATIVE_URI,
            sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
            encodingType : Camera.EncodingType.JPEG,
            mediaType : Camera.MediaType.PICTURE,
            saveToPhotoAlbum: false,
            quality : 80,
            correctOrientation: true
          };

          if (isAndroid) {
            options.destinationType = Camera.DestinationType.FILE_URI;
          }

          $cordovaCamera.getPicture(options).then(function(imageData) {
            $scope.imgURI = 'data:image/jpeg;base64,' + imageData;

            var uploadOptions = new FileUploadOptions();
            uploadOptions.fileKey = 'image';
            uploadOptions.fileName = createUID(imageData.substr(imageData.lastIndexOf('/') + 1)) + '.jpg';
            uploadOptions.mimeType = 'image/jpeg';
            uploadOptions.chunkedMode = true;

            var ft = new FileTransfer();
            ft.upload(imageData, encodeURI($scope.imageUploadUrl), function () {
              console.log('upload success : ', arguments);
              var message = {
                user_id : $scope.user.user_id,
                created : new Date(),
                user_name : $scope.user.user_name,
                user_face : $scope.user.user_face,
                type : 'image',
                to_user : $scope.toUser,
                text : uploadOptions.fileName
              };

              $scope.input.message = '';

              $timeout(function () {
                Socket.emit('new_message', {
                  type : message.type, text : message.text,
                  friends : [message.to_user]
                });
              }, 1);
            }, function(error) {
              console.error('upload error : ', error);
            }, uploadOptions);
          }, function(error) {
            console.error('get picture error : ', error);
            // An error occured. Show a message to the user
          });
        }
      };

      $scope.translateSettingChange = function () {
        var params = {
          translate_ko : $scope.settingsList[0].checked ? '1' : '0',
          show_picture : null,
          user_id : $scope.user.user_id,
          chat_room_id : chatRoomId
        };
        SettingService.updateTranslateSetting(params).then(function () {
          if (!ionic.Platform.isNativeBrowser) {
            $cordovaToast.show('변경 완료', 'long', 'bottom');
          }
        });
      };

      $ionicModal.fromTemplateUrl('templates/chat-room-setting.html', {
        scope : $scope,
        animation : 'slide-in-up'
      }).then(function (modal) {
        $scope.settingModal = modal;
      });

      $scope.showSetting = function () {
        $scope.settingModal.show();
      };

      $scope.hideSetting = function () {
        $scope.settingModal.hide();
      };

      $scope.sendMessage = function (/*sendMessageForm*/) {
        var message = {
          user_id : $scope.user.user_id,
          created : new Date(),
          user_name : $scope.user.user_name,
          user_face : $scope.user.user_face,
          type : 'text',
          to_user : $scope.toUser,
          text : $scope.input.message
        };

        $scope.input.message = '';

        $timeout(function () {
          // $scope.messages.push(message);
          viewScroll.scrollBottom(true);

          Socket.emit('new_message', {
            type : message.type, text : message.text,
            friends : [message.to_user]
          });
        }, 500);
      };

      $scope.onMessageHold = function (event, itemIndex, message) {
        event.preventDefault();

        console.log('onMessageHold');
        console.log('message: ' + JSON.stringify(message, null, 2));
        $ionicActionSheet.show({
          buttons : [{
            text : 'Copy Text'
          }],
          buttonClicked : function (index) {
            switch (index) {
              case 0:
                cordova.plugins.clipboard.copy(message.text);
                break;
            }

            return true;
          }
        });
      };

      $scope.$on('elastic:resize', function (event, element, oldHeight, newHeight) {
        // do stuff
        event.preventDefault();

        if (!element) {
          return;
        }

        if (!footerBar) {
          return;
        }

        var newFooterHeight = newHeight + 10;
        newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;

        footerBar.style.height = newFooterHeight + 'px';

        if (isAndroid) {
          scroller.style.bottom = newFooterHeight + 'px';
        } else {
          scroller.style.bottom = newFooterHeight + keyboardHeight + 'px';
        }

        setTimeout(function () {
          viewScroll.scrollBottom(true);
        }, 50);
      });
    })

  // services
  .factory('SettingService', function ($q, Socket) {
    'use strict';

    return {
      updateTranslateSetting : function (userData) {
        var deferred = $q.defer();

        Socket.emit('updateChatRoomSettingsTranslateKo', userData);
        Socket.on('updatedChatRoomSettingsTranslateKo', function (data) {
          Socket.removeListener('updatedChatRoomSettingsTranslateKo');

          if (data.error) {
            deferred.reject(data.error);
          } else {
            deferred.resolve(data.result);
          }
        });

        return deferred.promise;
      },
      getSettingsList : function (userData) {
        var deferred = $q.defer();

        Socket.emit('retrieveChatRoomSettingsList', userData);
        Socket.on('retrievedChatRoomSettingsList', function (data) {
          Socket.removeListener('retrievedChatRoomSettingsList');

          if (data.error) {
            deferred.reject(data.error);
          } else {
            deferred.resolve(data.result);
          }
        });

        return deferred.promise;
      }
    };
  })
  .factory('MessageService', function ($http, $q, Socket) {
    'use strict';
    var me = {};

    me.getUserMessages = function (chatRoomId) {
      var deferred = $q.defer();

      Socket.emit('retrieveAllChatMessagesByChatRoomId', {
        chat_room_id : chatRoomId
      });
      Socket.on('retrievedAllChatMessagesByChatRoomId', function (data) {
        Socket.removeListener('retrievedAllChatMessagesByChatRoomId');

        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    };

    return me;
  })

  .factory('ImageFileUploader', function ($q, $http) {
    'use strict';

    return {
      uploadImageFileToUrl : function (imageFile, uploadUrl) {
        var deferred = $q.defer();
        var fd = new FormData();
        fd.append('image', imageFile);

        $http.post(uploadUrl, fd, {
          transformRequest : angular.identity,
          headers : {'Content-Type' : undefined}
        }).success(function (res) {
          console.log('success', res);
          deferred.resolve(res);
        }).error(function (error) {
          console.error('image file upload error : ', error);
          deferred.reject(error);
        });

        return deferred.promise;
      }
    };
  })

  .filter('nl2br', function () {
    'use strict';
    return function (data) {
      if (!data) {
        return data;
      }
      return data.replace(/\n\r?/g, '<br />');
    };
  })

  .directive('autolinker', function ($timeout) {
    'use strict';
    return {
      restrict : 'A',
      link : function (scope, element) {
        $timeout(function () {
          var eleHtml = element.html();

          if (eleHtml === '') {
            return false;
          }

          var text = Autolinker.link(eleHtml, {
            className : 'autolinker',
            newWindow : false
          });

          element.html(text);

          var autolinks = element[0].getElementsByClassName('autolinker');
          var autolinksLength = autolinks.length;
          var i;

          function onLinkClick(e) {
            var href = e.target.href;
            console.log('autolinkClick, href: ' + href);

            if (href) {
              //window.open(href, '_system');
              window.open(href, '_blank');
            }

            e.preventDefault();
            return false;
          }

          for (i = 0; i < autolinksLength; i++) {
            angular.element(autolinks[i]).bind('click', onLinkClick);
          }
        }, 0);
      }
    };
  })
  .directive('imageFileModel', function ($parse) {
    'use strict';

    return {
      restrict : 'A',
      link : function (scope, element, attrs) {
        var model = $parse(attrs.imageFileModel);
        var modelSetter = model.assign;

        element.bind('change', function () {
          console.log('file button change 0 ');
          scope.$apply(function () {
            modelSetter(scope, element[0].files[0]);
          });
        });
      }
    };
  });
