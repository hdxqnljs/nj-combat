(function() {
  var Chat = function(socket) {
    this.socket = socket;
  };
  Chat.prototype = {
    sendMessage: function(room, text) {
      this.socket.emit('message', {
        room: room,
        text: text
      });
    },
    changeRoom: function(room) {
      this.socket.emit('join', { newRoom: room });
    },
    processCommand: function(commandString) {
      var words = this.commandFormat(commandString).split(' ');
      var command = words[0].substring(1, words[0].length).toLowerCase();
      var message = false;
      switch(command) {
        case 'join':
        words.splice(0, 1);
        this.changeRoom(words.join(' '));
        break;
        case 'nick':
        words.splice(0, 1);
        this.socket.emit('nameAttempt', words.join(' '));
        break;
        default:
        message = 'Unrecognized command.';
        break;
      }
      return message;
    },
    commandFormat: function(str) {
      var result = str.replace(/^\s+|\s+$/g, '')
                      .replace(/\b\s+\b/g, ' ');
      return result;
    }    
  };
  Chat.init = function(socket) {
    return new this(socket);
  };
  window.Chat = Chat;
})();