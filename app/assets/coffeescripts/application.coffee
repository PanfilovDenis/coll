
@App = angular.module('App', ['socket.io', 'ui.codemirror'])


@App.controller 'DocumentCtrl', [ '$scope', '$socket', ($scope, $socket) ->
  $socket.forward 'document:sync:completed', $scope
  textarea = document.getElementById('text')
  
  $scope.lastChange = ""
  $scope.needSend = false

  $scope.key = new Date().getTime().toString()

  $scope.pos = 
    line: 0
    ch: 0

  editor = CodeMirror (elt) -> textarea.parentNode.replaceChild(elt, textarea)

  isEnter = (obj) ->
    obj.origin == '+input' && obj.text.length == 2
  isBackspace = (obj) ->
    obj.origin == '+delete' && obj.removed.length == 2


  editor.on 'change', (doc, obj) ->
    if isEnter(obj)
      $scope.pos.line++
    else if isBackspace(obj)
      $scope.pos.line--
    if obj.origin == '+input'
      $scope.pos.ch++
    else if obj.origin == '+delete'
      $scope.pos.ch--

    if $scope.lastChange == editor.getValue()
      $scope.needSend = false
    else
      $scope.needSend = true

  setInterval ->
    if $scope.needSend
      $scope.lastChange = editor.getValue()
      cursor = editor.getCursor()
      $socket.emit 'document:sync', 
        document:
          posDiffCh: $scope.pos.ch,
          posDiffLine: $scope.pos.line,
          positionCh: cursor.ch,
          positionLine: cursor.line,
          content: $scope.lastChange,
          timestamp: new Date().getTime() 
          key: $scope.key 
      $scope.pos = 
        line: 0
        ch: 0
      $scope.needSend = false
  , 1

  $socket.on 'message', (data) ->
    return if $scope.key == data.key
    if ($scope.lastChange != data.content)
      cursor = editor.getCursor()
      if (cursor.line >= data.position.line && cursor.ch >= data.position.ch)
        if cursor.line != parseInt(data.position.line)
          cursor.line = cursor.line + data.posDiff.line
        else  
          cursor.ch = cursor.ch + data.posDiff.ch

      $scope.lastChange = data.content
      patch = JsDiff.createPatch('', editor.getValue(), data.content, '', '')
      newStr = JsDiff.applyPatch(editor.getValue(), patch)
      editor.setValue(newStr)
      editor.setCursor cursor

]

