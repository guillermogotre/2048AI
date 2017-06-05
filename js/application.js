// Wait till the browser is ready to render the game (avoids glitches)

window.requestAnimationFrame(function () {
  var game = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  var ia = new IA(game);

  var startText = "Start AI";
  var endText= "Stop AI";
  var iaButton = $("#IA-button");

  iaButton.text(startText);
  iaButton.click(function(e){
    var self = this;
    var text = $(self).text();

    if(text === startText){
      console.log(startText);
      ia.start(function(){
          console.log(endText);
          $(self).text(startText);
      });
      $(self).text(endText);
    }
    else{
      console.log(endText);
      ia.stop();
      $(self).text(startText);
    }

  });
});
