$(function() {
  var socket = io.connect();
  var chatApp = Chat.init(socket);
  var chatUtils = {
    userName: '',
    sendMessage: $('#send-message'),
    messages: $('#messages'),
    room: $('#room'),
    roomList: $('#room-list'),
    divEscapedContentElement: function(message) {
      return $('<div></div>').text(message);
    },
    divSystemContentElement: function(message) {
      return $('<div></div>').html('<i>' + message + '</i>');
    },
    processUserInput: function(chatApp, socket) {
      var message = this.sendMessage.val();
      var systemMessage;
      if (message.charAt(0) == '/') {
        systemMessage = chatApp.processCommand(message);
        systemMessage && this.messages.append(this.divSystemContentElement(systemMessage));
      } else {
        chatApp.sendMessage(this.room.text(), message);
        this.messages.append(this.divEscapedContentElement(this.userName + ': ' + message));
        this.messages.scrollTop(this.messages.prop('scrollHeight'));
      }
      this.sendMessage.val('');
    }
  };
  socket.on('nameResult', function(result) {
    var message = result.success ? 'You are now known as ' + result.name + '.' : result.message;
    chatUtils.messages.append(chatUtils.divSystemContentElement(message));
    chatUtils.userName = result.name;
  });
  socket.on('joinResult', function(result) {
    chatUtils.room.text(result.room);
    chatUtils.messages.append(chatUtils.divSystemContentElement('Room changed.'));
  });
  socket.on('message', function(message) {
    console.log(message);
    chatUtils.messages.append(chatUtils.divSystemContentElement(message.text));
  });
  socket.on('rooms', function(rooms) {
    chatUtils.roomList.empty();
    for (var room in rooms) {
      room = room.substring(1, room.length);
      room && chatUtils.roomList.append(chatUtils.divEscapedContentElement(room));
    }
  });
  chatUtils.roomList.find('div').click(function() {
    chatApp.processCommand('/join' + $(this).text());
    chatUtils.sendMessage.focus();
  });
  $('#send-form').submit(function() {
    chatUtils.processUserInput(chatApp, socket);
    return false;
  });
  setInterval(function() {
    socket.emit('rooms');
  }, 3e4);
  chatUtils.sendMessage.focus();
});