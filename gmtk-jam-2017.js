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

      let obj1Edges = getEdges( obj1 );
      let obj2Edges = getEdges( obj2 );

      if ( obj1Edges.right > obj2Edges.left
        && obj1Edges.left < obj2Edges.right
        && obj1Edges.bottom > obj2Edges.top
        && obj1Edges.top < obj2Edges.bottom ) {
        isCollision = true;
      }

      return isCollision;
    }

    function getEdges( obj ) {
      return {
        top: obj.pos.y - obj.size.y * 0.5,
        right: obj.pos.x + obj.size.x * 0.5,
        bottom: obj.pos.y + obj.size.y * 0.5,
        left: obj.pos.x - obj.size.x * 0.5
      };
    }

    $( document ).keydown( () => {
      this.player.spin();
    } );
  } // end Game

  function GameObject( html, size, pos, vel = { x: 0, y: 0 } ) {
    this.initBasic = () => {
      this.wrapper = myGame.wrapper;

      this.html = html;
      this.wrapper.append( this.html );

      this.vel = vel;

      this.setSize();
      this.setPosition();
    };

    this.updateBasic = () => {
      this.updateSize()
      this.updatePosition();
    };

    this.applySize = () => {
      this.html.outerWidth( this.size.x );
      this.html.outerHeight( this.size.y );
    }

    this.setSize = () => {
      this.size = size;
      this.applySize();
    }

    this.updateSize = () => {
      this.applySize();
    }

    this.applyPosition = () => {
      this.pos.x += this.vel.x;
      this.pos.y += this.vel.y;

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
      this.absorb = false;

      // Manage knockback

      let knockback = {
        html: $( '#beam' )
      };

      knockback.size = {
        x: knockback.html.outerWidth(),
        y: knockback.html.outerHeight()
      };

      knockback.pos = myGame.getPosInWrapper( knockback );

      this.attackHitbox = {
        pos: this.pos,
        size: {
          x: this.size.x + knockback.size.y * 1.9,
          y: this.size.y + knockback.size.y * 1.9
        }
      };
    };

    this.update = () => {
      this.updateBasic();
    };

    this.spin = () => {
      if ( ! this.allowSpin ) { return; }
      
      this.allowSpin = false;
      this.isSpinning = true;
      this.html.css( 'animation', `${ this.absorb ? 'spinCCW' : 'spinCW' } 0.25s ease` );

      this.html.find( '#beam ').removeClass( this.absorb ? 'absorb' : 'knockback' );
      this.html.find( '#beam ').addClass( this.absorb ? 'knockback' : 'absorb' );
    }

    this.spinDone = () => {
      this.allowSpin = true;
      this.isSpinning = false;
      this.html.css( 'animation', 'none' );

      this.absorb = ! this.absorb;
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
      x: myGame.wrapperSize.x * 1,
      y: myGame.wrapperSize.y * 0.75
    };

    let vel = {
      x: -5,
      y: 0
    }

    GameObject.call( this, html, size, pos, vel );

    this.init = () => {
      this.initBasic();

      this.maxVel = 50;
    };

    this.update = () => {
      this.updateBasic();
      if ( ( this.pos.x < 0 && this.vel.x < 0 )
        || ( this.pos.x > myGame.wrapperSize.x && this.vel.x > 0 ) ) {
        this.vel.x *= -1;
      }

      if ( myGame.player.isSpinning ) {
        if ( myGame.detectCollision( myGame.player.attackHitbox, this ) ) {
          if ( ! this.isHit ) {
            this.isHit = true;
            this.vel.x *= -1.5;
            if ( this.vel.x >= this.maxVel ) {
              this.vel.x = this.maxVel;
            }
          }
        } else {
          if ( this.isHit ) {
            this.isHit = false;
          }
        }
      }
    };
  } // end Enemy
  Enemy.prototype = Object.create( GameObject.prototype );
  Enemy.prototype.constructor = Enemy;
} )();