class VRButton{

	constructor( renderer, options ) {
        this.renderer = renderer;
        if (options !== undefined){
            this.onSessionStart = options.onSessionStart;
            this.onSessionEnd = options.onSessionEnd;
            this.sessionInit = options.sessionInit;
            this.sessionMode = ( options.inline !== undefined && options.inline ) ? 'inline' : 'immersive-vr';
        }else{
            this.sessionMode = 'immersive-vr';
        }
        
       if (this.sessionInit === undefined ) this.sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor' ] };
        
        if ( 'xr' in navigator ) {

			const button = document.createElement( 'button' );
			button.style.display = 'none';
            button.style.height = '40px';            
            
			navigator.xr.isSessionSupported( this.sessionMode ).then( ( supported ) => {

				supported ? this.showEnterVR( button ) : this.showWebXRNotFound( button );
                if (options && options.vrStatus) options.vrStatus( supported );
                
			} );
            
            document.body.appendChild( button );

		} else {

			const message = document.createElement( 'a' );

			if ( window.isSecureContext === false ) {

				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WEBXR NEEDS HTTPS'; 

			} else {

				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'WEBXR NOT AVAILABLE';

			}

			message.style.left = '0px';
			message.style.width = '100%';
			message.style.textDecoration = 'none';

			this.stylizeElement( message, false );
            message.style.bottom = '0px';
            message.style.opacity = '1';
            
            document.body.appendChild ( message );
            
            if (options.vrStatus) options.vrStatus( false );

		}

    }

	showEnterVR( button ) {

        let currentSession = null;
        const self = this;
        
        this.stylizeElement( button, true, 20, true );
        
        function onSessionStarted( session ) {

            session.addEventListener( 'end', onSessionEnded );

            self.renderer.xr.setSession( session );
            self.stylizeElement( button, false, 20, true );
            
            button.innerHTML = '<i class="fa-solid fa-door-closed"></i>';

            currentSession = session;
            
            if (self.onSessionStart !== undefined) self.onSessionStart();

        }

        function onSessionEnded( ) {

            currentSession.removeEventListener( 'end', onSessionEnded );

            self.stylizeElement( button, true, 20, true );
            button.innerHTML = '<i class="fa-solid fa-vr-cardboard"></i>  <i class="fa-solid fa-headphones"></i>'; 

            currentSession = null;
            
            if (self.onSessionEnd !== undefined) self.onSessionEnd();

        }

        //

        button.style.display = '';
        button.style.right = '30px';
        button.style.bottom = '30px';
        button.style.width = '80px';
        button.style.cursor = 'pointer';
        button.innerHTML = '<i class="fa-solid fa-vr-cardboard"></i>  <i class="fa-solid fa-headphones"></i>';        

        button.onmouseenter = function () {
            
            button.style.fontSize = '12px'; 
            button.textContent = (currentSession===null) ? 'ENTER VR' : 'EXIT VR';
            button.style.opacity = '1.0';

        };

        button.onmouseleave = function () {
            
            button.style.fontSize = '20px'; 
            button.innerHTML = (currentSession===null) ? '<i class="fa-solid fa-vr-cardboard"></i>  <i class="fa-solid fa-headphones"></i>' : '<i class="fa-solid fa-door-open"></i>';
            
            button.style.opacity = '0.5';

        };

        button.onclick = function () {

            if ( currentSession === null ) {
 
                // WebXR's requestReferenceSpace only works if the corresponding feature
                // was requested at session creation time. For simplicity, just ask for
                // the interesting ones as optional features, but be aware that the
                // requestReferenceSpace call will fail if it turns out to be unavailable.
                // ('local' is always available for immersive sessions and doesn't need to
                // be requested separately.)

                navigator.xr.requestSession( self.sessionMode, self.sessionInit ).then( onSessionStarted );
                
            } else {
                
                currentSession.end();
               
            }

        };

    }

    disableButton(button) {

        button.style.cursor = 'auto';
        button.style.opacity = '0.5';
        
        button.onmouseenter = null;
        button.onmouseleave = null;

        button.onclick = null;
    }

    showWebXRNotFound( button ) {
        this.stylizeElement( button, false );
        
        this.disableButton(button);

        button.style.display = '';
        button.style.width = '100%';
        button.style.right = '0px';
        button.style.bottom = '0px';
        button.style.border = '';
        button.style.opacity = '1';
        button.style.fontSize = '10px';
        button.textContent = 'VR NOT SUPPORTED';

    }

    stylizeElement( element, active = true, fontSize = 20, ignorePadding = false ) {

        element.style.position = 'absolute';
        element.style.bottom = '30px';
        if (!ignorePadding) element.style.padding = '12px 6px';
        element.style.border = '3px solid #0a0a0a';
        element.style.borderRadius = '4px';
        element.style.background = (active) ? 'rgba(1,135,0,1)' : 'rgba(180,20,20,1)';
        element.style.color = '#0a0a0a';
        element.style.font = `bold ${fontSize}px sans-serif`;
        element.style.textAlign = 'center';
        element.style.opacity = '0.5';
        element.style.outline = 'none';
        element.style.zIndex = '10000';

    }

		

};

export { VRButton };