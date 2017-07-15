( () => {
  let myGame;

  $( () => {
    myGame = new game();
    myGame.init();
  } );

  function game() {
    this.wrapper = $( '#wrapper' );
    this.wrapperPos = this.wrapper.offset();

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

    this.getPosInWrapper = html => {
      let offset = html.offset();

      return {
        top: offset.top - this.wrapperPos.top,
        left: offset.left - this.wrapperPos.left
      }
    }

    $( document ).keydown( () => {
      this.player.spin();
    } );
  }

  function player() {
    this.init = () => {
      this.wrapper = myGame.wrapper;

      this.html = $( '#player' );
      this.html.bind( 'animationend', this.spinDone );
      this.wrapper.append( this.html );

      this.setSize();
      this.setPosition();

      this.allowSpin = true;
    };

    this.update = () => {
      this.updateSize()
      this.updatePosition();
    };

    this.applySize = () => {
      this.html.width( this.size.x );
      this.html.height( this.size.y );
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
      this.html.css( {
        'top': this.pos.y - ( this.size.y * 0.5 ),
        'left': this.pos.x - ( this.size.x * 0.5 )
      } );
    }

    this.setPosition = () => {
      this.pos = {
        x: this.wrapper.width() * 0.5,
        y: this.wrapper.height() * 0.75
      };

      this.applyPosition();
    }

    this.updatePosition = () => {
      this.applyPosition();
    }

    this.spin = () => {
      if ( this.allowSpin ) {
        this.allowSpin = false;
        this.html.css( 'animation', 'spin 0.75s ease' );
      }
    }

    this.spinDone = () => {
      this.allowSpin = true;
      this.html.css( 'animation', 'none' );
    }
  }
} )();