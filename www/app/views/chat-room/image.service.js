/**
 * @author Hana Lee
 * @since 2016-05-09 19:58
 */

/*globals Camera, FileUploadOptions, FileTransfer */
(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('ImageService', ImageService);

  ImageService.$inject = ['$q', '$cordovaCamera', '$http', 'Utils', 'CONFIG'];

  function ImageService($q, $cordovaCamera, $http, Utils, CONFIG) {
    var imageServerUrl = CONFIG.serverUrl + ':' + CONFIG.serverPort + '/api/image';
    return {
      getServerUrl : getServerUrl,
      loadPicture : loadPicture,
      makeImageFileName : makeImageFileName,
      uploadImageFileToUrl : uploadImageFileToUrl
    };

    function getServerUrl() {
      return imageServerUrl;
    }

    function loadPicture() {
      var deferred = $q.defer();
      var isAndroid = ionic.Platform.isAndroid();
      var options = {
        destinationType : Camera.DestinationType.NATIVE_URI,
        sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
        encodingType : Camera.EncodingType.JPEG,
        mediaType : Camera.MediaType.PICTURE,
        saveToPhotoAlbum : false,
        quality : 80,
        correctOrientation : true
      };

      if (isAndroid) {
        options.destinationType = Camera.DestinationType.FILE_URI;
      }

      $cordovaCamera.getPicture(options).then(function (imageData) {
        deferred.resolve(imageData);
      }, function (error) {
        deferred.reject(error);
      });

      return deferred.promise;
    }

    function makeImageFileName(imageFile, imageFileExt) {
      return Utils.createUID(imageFile.substr(imageFile.lastIndexOf('/') + 1)) + (imageFileExt || '.jpg');
    }

    function uploadImageFileToUrl(imageFile, isNativeBrowser) {
      var deferred = $q.defer();

      if (isNativeBrowser) {
        _uploadNativeBrowserImageFileToUrl(imageFile)
          .then(function (result) {
            deferred.resolve(result);
          }, function (error) {
            deferred.reject(error);
          });
      } else {
        _uploadDeviceImageFileToUrl(imageFile)
          .then(function (result) {
            deferred.resolve(result);
          }, function (error) {
            deferred.reject(error);
          });
      }

      return deferred.promise;
    }

    function _uploadDeviceImageFileToUrl(imageFile) {
      var deferred = $q.defer();
      var uploadOptions = new FileUploadOptions();
      uploadOptions.fileKey = 'image';
      uploadOptions.fileName = makeImageFileName(imageFile);
      uploadOptions.mimeType = 'image/jpeg';
      uploadOptions.chunkedMode = true;

      var ft = new FileTransfer();
      ft.upload(imageFile, encodeURI(imageServerUrl), function () {
        deferred.resolve(uploadOptions.fileName);
      }, function (error) {
        deferred.reject(error);
      }, uploadOptions);

      return deferred.promise;
    }

    function _uploadNativeBrowserImageFileToUrl(imageFile) {
      var deferred = $q.defer();
      var fd = new FormData();
      fd.append('image', imageFile);

      var fileName = imageFile.name;
      var fileExt = fileName.substr(fileName.lastIndexOf('.'));
      fileName = fileName.substr(0, fileName.lastIndexOf('.'));
      var encodedFileName = makeImageFileName(fileName, fileExt);
      var uploadUrl = imageServerUrl + '?fileName=' + encodedFileName;

      $http.post(uploadUrl, fd, {
        transformRequest : angular.identity,
        headers : {'Content-Type' : undefined}
      }).success(function (res) {
        console.log('success', res);
        deferred.resolve(encodedFileName);
      }).error(function (error) {
        console.error('image file upload error : ', error);
        deferred.reject(error);
      });

      return deferred.promise;
    }
  }
})();
