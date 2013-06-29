(function() {
  this.App = angular.module('App', ['socket.io', 'ui.codemirror']);

  this.App.controller('DocumentCtrl', [
    '$scope', '$socket', function($scope, $socket) {
      var editor, textarea;
      $socket.forward('document:sync:completed', $scope);
      textarea = document.getElementById('text');
      editor = CodeMirror(function(elt) {
        return textarea.parentNode.replaceChild(elt, textarea);
      });
      editor.on('change', function(doc) {
        var value;
        value = doc.getValue();
        return $socket.emit('document:sync', {
          document: {
            content: value,
            timestamp: new Date().getTime()
          }
        });
      });
      return $scope.$on('document:sync:completed', function(ev, data) {
        return editor.setValue(data.content);
      });
    }
  ]);

}).call(this);
