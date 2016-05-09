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

  ImageService.$inject = ['$q', '$cordovaCamera', 'Utils'];

  function ImageService($q, $cordovaCamera, Utils) {
    return {
      loadPicture : loadPicture,
      makeImageFileName : makeImageFileName,
      uploadImageFileToUrl : uploadImageFileToUrl
    };

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

    function makeImageFileName(imageFile) {
      return Utils.createUID(imageFile.substr(imageFile.lastIndexOf('/') + 1)) + '.jpg';
    }

    function uploadImageFileToUrl(imageFile, uploadUrl) {
      var deferred = $q.defer();
      var uploadOptions = new FileUploadOptions();
      uploadOptions.fileKey = 'image';
      uploadOptions.fileName = makeImageFileName(imageFile);
      uploadOptions.mimeType = 'image/jpeg';
      uploadOptions.chunkedMode = true;

      var ft = new FileTransfer();
      ft.upload(imageFile, encodeURI(uploadUrl), function () {
        deferred.resolve(uploadOptions.fileName);
      }, function (error) {
        deferred.reject(error);
      }, uploadOptions);

      return deferred.promise;
    }
  }
})();
