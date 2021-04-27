document.addEventListener('DOMContentLoaded',domloaded,false);
function draw() {
    var canvas = document.getElementById('canvas');
    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
    }
  }
  function drawRectangles(){
    var canvasRectangles = document.getElementById('canvasRectagles');
    if (canvasRectangles.getContext) {
        var canvasRec = canvasRectangles.getContext('2d');

        canvasRec.fillStyle = 'rgb(200, 0, 0)';
        canvasRec.fillRect(10, 10, 50, 50);

        canvasRec.fillStyle = 'rgba(0, 0, 200, 0.5)';
        canvasRec.fillRect(30, 30, 50, 50);    
      }
  }