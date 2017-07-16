( () => {
  let myGame;

  $( () => {
    myGame = new Game();
    myGame.init();
  } );

  function Game() {
    this.wrapper = $( '#wrapper' );
    this.wrapperPosAbs = this.wrapper.offset();
    this.wrapperSize = {
      x: this.wrapper.width(),
      y: this.wrapper.height()
    };

    this.init = () => {
      // Create update loop

      this.frameRate = 30;
      this.updateLoopId = setInterval( this.update, 1000 / this.frameRate );

      // Misc.

      this.allowInput = true;

      // Manage GameObjects

      this.gameObjects = [];

      this.player = new Player();
      this.gameObjects.push( this.player );

      this.gameObjects.push( new Enemy() );

      this.gameObjects.forEach( obj => obj.init() );
    }

    this.update = () => {
      this.gameObjects.forEach( obj => obj.update() );
    }

    this.getPosInWrapper = obj => {
      let offset = obj.html.offset();

      return {
        x: offset.left - this.wrapperPosAbs.left + obj.size.x * 0.5,
        y: offset.top - this.wrapperPosAbs.top + obj.size.y * 0.5
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
  } // end Game

  function GameObject( html, size, pos ) {
    this.initBasic = () => {
      this.wrapper = myGame.wrapper;

      this.html = html;
      this.wrapper.append( this.html );

      this.setSize();
      this.setPosition();
    };

    this.updateBasic = () => {
      this.updateSize()
      this.updatePosition();
    };

    this.applySize = () => {
      this.html.width( this.size.x );
      this.html.height( this.size.y );
    }

    this.setSize = () => {
      this.size = size;
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
      this.pos = pos;
      this.applyPosition();
    }

    this.updatePosition = () => {
      this.applyPosition();
    }
  } // end GameObject

  function Player() {
    let html = $( '#player' );

    let size = {
      x: 50,
      y: 50
    };

    let pos = {
      x: myGame.wrapperSize.x * 0.5,
      y: myGame.wrapperSize.y * 0.75
    };

    GameObject.call( this, html, size, pos );

    this.init = () => {
      this.initBasic();

      this.html.bind( 'animationend', this.spinDone );
      this.allowSpin = true;
    };

    this.update = () => {
      this.updateBasic();
    };

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
  } // end Player
  Player.prototype = Object.create( GameObject.prototype );
  Player.prototype.constructor = Player;

  function Enemy() {
    let html = $( '.enemy.template' ).clone().removeClass( 'template' );

    let size = {
      x: 30,
      y: 30
    };

    let pos = {
      x: myGame.wrapperSize.x * 0.4,
      y: myGame.wrapperSize.y * 0.75
    };

    GameObject.call( this, html, size, pos );

    this.init = () => {
      this.initBasic();
    };

    this.update = () => {
      this.updateBasic();

      if ( myGame.player.isSpinning ) {
        let knockback = {
          html: $( '#knockback' )
        };

        knockback.size = {
          x: knockback.html.width(),
          y: knockback.html.height()
        };

        knockback.pos = myGame.getPosInWrapper( knockback );

        if ( myGame.detectCollision( knockback, this ) ) {
          console.log('hit!')
          this.pos.x = 10;
        }
      }
    };
  } // end Enemy
  Enemy.prototype = Object.create( GameObject.prototype );
  Enemy.prototype.constructor = Enemy;
} )();