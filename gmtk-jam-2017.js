( () => {
  $( () => {
    this.init();
  } );

  this.init = () => {
    this.frameRate = 30;
    this.updateLoopId = setInterval( this.update, 1000 / this.frameRate );

    this.allowInput = true;

    this.player = new player();
    this.player.init();
  }

  this.update = () => {
    this.player.update();
  }

  $( document ).keydown( () => {
    this.player.spin();
  } );

  $( document ).keyup( () => {
    // 
  } );

  function player() {
    this.init = () => {
      this.wrapper = $( '#wrapper' );

      this.obj = $( '#player' );
      this.obj.bind( 'animationend', this.spinDone );
      this.wrapper.append( this.obj );

      this.setSize();
      this.setPosition();
      
      this.allowSpin = true;
    };

    this.update = () => {
      this.updateSize()
      this.updatePosition();
    };

    this.applySize = () => {
      this.obj.width( this.size.x );
      this.obj.height( this.size.y );
    }

    this.setSize = () => {
      this.size = {
        x: 50,
        y: 50
      };

      this.applySize();
    }

    this.updateSize = () => {
      this.applySize();
    }

    this.applyPosition = () => {
      this.obj.css( {
        'top': this.pos.y - ( this.size.y * 0.5 ),
        'left': this.pos.x - ( this.size.x * 0.5 )
      } );
    }

    this.setPosition = () => {
      this.pos = {
        x: this.wrapper.width() * 0.5,
        y: this.wrapper.height() * 0.5
      };

      this.applyPosition();
    }

    this.updatePosition = () => {
      this.applyPosition();
    }

    this.spin = () => {
      if ( this.allowSpin ) {
        this.allowSpin = false;
        this.obj.css( 'animation', 'spin 0.75s ease' );
      }
    }

    this.spinDone = () => {
      this.allowSpin = true;
      this.obj.css( 'animation', 'none' );
    }
  }
} )();