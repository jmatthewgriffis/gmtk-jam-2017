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

    this.getPosInWrapper = obj => {
      let offset = obj.html.offset();

      return {
        x: offset.left - this.wrapperPos.left + obj.size.x * 0.5,
        y: offset.top - this.wrapperPos.top + obj.size.y * 0.5
      }
    }

    this.detectCollision = ( obj1, obj2 ) => {
      let isCollision = false;

      if ( obj1.pos.x + obj1.size.x * 0.5 > obj2.pos.x - obj2.size.x * 0.5
        && obj1.pos.x - obj1.size.x * 0.5 < obj2.pos.x + obj2.size.x * 0.5
        && obj1.pos.y + obj1.size.y * 0.5 > obj2.pos.y - obj2.size.y * 0.5
        && obj1.pos.y - obj1.size.y * 0.5 < obj2.pos.y + obj2.size.y * 0.5
      ) {
        isCollision = true;
      }

      return isCollision;
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

      if ( this.isSpinning ) {
        let enemy = {
          html: $( '.enemy' )
        };

        enemy.size = {
          x: enemy.html.width(),
          y: enemy.html.height()
        };

        enemy.pos = myGame.getPosInWrapper( enemy );

        let knockback = {
          html: $( '#knockback' )
        };

        knockback.size = {
          x: knockback.html.width(),
          y: knockback.html.height()
        };

        knockback.pos = myGame.getPosInWrapper( knockback );

        if ( myGame.detectCollision( knockback, enemy ) ) {
          console.log('hit!')
          enemy.html.css('left', 10);
        }
      }
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
        'top': this.pos.y - this.size.y * 0.5,
        'left': this.pos.x - this.size.x * 0.5
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
        this.isSpinning = true;
        this.html.css( 'animation', 'spin 0.75s ease' );
      }
    }

    this.spinDone = () => {
      this.allowSpin = true;
      this.isSpinning = false;
      this.html.css( 'animation', 'none' );
    }
  }
} )();