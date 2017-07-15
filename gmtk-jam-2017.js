( () => {
  $( () => {
    this.init();
  } );

  this.init = () => {
    this.frameRate = 30;
    this.updateLoopId = setInterval( this.update, 1000 / this.frameRate );
  }

  this.update = () => {
    console.log('hooah');
  }
} )();