(function() {
  this.App = angular.module('App', ['socket.io', 'ui.codemirror']);

  this.App.controller('DocumentCtrl', [
    '$scope', '$socket', function($scope, $socket) {
      var editor, isBackspace, isEnter, textarea;
      $socket.forward('document:sync:completed', $scope);
      textarea = document.getElementById('text');
      $scope.lastChange = "";
      $scope.needSend = false;
      $scope.key = new Date().getTime().toString();
      $scope.pos = {
        line: 0,
        ch: 0
      };
      editor = CodeMirror(function(elt) {
        return textarea.parentNode.replaceChild(elt, textarea);
      });
      isEnter = function(obj) {
        return obj.origin === '+input' && obj.text.length === 2;
      };
      isBackspace = function(obj) {
        return obj.origin === '+delete' && obj.removed.length === 2;
      };
      editor.on('change', function(doc, obj) {
        if (isEnter(obj)) {
          $scope.pos.line++;
        } else if (isBackspace(obj)) {
          $scope.pos.line--;
        }
        if (obj.origin === '+input') {
          $scope.pos.ch++;
        } else if (obj.origin === '+delete') {
          $scope.pos.ch--;
        }
        if ($scope.lastChange === editor.getValue()) {
          return $scope.needSend = false;
        } else {
          return $scope.needSend = true;
        }
      });
      setInterval(function() {
        var cursor;
        if ($scope.needSend) {
          $scope.lastChange = editor.getValue();
          cursor = editor.getCursor();
          $socket.emit('document:sync', {
            documentSessionId: $('#document-session-id').val(),
            document: {
              posDiffCh: $scope.pos.ch,
              posDiffLine: $scope.pos.line,
              positionCh: cursor.ch,
              positionLine: cursor.line,
              content: $scope.lastChange,
              timestamp: new Date().getTime(),
              key: $scope.key
            }
          });
          $scope.pos = {
            line: 0,
            ch: 0
          };
          return $scope.needSend = false;
        }
      }, 1);
      return $socket.on('message', function(data) {
        var cursor, newStr, patch;
        if ($scope.key === data.key) {
          return;
        }
        if ($scope.lastChange !== data.content) {
          cursor = editor.getCursor();
          if (cursor.line >= parseInt(data.position.line) && cursor.ch >= parseInt(data.position.ch)) {
            if (cursor.line !== parseInt(data.position.line)) {
              cursor.line = cursor.line + parseInt(data.posDiff.line);
            } else {
              cursor.ch = cursor.ch + parseInt(data.posDiff.ch);
            }
          }
          $scope.lastChange = data.content;
          patch = JsDiff.createPatch('', editor.getValue(), data.content, '', '');
          newStr = JsDiff.applyPatch(editor.getValue(), patch);
          editor.setValue(newStr);
          return editor.setCursor(cursor);
        }
      });
    }
  ]);

}).call(this);
