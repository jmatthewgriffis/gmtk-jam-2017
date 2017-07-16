( () => {
  let myGame;

  $( () => {
    myGame = new Game();
    myGame.init();
  } );

  function Game() {
    let wrapper = $( '#wrapper' );

    this.wrapper = {
      html: wrapper,
      absPos: wrapper.offset(),
      innerSize: {
        x: wrapper.width(),
        y: wrapper.height()
      }
    };

    this.init = () => {
      // Create update loop

      this.frameRate = 30;
      this.updateLoopId = setInterval( this.update, 1000 / this.frameRate );

      // Misc.

      this.allowInput = true;
      this.pauseFrames = 0;
      this.pauseFramesPrev = this.pauseFrames;

      // Set up starfield
      this.starfield = $( '#stars' );
      this.stars = [];
      for ( let i = 0; i < 100; i++ ) { this.addStar( false ); }

      // Manage GameObjects

      this.gameObjects = [];

      this.player = new Player();
      this.gameObjects.push( this.player );

      this.gameObjects.push( new Enemy() );

      this.gameObjects.forEach( obj => obj.init() );
    }

    this.update = () => {
      if ( this.pauseFrames ) {
        this.pauseFramesPrev = this.pauseFrames;
        this.pauseFrames -= 1;
        return;
      }

      if ( this.pauseFramesPrev ) {
        this.pauseFramesPrev = this.pauseFrames;
        $( '.paused' ).removeClass( 'paused' );
      }

      this.updateStars()
      this.gameObjects.forEach( obj => obj.update() );
    }

    this.addStar = ( offscreen = true ) => {
      let x = offscreen ? -5 : 1 + Math.floor( ( Math.random() * ( myGame.wrapper.innerSize.x - 1 ) ) );
      let y = 1 + Math.floor( ( Math.random() * ( myGame.wrapper.innerSize.y - 1 ) ) );
      let star = $( `<div style="top: ${ y }px; left: ${ x }px;"></div>` );
      this.starfield.append( star );
      this.stars.push( star );
    }

    this.updateStars = () => {
      this.stars.forEach( ( star, index ) => {
        let x = parseInt( star.css( 'left' ) );
        let xVel = 1;
        x += xVel;

        if ( x > myGame.wrapper.innerSize.x ) {
          star.remove();
          this.stars.splice( index, 1 );
          this.addStar();
        } else {
          star.css( 'left', `${ x }px` );
        }
      } );
    }

    this.getPosInWrapper = obj => {
      let offset = obj.html.offset();

      return {
        x: offset.left - this.wrapper.absPos.left + obj.size.x * 0.5,
        y: offset.top - this.wrapper.absPos.top + obj.size.y * 0.5
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

  function GameObject( html, size, pos, append = false, vel = { x: 0, y: 0 } ) {
    this.initBasic = () => {
      this.html = html;
      if ( append ) { myGame.wrapper.html.append( this.html ); }

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

      let borderW = parseInt( this.html.css( 'border-width' ) );

      this.html.css( {
        'top': this.pos.y - this.size.y * 0.5 - borderW,
        'left': this.pos.x - this.size.x * 0.5 - borderW
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
      x: myGame.wrapper.innerSize.x * 0.5,
      y: myGame.wrapper.innerSize.y * 0.75
    };

    GameObject.call( this, html, size, pos );

    this.init = () => {
      this.initBasic();

      this.html.bind( 'animationend', this.spinDone );
      this.allowSpin = true;
      this.absorb = false;

      this.beamWeapon = new BeamWeapon();
      this.beamWeapon.init();
    };

    this.update = () => {
      this.updateBasic();

      this.beamWeapon.update();
    };

    this.spin = () => {
      if ( ! this.allowSpin ) { return; }

      this.allowSpin = false;
      this.isSpinning = true;
      this.html.css( 'animation', `${ this.absorb ? 'spinCCW' : 'spinCW' } 0.25s ease` );

      this.beamWeapon.beam.html.removeClass( this.absorb ? 'absorb' : 'knockback' );
      this.beamWeapon.beam.html.addClass( this.absorb ? 'knockback' : 'absorb' );

      this.beamWeapon.beam.attackHitbox.html[ `${ this.absorb ? 'add' : 'remove' }Class` ]( 'ccw' );
      this.beamWeapon.beam.attackHitbox.html.css( 'animation', 'none' );
      setTimeout( () => this.beamWeapon.beam.attackHitbox.html.css( 'animation', 'shield 2s ease' ) );
    }

    this.spinDone = event => {
      let animation = event.originalEvent.animationName;
      if ( animation !== 'spinCW' && animation !== 'spinCCW' ) { return; }

      this.allowSpin = true;
      this.isSpinning = false;
      this.html.css( 'animation', 'none' );

      this.absorb = ! this.absorb;
    }
  } // end Player
  Player.prototype = Object.create( GameObject.prototype );
  Player.prototype.constructor = Player;

  function BeamWeapon() {
    let html = $( '#weapon' );

    let size = {
      x: 15,
      y: 100
    };

    let pos = {
      x: myGame.player.size.x + size.x * 0.5,
      y: -myGame.player.size.y * 0.5
    };

    GameObject.call( this, html, size, pos );

    this.init = () => {
      this.initBasic();

      this.handle = new BeamWeaponHandle();
      this.handle.init();

      this.beam = new BeamWeaponBeam();
      this.beam.init();
    };

    this.update = () => {
      this.updateBasic();

      this.handle.update();
      this.beam.update();
    };
  } // end BeamWeapon
  BeamWeapon.prototype = Object.create( GameObject.prototype );
  BeamWeapon.prototype.constructor = BeamWeapon;

  function BeamWeaponHandle() {
    let html = $( '#handle' );

    let size = {
      x: myGame.player.beamWeapon.size.x,
      y: myGame.player.beamWeapon.size.y * 0.3
    };

    let pos = {
      x: size.x * 0.5,
      y: myGame.player.beamWeapon.size.y - size.y * 0.5
    };

    GameObject.call( this, html, size, pos );

    this.init = () => {
      this.initBasic();
    };

    this.update = () => {
      this.updateBasic();
    };
  } // end BeamWeaponHandle
  BeamWeaponHandle.prototype = Object.create( GameObject.prototype );
  BeamWeaponHandle.prototype.constructor = BeamWeaponHandle;

  function BeamWeaponBeam() {
    let html = $( '#beam' );

    let size = {
      x: myGame.player.beamWeapon.size.x,
      y: myGame.player.beamWeapon.size.y * 0.7
    };

    let pos = {
      x: size.x * 0.5,
      y: size.y * 0.5
    };

    GameObject.call( this, html, size, pos );

    this.init = () => {
      this.initBasic();

      this.attackHitbox = new BeamWeaponAttackHitbox();
      this.attackHitbox.init();
    };

    this.update = () => {
      this.updateBasic();

      this.attackHitbox.update();
    };
  } // end BeamWeaponBeam
  BeamWeaponBeam.prototype = Object.create( GameObject.prototype );
  BeamWeaponBeam.prototype.constructor = BeamWeaponBeam;

  function BeamWeaponAttackHitbox() {
    let html = $( '#beamAttackHitbox' );

    let size = {
      x: myGame.player.size.x + myGame.player.beamWeapon.beam.size.y * 1.9,
      y: myGame.player.size.y + myGame.player.beamWeapon.beam.size.y * 1.9
    };

    let pos = myGame.player.pos;

    GameObject.call( this, html, size, pos );

    this.init = () => {
      this.initBasic();

      this.html.bind( 'animationend', this.shieldDone );
    };

    this.update = () => {
      this.updateBasic();
    };

    this.shieldDone = event => {
      let animation = event.originalEvent.animationName;
      if ( animation !== 'shield' ) { return; }

      this.html.css( 'animation', 'none' );
    }
  } // end BeamWeaponAttackHitbox
  BeamWeaponAttackHitbox.prototype = Object.create( GameObject.prototype );
  BeamWeaponAttackHitbox.prototype.constructor = BeamWeaponAttackHitbox;

  function Enemy() {
    let html = $( '.enemy.template' ).clone().removeClass( 'template' );

    let size = {
      x: 30,
      y: 30
    };

    let pos = {
      x: myGame.wrapper.innerSize.x * 1,
      y: myGame.wrapper.innerSize.y * 0.75
    };

    let vel = {
      x: -5,
      y: 0
    }

    GameObject.call( this, html, size, pos, true, vel );

    this.init = () => {
      this.initBasic();

      this.maxVel = 50;
    };

    this.update = () => {
      this.updateBasic();

      if ( ( this.pos.x < 0 && this.vel.x < 0 )
        || ( this.pos.x > myGame.wrapper.innerSize.x && this.vel.x > 0 ) ) {
        this.vel.x *= -1;
      }

      if ( myGame.player.isSpinning ) {
        if ( myGame.detectCollision( myGame.player.beamWeapon.beam.attackHitbox, this ) ) {
          if ( ! this.isHit ) {
            this.isHit = true;
            this.vel.x *= -1.5;
            if ( this.vel.x >= this.maxVel ) {
              this.vel.x = this.maxVel;
            }
            myGame.pauseFrames = 3;
            $( '.animated' ).addClass( 'paused' );
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