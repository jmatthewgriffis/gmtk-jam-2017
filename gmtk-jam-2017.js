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
      this.wrapper.html.bind( 'animationend', this.shakeDone );

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
      this.player.init();

      this.numEnemies = 0;
      this.addEnemy();

      this.gameObjects.filter( obj => ! obj.beamWeapon ).forEach( obj => obj.init() );
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

      this.updateStars();

      this.gameObjects.forEach( obj => {
        if ( ! obj.dead ) { obj.update(); }
        if ( ! this.isImpact ) { this.removeTheDead(); }
        // if ( ! this.numEnemies && ! this.player.dead ) { this.addEnemy(); }
      } );
    }

    this.shakeDone = event => {
      let animation = event.originalEvent.animationName;
      if ( ! animation.match( 'screenshake' ) ) { return; }

      this.wrapper.html.css( 'animation', 'none' );

      this.removeTheDead();

      this.isImpact = false;
      this.allowInput = true;
    }

    this.removeTheDead = () => {
      let removeGameObjects = [];

      this.gameObjects.forEach( ( obj, index ) => {
        if ( obj.dead ) {
          obj.html.remove();
          if ( obj.beamWeapon ) { obj.beamWeapon.beam.attackHitbox.html.remove(); }
          removeGameObjects.push( index );
        }
      } );

      removeGameObjects.forEach( index => this.gameObjects.splice( index, 1 ) );
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

    this.addEnemy = () => {
      let size = {
        x: 30,
        y: 30
      };

      let margin = 50;

      let pos = {
        x: -margin + Math.floor( ( Math.random() * ( myGame.wrapper.innerSize.x + margin ) ) ),
        y: -margin
      };

      let posDiff = {
        x: pos.x - this.player.pos.x,
        y: pos.y - this.player.pos.y
      };

      let velMult = posDiff.x / posDiff.y;

      let baseVel = 5;

      let vel = {
        x: baseVel * velMult,
        y: baseVel
      };

      this.gameObjects.push( new Enemy( size, pos, vel ) );

      this.numEnemies += 1;
    }

    // this.getPosInWrapper = obj => {
    //   let offset = obj.html.offset();

    //   return {
    //     x: offset.left - this.wrapper.absPos.left + obj.size.x * 0.5,
    //     y: offset.top - this.wrapper.absPos.top + obj.size.y * 0.5
    //   }
    // }

    this.impact = ( pauseFrames, screenshakeNum = undefined ) => {
      this.isImpact = true;
      this.allowInput = false;
      this.pauseFrames = pauseFrames;
      $( '.animated' ).addClass( 'paused' );
      this.wrapper.html.css( 'animation', `screenshake${ screenshakeNum ? screenshakeNum : ( this.player.absorb ? 2 : 1 ) } ${ 0.1 * pauseFrames }s ease` );
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
      if ( ! this.allowInput ) { return; }

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
      this.dead = false;

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
      if ( ! animation.match( 'spinC' ) ) { return; }

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

  function Enemy( size, pos, vel ) {
    let html = $( '.enemy.template' ).clone().removeClass( 'template' );

    GameObject.call( this, html, size, pos, true, vel );

    this.init = () => {
      this.initBasic();

      this.maxVel = 50;
      this.dead = false;
    };

    this.update = () => {
      this.updateBasic();

      if ( ( this.pos.x < -this.size.x && this.vel.x < 0 )
        || ( this.pos.x > myGame.wrapper.innerSize.x + this.size.x && this.vel.x > 0 )
        || ( this.pos.y < -this.size.y && this.vel.y < 0 )
        || ( this.pos.y > myGame.wrapper.innerSize.y + this.size.y && this.vel.y > 0 ) ) {
        // console.log('dead!')
        // this.dead = true;
        // myGame.numEnemies -= 1;
        this.vel.x *= -1;
        this.vel.y *= -1;
      }

      if ( myGame.detectCollision( myGame.player, this ) ) {
        myGame.impact( 15, 3 );
        this.dead = true;
        myGame.numEnemies -= 1;
        myGame.player.dead = true;
        myGame.player.html.css( 'background', 'none' );
      }

      if ( myGame.player.isSpinning ) {
        if ( myGame.detectCollision( myGame.player.beamWeapon.beam.attackHitbox, this ) ) {
          if ( ! this.isHit ) {
            myGame.impact( 3 );
            this.isHit = true;
            this.vel.x *= -1.5;
            this.vel.y *= -1.5;
            if ( Math.abs( this.vel.x ) >= this.maxVel ) {
              this.vel.x = this.maxVel * ( this.vel.x < 1 ? -1 : 1 );
            }
            if ( Math.abs( this.vel.y ) >= this.maxVel ) {
              this.vel.y = this.maxVel * ( this.vel.y < 1 ? -1 : 1 );
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